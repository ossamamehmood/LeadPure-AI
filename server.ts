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

      // Advanced Quad-Tier Parallel Resolution Engine with Deterministic Feedback
      const performLookup = async (attempt: number = 1): Promise<{ success: boolean, hasMx: boolean, source: string, records: any[] }> => {
        const controller = new AbortController();
        // Extended timeouts for high-latency serverless environments
        const timeoutMs = attempt === 1 ? 10000 : 20000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const fetchOptions = { 
          signal: controller.signal,
          headers: { 
            'accept': 'application/dns-json',
            'user-agent': `LeadPure-Validation-Engine/3.2.2-Attempt-${attempt}`
          }
        };

        try {
          // Parallel execution of multiple DoH providers for maximum availability
          const lookupPromises = [
            fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain_clean)}&type=MX`, fetchOptions).then(async r => {
              if (!r.ok) throw new Error(`G-HTTP-${r.status}`);
              const data = await r.json() as any;
              if (data.Status === 0) return { success: true, hasMx: (data.Answer && data.Answer.length > 0), source: 'google', records: data.Answer || [] };
              if (data.Status === 3) return { success: true, hasMx: false, source: 'google-nx', records: [] };
              throw new Error(`G-DNS-${data.Status}`);
            }),
            fetch(`https://cloudflare-dns.com/query?name=${encodeURIComponent(domain_clean)}&type=MX`, fetchOptions).then(async r => {
              if (!r.ok) throw new Error(`CF-HTTP-${r.status}`);
              const data = await r.json() as any;
              if (data.Status === 0) return { success: true, hasMx: (data.Answer && data.Answer.length > 0), source: 'cloudflare', records: data.Answer || [] };
              if (data.Status === 3) return { success: true, hasMx: false, source: 'cloudflare-nx', records: [] };
              throw new Error(`CF-DNS-${data.Status}`);
            }),
            fetch(`https://dns.quad9.net:5053/dns-query?name=${encodeURIComponent(domain_clean)}&type=MX`, fetchOptions).then(async r => {
              if (!r.ok) throw new Error(`Q9-HTTP-${r.status}`);
              const data = await r.json() as any;
              if (data.Status === 0) return { success: true, hasMx: (data.Answer && data.Answer.length > 0), source: 'quad9', records: data.Answer || [] };
              if (data.Status === 3) return { success: true, hasMx: false, source: 'quad9-nx', records: [] };
              throw new Error(`Q9-DNS-${data.Status}`);
            })
          ];

          // Winner takes all: wait for the fastest successful DNS response
          const fastestResponse = await Promise.any(lookupPromises);
          
          clearTimeout(timeoutId);
          return fastestResponse;
        } catch (e) {
          clearTimeout(timeoutId);
          
          // Tier 4: Native DNS Direct Resolution (Node.js fallback)
          try {
            const nativeRecords = await resolveMx(domain_clean);
            return { 
              success: true, 
              hasMx: nativeRecords && nativeRecords.length > 0, 
              source: 'native-dns', 
              records: nativeRecords 
            };
          } catch (nativeErr: any) {
            // Treat ENOTFOUND and ENODATA as successful negative resolutions
            if (nativeErr.code === 'ENOTFOUND' || nativeErr.code === 'ENODATA' || nativeErr.message?.includes('queryMx ENOTFOUND')) {
              return { success: true, hasMx: false, source: 'native-nx', records: [] };
            }
            console.error(`[DNS_API] ALL_TIERS_FAILED for ${domain_clean}:`, nativeErr.message);
            return { success: false, hasMx: false, source: 'error', records: [] };
          }
        }
      };

      // Execute with high-stability retry protocol
      let result = await performLookup(1);
      if (!result.success) {
        console.log(`[DNS_API] RETRY_PROTOCOL_TRIGGERED: ${domain_clean}`);
        await new Promise(r => setTimeout(r, 1500)); 
        const retryResult = await performLookup(2);
        if (retryResult.success) {
           result = retryResult;
        }
      }

      if (!result.success) {
        console.error(`[DNS_API] CRITICAL_RESOLUTION_FAILURE: ${domain_clean}.`);
        result.source = 'engine_parity_error_match';
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
 
