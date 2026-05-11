import { validateEmailFull } from '../src/lib/validator.js'; // Ensure extension for ESM/Vercel

// Vercel Native Serverless Handler
export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Safely parse body
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
          const validationPromise = validateEmailFull(email, mergedOptions);
          const timeoutPromise = new Promise<any>((resolve) => {
            const timeElapsed = Date.now() - startTime;
            const remainingTime = Math.max(100, TIMEOUT_MS - timeElapsed);
            setTimeout(() => {
              resolve({
                email,
                verificationStatus: 'unknown',
                verificationReason: 'Engine Timeout: Vercel Execution Limit Reached',
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

          return await Promise.race([validationPromise, timeoutPromise]);
        } catch (internalErr: any) {
          return {
            email,
            verificationStatus: 'unknown',
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

    return res.status(200).json({ results });
  } catch (err: any) {
    console.error("[NATIVE_VERCEL_API] Fatal Route Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
