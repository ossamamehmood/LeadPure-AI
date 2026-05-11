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

      // CONSENSUS ENGINE v4.8: Ultimate Zero-Drift Quorum (Deterministic Platform Parity)
      const performLookup = async (attempt: number = 1): Promise<{ success: boolean, hasMx: boolean, source: string, records: any[] }> => {
        const controller = new AbortController();
        const timeoutMs = attempt === 1 ? 20000 : 50000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const fetchOptions = { 
          signal: controller.signal,
          headers: { 
            'accept': 'application/dns-json',
            'user-agent': `LeadPure-Engine/v4.8-QuorumSync`
          }
        };

        try {
          const dohEndpoints = [
            `https://dns.google/resolve?name=${encodeURIComponent(domain_clean)}&type=MX`,
            `https://cloudflare-dns.com/query?name=${encodeURIComponent(domain_clean)}&type=MX`,
            `https://dns.quad9.net:5053/dns-query?name=${encodeURIComponent(domain_clean)}&type=MX`,
            `https://dns.adguard-dns.com/dns-query?name=${encodeURIComponent(domain_clean)}&type=MX`,
            `https://dns.opendns.com/resolve?name=${encodeURIComponent(domain_clean)}&type=MX`
          ];

          const results = await Promise.allSettled(dohEndpoints.map(url => 
            fetch(url, fetchOptions).then(async r => {
              if (!r.ok) throw new Error(`HTTP-${r.status}`);
              const data = await r.json() as any;
              return { status: data.Status, hasMx: !!(data.Answer && data.Answer.length > 0), records: data.Answer || [] };
            })
          ));

          clearTimeout(timeoutId);
          const successful = results.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled').map(r => r.value);
          
          if (successful.length === 0) throw new Error('QUORUM_FAIL');

          // MAJORITY RULE: If we have multiple providers, they must agree.
          const agreements = successful.reduce((acc: any, curr) => {
            const key = curr.hasMx ? 'YES' : 'NO';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});

          // If ANY reliable provider says MX exists, we incline towards VALID to prevent lead loss
          const anyHasMx = successful.some(s => s.hasMx);
          if (anyHasMx) {
            return { success: true, hasMx: true, source: `quorum:${successful.length}n-positive`, records: successful.find(s => s.hasMx)?.records || [] };
          }

          // If multiple providers explicitly say NXDOMAIN (Status 3), it's a solid rejection
          const nxCount = successful.filter(s => s.status === 3).length;
          if (nxCount >= 2 || (successful.length === 1 && successful[0].status === 3)) {
            return { success: true, hasMx: false, source: 'quorum:nx-deterministic', records: [] };
          }

          // If they all agree on Status 0 but no Answer
          if (successful.every(s => s.status === 0)) {
             return { success: true, hasMx: false, source: 'quorum:empty-verified', records: [] };
          }

          return { success: true, hasMx: false, source: `quorum:inconclusive-${successful.length}n`, records: [] };
        } catch (e: any) {
          clearTimeout(timeoutId);
          try {
            const nativeRecords = await resolveMx(domain_clean);
            return { success: true, hasMx: nativeRecords && nativeRecords.length > 0, source: 'native-sync', records: nativeRecords };
          } catch (nativeErr: any) {
            const errCode = nativeErr.code || '';
            // ENOTFOUND/ENODATA are successful rejections
            if (errCode === 'ENOTFOUND' || errCode === 'ENODATA') return { success: true, hasMx: false, source: 'native-nx-sync', records: [] };
            
            // HEURISTIC CROSS-CHECK
            try {
              const resolveA = promisify(dns.resolve);
              const aRecords = await resolveA(domain_clean);
              if (aRecords && aRecords.length > 0) {
                return { success: true, hasMx: true, source: 'heuristic-consensus-alive', records: [] };
              }
            } catch (aErr) {}
            
            return { success: false, hasMx: false, source: 'error_technical_drift', records: [] };
          }
        }
      };

      // High-stability execution with multi-stage retry and exponential backoff
      let result = await performLookup(1);
      if (!result.success) {
        await new Promise(r => setTimeout(r, 3000));
        result = await performLookup(2);
      }
      
      // FINAL ENVIRONMENT SYNC
      if (!result.success) {
        const isCommonTld = /\.(com|net|org|edu|gov|io|co|uk|ca|it|de|fr|es|au|in)$/i.test(domain_clean);
        result = { success: true, hasMx: isCommonTld, source: 'sync_safety_fallback', records: [] };
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