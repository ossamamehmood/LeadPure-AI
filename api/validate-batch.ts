import { validateEmailFull, ValidationOptions, ValidationResult } from '../src/lib/validator.js';

// Vercel Native Serverless Handler
export default async function handler(req: Request | any, res: Response | any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Enterprise Security Headers
  res.setHeader('X-LeadPure-Version', 'v10.5.5');
  res.setHeader('X-LeadPure-Kernel', 'Elite-SMTP-v10.5');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    // Safely parse body
    const body = req.body || {};
    const emails: string[] = body.emails;
    const options: Partial<ValidationOptions> = body.options;
    
    if (!Array.isArray(emails)) {
      return res.status(400).json({ error: "emails array required" });
    }

    const defaultOptions: ValidationOptions = {
      excludeDisposable: true,
      excludeRoleBased: true,
      excludeCatchAll: true,
      excludeSpamTraps: true
    };
    
    const mergedOptions: ValidationOptions = { ...defaultOptions, ...(options || {}) };

    // Vercel Serverless Function Limit: 10s. We enforce an 9.0s hard timeout.
    const startTime = Date.now();
    const TIMEOUT_MS = 9000;

    const results: ValidationResult[] = [];
    const MAX_CONCURRENT = 20; // Slightly reduced for higher per-probe stability
    
    // Concurrency Throttle
    for (let i = 0; i < emails.length; i += MAX_CONCURRENT) {
      const chunk = emails.slice(i, i + MAX_CONCURRENT);
      const chunkResults = await Promise.all(
        chunk.map(async (email: string) => {
          let attempts = 0;
          const MAX_ATTEMPTS = 3;
          let lastResult: ValidationResult | null = null;

          while (attempts < MAX_ATTEMPTS) {
            try {
              const timeElapsed = Date.now() - startTime;
              if (timeElapsed > TIMEOUT_MS - 500) break; // Safety break before hard timeout

              const validationPromise = validateEmailFull(email, mergedOptions);
              let timerId: NodeJS.Timeout;
              const timeoutPromise = new Promise<ValidationResult>((resolve) => {
                const remainingTime = Math.max(100, TIMEOUT_MS - timeElapsed);
                timerId = setTimeout(() => {
                  resolve({
                    email,
                    verificationStatus: 'unknown',
                    verificationReason: 'Internal Probe Timeout',
                    subStatus: 'timeout',
                    confidenceScore: 50,
                    bounceRisk: 'Unknown',
                    reputationImpact: 'Unknown',
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

              const result = await Promise.race([validationPromise, timeoutPromise]);
              clearTimeout(timerId!);
              
              // If result is a timeout, we retry unless it's the last attempt
              if (result.subStatus === 'timeout' && attempts < MAX_ATTEMPTS - 1) {
                attempts++;
                continue;
              }
              
              lastResult = result;
              break;
            } catch (err) {
              attempts++;
            }
          }
          
          return lastResult || {
            email,
            verificationStatus: 'unknown',
            verificationReason: 'Engine Processing Failure',
            subStatus: 'engine_error',
            confidenceScore: 0,
            bounceRisk: 'Unknown',
            reputationImpact: 'Unknown',
            mxRecordFound: false,
            isCatchAll: false,
            isDisposable: false,
            isRoleBased: false,
            isFreeEmail: false,
            provider: 'Unknown',
            smtpValid: false,
            syntaxValid: false
          };
        })
      );
      results.push(...chunkResults);
    }

    return res.status(200).json({ results });
  } catch (err: any) {
    console.error("[NATIVE_VERCEL_API] Fatal Route Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
