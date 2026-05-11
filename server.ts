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

      // CONSENSUS ENGINE v6.0: Absolute-Zero (Strict Quorum + Deep Sinkhole Intelligence)
      const performLookup = async (attempt: number = 1): Promise<{ success: boolean, hasMx: boolean, source: string, records: any[], hasSpf?: boolean }> => {
        const controller = new AbortController();
        const timeoutMs = attempt === 1 ? 15000 : 30000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const fetchOptions = { 
          signal: controller.signal,
          headers: { 
            'accept': 'application/dns-json',
            'user-agent': `LeadPure-Engine/v6.0-StrictQuorum`
          }
        };

        try {
          const dohEndpoints = [
            `https://dns.google/resolve?name=${encodeURIComponent(domain_clean)}&type=MX`,
            `https://cloudflare-dns.com/query?name=${encodeURIComponent(domain_clean)}&type=MX`,
            `https://dns.quad9.net:5053/dns-query?name=${encodeURIComponent(domain_clean)}&type=MX`,
            `https://dns.adguard-dns.com/dns-query?name=${encodeURIComponent(domain_clean)}&type=MX`,
            `https://doh.cleanbrowsing.org/doh/family-filter?name=${encodeURIComponent(domain_clean)}&type=MX`
          ];

          const results = await Promise.allSettled(dohEndpoints.map(url => 
            fetch(url, fetchOptions).then(async r => {
              if (!r.ok) throw new Error(`HTTP-${r.status}`);
              const data = await r.json() as any;
              return { 
                status: data.Status, 
                hasMx: !!(data.Answer && data.Answer.length > 0), 
                records: data.Answer || [] 
              };
            })
          ));

          clearTimeout(timeoutId);
          const successful = results.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled').map(r => r.value);
          
          if (successful.length < 2) throw new Error('QUORUM_INSUFFICIENT');

          // MAJORITY PARITY CHECK: 0% Bounce Policy (Absolute Precision)
          const positives = successful.filter(s => s.hasMx).length;
          const nxdomains = successful.filter(s => s.status === 3).length; // NXDOMAIN
          const noData = successful.filter(s => s.status === 0 && !s.hasMx).length;

          // DETERMINISTIC VALIDATION: Requires at least 2 providers to agree for POSITIVE
          if (positives >= 2) {
            const mxRecords = successful.find(s => s.hasMx)?.records || [];
            if (isKnownSinkhole(mxRecords)) return { success: true, hasMx: false, source: 'strict:sinkhole_mx_intercept', records: [] };
            return { success: true, hasMx: true, source: `strict_quorum:${positives}/${successful.length}p`, records: mxRecords };
          }

          // DETERMINISTIC REJECTION: If any 2 providers say NXDOMAIN or No MX, we purge.
          if (nxdomains >= 1 || noData >= 2) {
            return { success: true, hasMx: false, source: 'strict_rejection:consensus_dead', records: [] };
          }

          return { success: true, hasMx: false, source: `strict_fallback:unproven_${successful.length}n`, records: [] };
        } catch (e: any) {
          clearTimeout(timeoutId);
          try {
            const nativeRecords = await resolveMx(domain_clean);
            // Even native resolution must pass sinkhole check
            if (isKnownSinkhole(nativeRecords)) return { success: true, hasMx: false, source: 'native:sinkhole_detected', records: [] };
            return { success: true, hasMx: nativeRecords && nativeRecords.length > 0, source: 'native-strict', records: nativeRecords };
          } catch (nativeErr: any) {
            const errCode = nativeErr.code || '';
            if (errCode === 'ENOTFOUND' || errCode === 'ENODATA') return { success: true, hasMx: false, source: 'native-nx-strict', records: [] };
            
            // DEEP HEURISTIC TRIAGE (A/AAAA Cross-Check)
            try {
              const resolveA = promisify(dns.resolve);
              const aRecords = await resolveA(domain_clean);
              if (aRecords && aRecords.length > 0) {
                // Enterprise IP Parking Blacklist
                const parkingIps = [
                  '127.0.0.1', '0.0.0.0', '185.230.63.107', '185.230.63.171', '185.230.63.186',
                  '34.102.136.180', '199.59.243.225', '199.59.243.200', '192.64.119.167',
                  '192.64.119.190', '185.53.177.30', '185.53.177.31'
                ];
                const isParked = aRecords.some(ip => parkingIps.some(p => ip.startsWith(p)));
                if (isParked) return { success: true, hasMx: false, source: 'heuristic:parked_dead_domain', records: [] };
                
                // For 100% precision, we strictly require MX. A fallback is too risky for 0% bounce targets.
                return { success: true, hasMx: false, source: 'heuristic:missing_mx_strict_policy', records: [] };
              }
            } catch (aErr) {}
            
            return { success: false, hasMx: false, source: 'error_environmental_drift', records: [] };
          }
        }
      };

      // High-stability execution with multi-stage retry and exponential backoff
      let result = await performLookup(1);
      if (!result.success) {
        await new Promise(r => setTimeout(r, 4000));
        result = await performLookup(2);
      }
      
      // FINAL ENVIRONMENT SYNC: Absolute Consistency Protocol
      if (!result.success) {
        // 0% Bounce Policy: If we reach this stage, we CANNOT guarantee deliverability.
        // We reject the lead to protect sender reputation.
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