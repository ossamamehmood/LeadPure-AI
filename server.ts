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

// SINKHOLE & PARKING INTEL (Enterprise Grade)
const isKnownSinkhole = (records: any[]) => {
  const toxicPatterns = [
    '127.0.0.1', 'localhost', 'sinkhole', 'honey', 'trap', 'parking', 'sedo', 'bodis', 'uniregistry',
    '0.0.0.0', '185.230.63', '34.102.136', '199.59.243', '104.239.213', '192.64.119', '198.54.117'
  ];
  return records.some((r: any) => 
     r.data && toxicPatterns.some(p => String(r.data).toLowerCase().includes(p))
  );
};

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

      // Fast, deterministic DNS lookup for Vercel
      const performLookup = async (): Promise<{ success: boolean, hasMx: boolean, source: string, records: any[] }> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds max per fetch
        
        // 1. Try Native DNS first (Fastest on good VPCs)
        try {
          const nativeRecords = await resolveMx(domain_clean);
          if (isKnownSinkhole(nativeRecords)) return { success: true, hasMx: false, source: 'native:sinkhole_detected', records: [] };
          if (nativeRecords && nativeRecords.length > 0) return { success: true, hasMx: true, source: 'native-strict', records: nativeRecords };
        } catch (nativeErr: any) {
          const errCode = nativeErr.code || '';
          if (errCode === 'ENOTFOUND' || errCode === 'ENODATA') return { success: true, hasMx: false, source: 'native-nx-strict', records: [] };
          // If timeouts/refused, we fall back to DoH
        }

        // 2. Fallback to DoH (Google)
        try {
          const fetchOptions = { 
            signal: controller.signal,
            headers: { 'accept': 'application/dns-json' }
          };
          const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain_clean)}&type=MX`, fetchOptions);
          if (r.ok) {
            const data = await r.json() as any;
            if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
              if (isKnownSinkhole(data.Answer)) return { success: true, hasMx: false, source: 'doh:sinkhole_mx_intercept', records: [] };
              return { success: true, hasMx: true, source: 'doh-google', records: data.Answer };
            }
            if (data.Status === 3 || (data.Status === 0 && !data.Answer)) {
              return { success: true, hasMx: false, source: 'doh-nx-strict', records: [] };
            }
          }
        } catch (e) {
          // DoH failed
        } finally {
          clearTimeout(timeoutId);
        }

        return { success: false, hasMx: false, source: 'error_environmental_drift', records: [] };
      };

      // Ensure we NEVER exceed Vercel 10s timeout (Bound to 8.5s)
      const resultPromise = performLookup();
      const timeoutPromise = new Promise<{success: boolean, hasMx: boolean, source: string, records: any[]}>((resolve) => {
        setTimeout(() => resolve({ success: false, hasMx: false, source: 'engine_timeout_safety', records: [] }), 8500);
      });

      let result = await Promise.race([resultPromise, timeoutPromise]);
      
      // FINAL ENVIRONMENT SYNC: Absolute Consistency Protocol
      if (!result.success) {
        result = { success: true, hasMx: false, source: 'strict_rejection_safety', records: [] };
      }

      // Cache result for SESSION consistency
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
      console.log(`[DNS_API] CONSENSUS: ${domain_clean} -> ${result.hasMx} [${result.source}]`);
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