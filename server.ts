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
    res.json({ status: "ok" });
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
      
      // Parallel fetch from primary DoH providers
      // We use a AbortController to ensure we don't hang if one provider is slow
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

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

      // Primary check: Google DNS
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
        } catch (e) { /* silent fail */ }
      }

      // Secondary check: Cloudflare DNS (if Google was inconclusive)
      if (!hasMx && cloudflareRes.status === 'fulfilled' && cloudflareRes.value.ok) {
        try {
          const data = await cloudflareRes.value.json() as any;
          if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
            hasMx = true;
            records = data.Answer;
            source = 'cloudflare';
          }
        } catch (e) { /* silent fail */ }
      }
      
      res.json({ 
        hasMx: hasMx,
        records: records,
        source: source
      });
    } catch (error) {
      console.error(`Root DNS check failed for ${domain}:`, error);
      // Final desperation fallback: Native Node DNS resolution
      try {
        const dnsRecords = await resolveMx(domain);
        res.json({ 
          hasMx: dnsRecords && dnsRecords.length > 0,
          records: dnsRecords || [],
          source: 'local_node'
        });
      } catch (localError) {
        res.json({ 
          hasMx: false, // In strict mode, if we can't verify, we should block to avoid bounce
          error: "DNS_FINAL_FAILURE",
          source: 'failure'
        });
      }
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
