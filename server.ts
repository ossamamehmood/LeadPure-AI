import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

// Server-side cache for DNS results (In-memory, lasts as long as lambda is warm)
const serverMxCache = new Map<string, { hasMx: boolean, hasA: boolean, hasSpf: boolean, hasDmarc: boolean, isSinkhole: boolean, smtpValid: boolean, smtpReason: string, source: string, timestamp: number }>();
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

  // Professional Deep DNS Verification Proxy
  // Returns MX, A, SPF, and DMARC status to provide an enterprise-grade domain health profile
  app.get("/api/verify-domain", async (req, res) => {
    const domain = req.query.domain as string;
    if (!domain) {
      return res.status(400).json({ error: "Domain required" });
    }

    try {
      const domain_clean = domain.toLowerCase().trim().replace(/\.$/, '');
      
      // Check Server Cache First
      const cached = serverMxCache.get(domain_clean) as any;
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return res.json({
          hasMx: cached.hasMx,
          hasA: cached.hasA,
          hasSpf: cached.hasSpf,
          hasDmarc: cached.hasDmarc,
          isSinkhole: cached.isSinkhole,
          smtpValid: cached.smtpValid,
          smtpReason: cached.smtpReason,
          source: `server_cache:${cached.source}`
        });
      }

      console.log(`[DNS_API] VERIFY_REQUEST: ${domain_clean} (Node: ${process.version})`);

      const resolveA = promisify(dns.resolve);
      const resolveTxt = promisify(dns.resolveTxt);

      const performLookup = async (): Promise<any> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        let hasMx = false;
        let hasA = false;
        let hasSpf = false;
        let hasDmarc = false;
        let isSinkhole = false;
        let smtpValid = false;
        let smtpReason = '';
        let source = 'native-strict';

        try {
          // 1. Resolve MX
          let mxHost = '';
          try {
            const mxRecords = await resolveMx(domain_clean);
            hasMx = mxRecords && mxRecords.length > 0;
            if (hasMx) {
              // Sort by priority
              mxRecords.sort((a, b) => a.priority - b.priority);
              mxHost = mxRecords[0].exchange;
            }
            if (isKnownSinkhole(mxRecords)) {
              isSinkhole = true;
              hasMx = false;
            }
          } catch (e: any) {
            hasMx = false;
          }

          // 2. Resolve A (Fallback if MX missing, or to check sinkhole)
          try {
            const aRecords = await resolveA(domain_clean);
            hasA = aRecords && aRecords.length > 0;
            if (isKnownSinkhole(aRecords.map(ip => ({ data: ip })))) {
              isSinkhole = true;
              hasA = false;
            }
          } catch (e) {}

          // 3. Resolve TXT (SPF)
          try {
            const txtRecords = await resolveTxt(domain_clean);
            hasSpf = txtRecords.some(r => r.join('').includes('v=spf1'));
          } catch (e) {}

          // 4. Resolve DMARC
          try {
            const dmarcRecords = await resolveTxt(`_dmarc.${domain_clean}`);
            hasDmarc = dmarcRecords.some(r => r.join('').includes('v=DMARC1'));
          } catch (e) {}

          // 5. Native SMTP Handshake (Port 25)
          // Fails gracefully on Vercel (blocked port 25), works on local/VPS.
          if (hasMx && mxHost && !isSinkhole) {
            try {
              smtpValid = await new Promise((resolveSmtp) => {
                const net = require('net');
                const socket = new net.Socket();
                let step = 0;
                let isResolved = false;

                const finish = (result: boolean, reason: string) => {
                  if (!isResolved) {
                    isResolved = true;
                    smtpReason = reason;
                    socket.destroy();
                    resolveSmtp(result);
                  }
                };

                // 2.5s absolute timeout for SMTP to preserve Vercel limit
                const smtpTimeout = setTimeout(() => {
                  finish(false, 'timeout_port_25_blocked');
                }, 2500);

                socket.connect(25, mxHost, () => {
                  // Connected
                });

                socket.on('data', (data: Buffer) => {
                  const response = data.toString();
                  if (response.startsWith('220') && step === 0) {
                    step = 1;
                    socket.write(`EHLO leadpure.ai\r\n`);
                  } else if (response.startsWith('250') && step === 1) {
                    step = 2;
                    socket.write(`MAIL FROM:<verify@leadpure.ai>\r\n`);
                  } else if (response.startsWith('250') && step === 2) {
                    step = 3;
                    socket.write(`RCPT TO:<test@${domain_clean}>\r\n`);
                  } else if ((response.startsWith('250') || response.startsWith('450') || response.startsWith('451')) && step === 3) {
                    finish(true, 'smtp_handshake_success');
                  } else if (response.startsWith('550') && step === 3) {
                    finish(false, 'smtp_rejected_user');
                  } else if (step === 3) {
                     finish(false, 'smtp_unexpected_response');
                  }
                });

                socket.on('error', () => {
                  finish(false, 'smtp_connection_failed');
                });
                
                socket.on('close', () => {
                   clearTimeout(smtpTimeout);
                   finish(false, 'smtp_connection_closed');
                });
              });
            } catch(e) {
              // Ignore SMTP errors, fallback to deep DNS
            }
          }

          // 6. Fallback to DoH if Native failed completely (DNS block in environment)
          if (!hasMx && !hasA && !isSinkhole) {
            try {
              const fetchOptions = { signal: controller.signal, headers: { 'accept': 'application/dns-json' } };
              const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain_clean)}&type=MX`, fetchOptions);
              if (r.ok) {
                const data = await r.json() as any;
                if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
                  hasMx = true;
                  source = 'doh-google';
                  if (isKnownSinkhole(data.Answer)) {
                    isSinkhole = true;
                    hasMx = false;
                  }
                }
              }
            } catch (e) {}
          }

          clearTimeout(timeoutId);
          return { success: true, hasMx, hasA, hasSpf, hasDmarc, isSinkhole, smtpValid, smtpReason, source };

        } catch (error) {
          clearTimeout(timeoutId);
          return { success: false, hasMx: false, hasA: false, hasSpf: false, hasDmarc: false, isSinkhole: false, smtpValid: false, smtpReason: 'error', source: 'error_environmental_drift' };
        }
      };

      // Ensure we NEVER exceed Vercel 10s timeout (Bound to 8.5s)
      const resultPromise = performLookup();
      const timeoutPromise = new Promise<any>((resolve) => {
        setTimeout(() => resolve({ success: false, hasMx: false, hasA: false, hasSpf: false, hasDmarc: false, isSinkhole: false, source: 'engine_timeout_safety' }), 8500);
      });

      let result = await Promise.race([resultPromise, timeoutPromise]);
      
      // Cache result for SESSION consistency
      serverMxCache.set(domain_clean, { 
        ...result,
        timestamp: Date.now() 
      });

      res.json({ 
        hasMx: result.hasMx,
        hasA: result.hasA,
        hasSpf: result.hasSpf,
        hasDmarc: result.hasDmarc,
        isSinkhole: result.isSinkhole,
        smtpValid: result.smtpValid,
        smtpReason: result.smtpReason,
        source: result.source
      });
      console.log(`[DNS_API] VERIFIED: ${domain_clean} -> MX:${result.hasMx} SPF:${result.hasSpf} DMARC:${result.hasDmarc} SMTP:${result.smtpValid}(${result.smtpReason})`);
    } catch (error) {
      console.error(`[DNS_API] Root DNS check failed for ${domain}:`, error);
      res.json({ 
        hasMx: false, hasA: false, hasSpf: false, hasDmarc: false, isSinkhole: false, smtpValid: false, smtpReason: 'error_fallback',
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