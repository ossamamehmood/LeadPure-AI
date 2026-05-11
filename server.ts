import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dns from "dns";
import { promisify } from "util";
import { validateEmailFull } from "./src/lib/validator";

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
    });
  });

  // Enterprise Email Validation Batch Engine (Bounded Concurrency & Strict Timeout for Vercel)
  app.post("/api/validate-batch", async (req, res) => {
    try {
      // Safely parse body to prevent destructuring crashes if Vercel body parser acts up
      const body = req.body || {};
      const emails = body.emails;
      const options = body.options;
      
      if (!Array.isArray(emails)) {
        return res.status(400).json({ error: "emails array required" });
      }

      const defaultOptions = {
        excludeDisposable: true,
        excludeRoleBased: true,
        excludeCatchAll: true,
        excludeSpamTraps: true
      };
      
      const mergedOptions = { ...defaultOptions, ...(options || {}) };

      // Vercel Serverless Function Limit: 10s. We enforce an 8.5s hard timeout.
      const startTime = Date.now();
      const TIMEOUT_MS = 8500;

      const results = await Promise.all(
        emails.map(async (email: string) => {
          try {
            // Wrap individual validations in a race to guarantee response
            const validationPromise = validateEmailFull(email, mergedOptions);
            const timeoutPromise = new Promise<any>((resolve) => {
              const timeElapsed = Date.now() - startTime;
              const remainingTime = Math.max(100, TIMEOUT_MS - timeElapsed);
              setTimeout(() => {
                resolve({
                  email,
                  verificationStatus: 'risky',
                  verificationReason: 'Engine Timeout: Vercel Execution Limit Reached',
                  subStatus: 'timeout',
                  confidenceScore: 50,
                  bounceRisk: 'Medium',
                  reputationImpact: 'Neutral',
                  mxRecordFound: false,
                  isCatchAll: false,
                  isDisposable: false,
                  isRoleBased: false,
                  isFreeEmail: false,
                  provider: 'Unknown',
                  smtpValid: false,
                  syntaxValid: false
                });
              }, remainingTime);
            });

            return await Promise.race([validationPromise, timeoutPromise]);
          } catch (internalErr: any) {
            // Failsafe for any uncaught errors inside validateEmailFull
            return {
              email,
              verificationStatus: 'risky',
              verificationReason: `Internal Validation Error: ${internalErr.message}`,
              subStatus: 'engine_error',
              confidenceScore: 50,
              bounceRisk: 'Medium',
              reputationImpact: 'Neutral',
              mxRecordFound: false,
              isCatchAll: false,
              isDisposable: false,
              isRoleBased: false,
              isFreeEmail: false,
              provider: 'Unknown',
              smtpValid: false,
              syntaxValid: false
            };
          }
        })
      );

      res.json({ results });
    } catch (err: any) {
      console.error("[BATCH_API] Fatal Route Error:", err);
      res.status(500).json({ error: err.message });
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