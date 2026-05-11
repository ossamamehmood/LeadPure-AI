import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

// Server-side cache for DNS results (In-memory, lasts as long as lambda is warm)
const serverMxCache = new Map<string, { hasMx: boolean, source: string, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const app = express();
const PORT = 3000;

export async function createServer() {
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      node: process.version,
      env: process.env.NODE_ENV,
      platform: process.platform,
      cacheSize: serverMxCache.size
    });
  });

  // Professional DNS MX Check Proxy using Google and Cloudflare DNS-over-HTTPS (DoH)
  // This helps maintain consistency across different hosting providers (Vercel, AWS, GCP, etc.)
  app.get("/api/check-mx", async (req, res) => {
    const domain = req.query.domain as string;
    if (!domain) {
      return res.status(400).json({ error: "Domain required" });
    }

    try {
      const domain_clean = domain.toLowerCase().trim().replace(/\.$/, '');
      
      // Check Server Cache First
      const cached = serverMxCache.get(domain_clean);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return res.json({
          hasMx: cached.hasMx,
          records: [],
          source: `server_cache:${cached.source}`
        });
      }

      console.log(`[DNS_API] PROXY_REQUEST: ${domain_clean} (Node: ${process.version})`);
      
      let hasMx = false;
      let records: any[] = [];
      let source = 'unknown';

      // Advanced Two-Tier Network Retry Logic with Deterministic Feedback
      const performLookup = async (attempt: number = 1): Promise<{ success: boolean, hasMx: boolean, source: string, records: any[] }> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), attempt === 1 ? 4000 : 8000);

        const fetchOptions = { 
          signal: controller.signal,
          headers: { 
            'accept': 'application/dns-json',
            'user-agent': `LeadPure-Validation-Engine/3.0.0-Attempt-${attempt}`
          }
        };

        try {
          const [googleRes, cloudflareRes] = await Promise.allSettled([
            fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain_clean)}&type=MX`, fetchOptions),
            fetch(`https://cloudflare-dns.com/query?name=${encodeURIComponent(domain_clean)}&type=MX`, fetchOptions)
          ]);
          
          clearTimeout(timeoutId);

          // Tier 1: Check Google (Primary Source of Truth)
          if (googleRes.status === 'fulfilled' && googleRes.value.ok) {
            const data = await googleRes.value.json() as any;
            if (data.Status === 0) {
              if (data.Answer && data.Answer.length > 0) {
                return { success: true, hasMx: true, source: 'google', records: data.Answer };
              } else {
                return { success: true, hasMx: false, source: 'google-no-mx', records: [] };
              }
            } else if (data.Status === 3) { // NXDOMAIN
              return { success: true, hasMx: false, source: 'google-nx', records: [] };
            }
          }

          // Tier 2: Check Cloudflare (Independent Verification)
          if (cloudflareRes.status === 'fulfilled' && cloudflareRes.value.ok) {
            const data = await cloudflareRes.value.json() as any;
            if (data.Status === 0) {
              if (data.Answer && data.Answer.length > 0) {
                return { success: true, hasMx: true, source: 'cloudflare', records: data.Answer };
              } else {
                return { success: true, hasMx: false, source: 'cloudflare-no-mx', records: [] };
              }
            } else if (data.Status === 3) {
              return { success: true, hasMx: false, source: 'cloudflare-nx', records: [] };
            }
          }
          
          return { success: false, hasMx: false, source: 'unknown', records: [] };
        } catch (e) {
          clearTimeout(timeoutId);
          return { success: false, hasMx: false, source: 'error', records: [] };
        }
      };

      const result = await performLookup(1);
      if (!result.success) {
        console.log(`[DNS_API] RETRY_PROTOCOL_TRIGGERED: ${domain_clean}`);
        await new Promise(r => setTimeout(r, 500)); 
        const retryResult = await performLookup(2);
        if (retryResult.success) {
           result.success = true;
           result.hasMx = retryResult.hasMx;
           result.source = retryResult.source;
           result.records = retryResult.records;
        }
      }

      if (!result.success) {
        console.error(`[DNS_API] CRITICAL_RESOLUTION_FAILURE: ${domain_clean}. Enforcing deterministic null status.`);
        result.source = 'engine_error_parity_match';
      }

      // Cache result for cross-session consistency within same lambda lifecycle
      serverMxCache.set(domain_clean, { 
        hasMx: result.hasMx, 
        source: result.source, 
        timestamp: Date.now() 
      });

      res.json({ 
        hasMx: result.hasMx,
        records: result.records,
        source: result.source
      });
      console.log(`[DNS_API] RESOLUTION: ${domain_clean} -> ${result.hasMx} [${result.source}]`);
    } catch (error) {
      console.error(`[DNS_API] Root DNS check failed for ${domain}:`, error);
      // Desperation fallback for restricted environments (Vercel/CloudRun)
      res.json({ 
        hasMx: false, // Strict: Default to false on failure to ensure 0% bounce
        records: [],
        source: 'engine_failure_fallback'
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

if (process.env.NODE_ENV !== "test") {
  createServer().then((app) => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default app; 
 
