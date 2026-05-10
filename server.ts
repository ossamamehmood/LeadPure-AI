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

      // Advanced Two-Tier Network Retry Logic
      const performLookup = async (attempt: number = 1): Promise<boolean> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000 + (attempt * 2000));

        const fetchOptions = { 
          signal: controller.signal,
          headers: { 
            'accept': 'application/dns-json',
            'user-agent': `LeadPure-Validation-Engine/2.9.0-Attempt-${attempt}`
          }
        };

        try {
          const [googleRes, cloudflareRes] = await Promise.allSettled([
            fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain_clean)}&type=MX`, fetchOptions),
            fetch(`https://cloudflare-dns.com/query?name=${encodeURIComponent(domain_clean)}&type=MX`, fetchOptions)
          ]);
          
          clearTimeout(timeoutId);

          // Tier 1: Check Google
          if (googleRes.status === 'fulfilled' && googleRes.value.ok) {
            const data = await googleRes.value.json() as any;
            if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
              hasMx = true;
              records = data.Answer;
              source = 'google';
              return true;
            } else if (data.Status === 3) { // NXDOMAIN is definitive
              hasMx = false;
              source = 'google-nx';
              return true;
            }
          }

          // Tier 2: Check Cloudflare (if Google fails or is inconclusive)
          if (cloudflareRes.status === 'fulfilled' && cloudflareRes.value.ok) {
            const data = await cloudflareRes.value.json() as any;
            if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
              hasMx = true;
              records = data.Answer;
              source = 'cloudflare';
              return true;
            }
          }
          
          return false;
        } catch (e) {
          clearTimeout(timeoutId);
          return false;
        }
      };

      // Execute with one retry if necessary
      let success = await performLookup(1);
      if (!success) {
        console.log(`[DNS_API] RE-ATTEMPTING: ${domain_clean}`);
        await new Promise(r => setTimeout(r, 1000)); // Cool-down
        success = await performLookup(2);
      }

      if (!success) {
        console.error(`[DNS_API] FINAL_FAILURE: ${domain_clean} after 2 attempts. Marking as False to ensure 0% bounce.`);
      }

      // Cache result server-side
      serverMxCache.set(domain_clean, { 
        hasMx, 
        source: success ? source : 'final_failure', 
        timestamp: Date.now() 
      });

      res.json({ 
        hasMx: hasMx,
        records: records,
        source: source
      });
      console.log(`[DNS_API] PROXY_RESPONSE: ${domain_clean} -> ${hasMx} (Source: ${source})`);
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
