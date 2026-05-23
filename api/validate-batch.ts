import { validateEmailFull, ValidationOptions, ValidationResult } from '../src/lib/validator.js';

// Vercel Native Serverless Handler
export default async function handler(req: Request | any, res: Response | any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Enterprise Security Headers
  res.setHeader('X-LeadPure-Version', 'v12.0.0');
  res.setHeader('X-LeadPure-Kernel', 'Elite-SMTP-v12.0');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
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

    const startTime = Date.now();
    const TIMEOUT_MS = 7500; // 7.5s serverless internal timeout safety threshold (Vercel max is 10s)

    // Execute validations in parallel for maximum I/O throughput to different MX servers
    const results = await Promise.all(
      emails.map(async (email: string) => {
        let attempts = 0;
        const MAX_ATTEMPTS = 2;
        let lastResult: ValidationResult | null = null;

        while (attempts < MAX_ATTEMPTS) {
          try {
            const timeElapsed = Date.now() - startTime;
            if (timeElapsed > TIMEOUT_MS - 500) break; // Break if close to internal timeout

            const validationPromise = validateEmailFull(email, mergedOptions);
            
            let timerId: NodeJS.Timeout;
            const timeoutPromise = new Promise<ValidationResult>((resolve) => {
              const remainingTime = Math.max(100, TIMEOUT_MS - (Date.now() - startTime));
              timerId = setTimeout(() => {
                resolve({
                  email,
                  verificationStatus: 'unknown',
                  verificationReason: 'Internal serverless validation probe timeout threshold reached',
                  subStatus: 'timeout',
                  confidenceScore: 50,
                  bounceRisk: 'Unknown',
                  reputationImpact: 'Unknown',
                  mxRecordFound: false,
                  isCatchAll: false,
                  isDisposable: false,
                  isRoleBased: false,
                  isFreeEmail: false,
                  isSpamTrap: false,
                  provider: 'Unknown',
                  smtpValid: false,
                  syntaxValid: false,
                  didyouseeme: false,
                  status: 'UNKNOWN',
                  sub_status: 'timeout',
                  failure_code: 'ERR_009',
                  smtp_code: null,
                  mx_ip: null,
                  timestamp: new Date().toISOString(),
                  is_catchall: false,
                  trace: 'Timeout -> Intercepted at serverless handler (ERR_009)'
                });
              }, remainingTime);
            });

            const result = await Promise.race([validationPromise, timeoutPromise]);
            clearTimeout(timerId!);

            if (result.status === 'UNKNOWN' && result.sub_status === 'timeout' && attempts < MAX_ATTEMPTS - 1) {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 300)); // Brief retry delay
              continue;
            }

            lastResult = result;
            break;
          } catch (err: any) {
            attempts++;
          }
        }

        return lastResult || {
          email,
          verificationStatus: 'unknown',
          verificationReason: 'Validation Engine Serverless Processing Failure',
          subStatus: 'engine_error',
          confidenceScore: 0,
          bounceRisk: 'Unknown',
          reputationImpact: 'Unknown',
          mxRecordFound: false,
          isCatchAll: false,
          isDisposable: false,
          isRoleBased: false,
          isFreeEmail: false,
          isSpamTrap: false,
          provider: 'Unknown',
          smtpValid: false,
          syntaxValid: false,
          didyouseeme: false,
          status: 'UNKNOWN',
          sub_status: 'engine_error',
          failure_code: 'ERR_009',
          smtp_code: null,
          mx_ip: null,
          timestamp: new Date().toISOString(),
          is_catchall: false,
          trace: 'Engine Error -> Deflected to UNKNOWN (ERR_009)'
        };
      })
    );

    return res.status(200).json({ results });
  } catch (err: any) {
    console.error("[NATIVE_VERCEL_API] Fatal Route Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
