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
      // Use Google DNS-over-HTTPS for more reliable lookups in serverless environments
      // and to bypass potential local DNS restrictions/slowness
      const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`);
      
      if (!response.ok) {
        throw new Error(`Google DNS API returned ${response.status}`);
      }
      
      const data = await response.json() as any;
      
      // Google DNS Status 0 means NOERROR
      const hasMx = data.Status === 0 && data.Answer && data.Answer.length > 0;
      
      res.json({ 
        hasMx: hasMx,
        records: data.Answer || []
      });
    } catch (error) {
      console.error(`MX check failed for ${domain}:`, error);
      // Fallback to local DNS if DoH fails
      try {
        const records = await resolveMx(domain);
        res.json({ 
          hasMx: records && records.length > 0,
          records: records || []
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