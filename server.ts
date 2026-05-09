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

  // Professional DNS MX Check Proxy using Google DNS-over-HTTPS for maximum reliability
  app.get("/api/check-mx", async (req, res) => {
    const domain = req.query.domain as string;
    if (!domain) {
      return res.status(400).json({ error: "Domain required" });
    }

    try {
      // Use both Google and Cloudflare DoH in parallel for maximum reliability and consistency across environments
      const domain_clean = domain.toLowerCase().trim();
      
      const [googleRes, cloudflareRes] = await Promise.allSettled([
        fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain_clean)}&type=MX`),
        fetch(`https://cloudflare-dns.com/query?name=${encodeURIComponent(domain_clean)}&type=MX`, {
          headers: { 'accept': 'application/dns-json' }
        })
      ]);
      
      let hasMx = false;
      let records: any[] = [];

      // If Google confirms MX, we're good
      if (googleRes.status === 'fulfilled' && googleRes.value.ok) {
        const data = await googleRes.value.json() as any;
        if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
          hasMx = true;
          records = data.Answer;
        }
      }

      // If Cloudflare confirms MX (and Google didn't or was slow), use that
      if (!hasMx && cloudflareRes.status === 'fulfilled' && cloudflareRes.value.ok) {
        const data = await cloudflareRes.value.json() as any;
        if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
          hasMx = true;
          records = data.Answer;
        }
      }
      
      res.json({ 
        hasMx: hasMx,
        records: records 
      });
    } catch (error) {
      console.error(`DNS check failed for ${domain}:`, error);
      // Final fallback to native DNS resolution
      try {
        const dnsRecords = await resolveMx(domain);
        res.json({ 
          hasMx: dnsRecords && dnsRecords.length > 0,
          records: dnsRecords || []
        });
      } catch (localError) {
        res.json({ 
          hasMx: false, 
          error: error instanceof Error ? error.message : String(error) 
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