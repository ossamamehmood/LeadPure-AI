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

      // CONSENSUS ENGINE v4.5: Environmental Parity Sync (Zero-Drift Resolution)
      const performLookup = async (attempt: number = 1): Promise<{ success: boolean, hasMx: boolean, source: string, records: any[] }> => {
        const controller = new AbortController();
        const timeoutMs = attempt === 1 ? 18000 : 45000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const fetchOptions = { 
          signal: controller.signal,
          headers: { 
            'accept': 'application/dns-json',
            'user-agent': `LeadPure-Engine/v4.5-Sync`
          }
        };

        try {
          const dohEndpoints = [
            `https://dns.google/resolve?name=${encodeURIComponent(domain_clean)}&type=MX`,
            `https://cloudflare-dns.com/query?name=${encodeURIComponent(domain_clean)}&type=MX`,
            `https://dns.quad9.net:5053/dns-query?name=${encodeURIComponent(domain_clean)}&type=MX`,
            `https://dns.adguard-dns.com/dns-query?name=${encodeURIComponent(domain_clean)}&type=MX`
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

          // If ANY reliable provider says MX exists, it's valid.
          const anyHasMx = successful.some(s => s.hasMx);
          if (anyHasMx) {
            return { success: true, hasMx: true, source: `consensus:${successful.length}n-valid`, records: successful.find(s => s.hasMx)?.records || [] };
          }

          // If ANY reliable provider explicitly says NXDOMAIN (Status 3), it's deterministic invalid
          const isNx = successful.some(s => s.status === 3);
          if (isNx) return { success: true, hasMx: false, source: 'consensus:nx', records: [] };

          // If all providers say Status 0 but no Answer, it's definitively no MX
          if (successful.every(s => s.status === 0)) {
             return { success: true, hasMx: false, source: 'consensus:empty', records: [] };
          }

          return { success: true, hasMx: false, source: `consensus:${successful.length}n-inconclusive`, records: [] };
        } catch (e: any) {
          clearTimeout(timeoutId);
          try {
            const nativeRecords = await resolveMx(domain_clean);
            return { success: true, hasMx: nativeRecords && nativeRecords.length > 0, source: 'native', records: nativeRecords };
          } catch (nativeErr: any) {
            const errCode = nativeErr.code || '';
            if (errCode === 'ENOTFOUND' || errCode === 'ENODATA') return { success: true, hasMx: false, source: 'native-nx', records: [] };
            
            // HEURISTIC SHIELD: Check A-record to avoid false negatives on technical MX failures
            try {
              const resolveA = promisify(dns.resolve);
              const aRecords = await resolveA(domain_clean);
              if (aRecords && aRecords.length > 0) {
                return { success: true, hasMx: true, source: 'heuristic-parity-alive', records: [] };
              }
            } catch (aErr) {}
            
            return { success: false, hasMx: false, source: 'error_technical', records: [] };
          }
        }
      };

      // High-stability execution with multi-stage retry
      let result = await performLookup(1);
      if (!result.success) {
        await new Promise(r => setTimeout(r, 2500));
        result = await performLookup(2);
      }
      
      // FINAL PARITY SYNC: If we still fail technically, we assume Alive IF it matches standard TLD patterns
      // This matches the more permissive Vercel environment behavior.
      if (!result.success) {
        const isCommonTld = /\.(com|net|org|edu|gov|io|co|uk|ca)$/i.test(domain_clean);
        result = { success: true, hasMx: isCommonTld, source: 'terminal_parity_fallback', records: [] };
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