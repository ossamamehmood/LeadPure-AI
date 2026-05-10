import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

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
      platform: process.platform
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
      console.log(`[DNS_API] PROXY_REQUEST: ${domain_clean} (Node: ${process.version})`);
      
      // Parallel fetch from primary DoH providers
      // We use a AbortController to ensure we don't hang if one provider is slow
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // Increased for stability

      // Cloudflare and Google DoH both support JSON responses
      const fetchOptions = { 
        signal: controller.signal,
        headers: { 
          'accept': 'application/dns-json',
          'user-agent': 'LeadPure-Validation-Engine/2.5.0'
        }
      };

      const [googleRes, cloudflareRes] = await Promise.allSettled([
        fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain_clean)}&type=MX`, fetchOptions),
        fetch(`https://cloudflare-dns.com/query?name=${encodeURIComponent(domain_clean)}&type=MX`, fetchOptions)
      ]);
      
      clearTimeout(timeoutId);

      let hasMx = false;
      let records: any[] = [];
      let source = 'unknown';

      // Primary check: Google DNS (MX)
      if (googleRes.status === 'fulfilled' && googleRes.value.ok) {
        try {
          const data = await googleRes.value.json() as any;
          if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
            hasMx = true;
            records = data.Answer;
            source = 'google';
          } else if (data.Status === 3) { // NXDOMAIN
            hasMx = false;
            source = 'google-nx';
          }
        } catch (e) { 
          console.error(`[DNS_API] Google Parse Error:`, e);
        }
      }

      // Secondary check: Cloudflare DNS (if Google was inconclusive)
      if (!hasMx && source !== 'google-nx' && cloudflareRes.status === 'fulfilled' && cloudflareRes.value.ok) {
        try {
          const data = await cloudflareRes.value.json() as any;
          if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
            hasMx = true;
            records = data.Answer;
            source = 'cloudflare';
          }
        } catch (e) { 
          console.error(`[DNS_API] Cloudflare Parse Error:`, e);
        }
      }

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
