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
      
      const providers = [
        { name: 'google', url: `https://dns.google/resolve?name=${encodeURIComponent(domain_clean)}&type=MX` },
        { name: 'cloudflare', url: `https://cloudflare-dns.com/query?name=${encodeURIComponent(domain_clean)}&type=MX` },
        { name: 'quad9', url: `https://dns.quad9.net/dns-query?name=${encodeURIComponent(domain_clean)}&type=MX` }
      ];

      let hasMx = false;
      let records: any[] = [];
      let source = 'none';
      let success = false;

      // Try providers one by one if needed, or in parallel
      // To ensure we get a "Status 0" or "Status 3" result
      for (const provider of providers) {
        if (success) break;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const response = await fetch(provider.url, {
            signal: controller.signal,
            headers: { 'accept': 'application/dns-json' }
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json() as any;
            // Status 0: Success, Status 3: NXDOMAIN (Definitive)
            if (data.Status === 0 || data.Status === 3) {
              hasMx = data.Status === 0 && data.Answer && data.Answer.length > 0;
              records = data.Answer || [];
              source = provider.name;
              success = true;
              if (data.Status === 3) source = `${provider.name}-nx`;
            }
          }
        } catch (e) {
          console.warn(`[DNS_API] Provider ${provider.name} failed for ${domain_clean}`);
        }
      }

      if (!success) {
        // Final fallback: Native DNS (if allowed)
        try {
          const dnsRecords = await resolveMx(domain_clean);
          hasMx = dnsRecords && dnsRecords.length > 0;
          records = dnsRecords || [];
          source = 'native-node';
          success = true;
        } catch (e) {
          console.warn(`[DNS_API] Native node DNS failed for ${domain_clean}`);
        }
      }
      
      res.json({ 
        hasMx: success ? hasMx : true, // Only fallback to true if absolutely everything failed
        records: records,
        source: success ? source : 'all_engines_failed_fallback',
        verified: success
      });
      console.log(`[DNS_API] PROXY_RESPONSE: ${domain_clean} -> ${hasMx} (Source: ${source})`);
    } catch (error) {
      console.error(`[DNS_API] Critical engine crash for ${domain}:`, error);
      res.json({ 
        hasMx: true,
        records: [],
        source: 'system_error_fallback',
        verified: false
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
