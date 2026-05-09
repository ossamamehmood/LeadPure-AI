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
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const [googleRes, cloudflareRes] = await Promise.allSettled([
        fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain_clean)}&type=MX`, { signal: controller.signal }),
        fetch(`https://cloudflare-dns.com/query?name=${encodeURIComponent(domain_clean)}&type=MX`, {
          headers: { 'accept': 'application/dns-json' },
          signal: controller.signal
        })
      ]);
      
      clearTimeout(timeoutId);

      let hasMx = false;
      let records: any[] = [];

      // Primary check: Google DNS
      if (googleRes.status === 'fulfilled' && googleRes.value.ok) {
        try {
          const data = await googleRes.value.json() as any;
          if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
            hasMx = true;
            records = data.Answer;
          } else if (data.Status === 3) { // NXDOMAIN
            hasMx = false;
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
          }
        } catch (e) { /* silent fail */ }
      }
      
      res.json({ 
        hasMx: hasMx,
        records: records 
      });
    } catch (error) {
      console.error(`Root DNS check failed for ${domain}:`, error);
      // Final desperation fallback: Native Node DNS (if available in the runtime)
      try {
        const dnsRecords = await resolveMx(domain);
        res.json({ 
          hasMx: dnsRecords && dnsRecords.length > 0,
          records: dnsRecords || []
        });
      } catch (localError) {
        res.json({ 
          hasMx: true, // Risky fallback to avoid false negatives on network errors
          error: "DNS_NETWORK_FAILURE"
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