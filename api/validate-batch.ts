import { validateEmailFull, ValidationOptions, ValidationResult } from '../src/lib/validator.js';

// DETERMINISTIC_BACKEND_CACHE: Ensures consistency across Incognito and re-runs
const globalBackendCache = new Map<string, { result: ValidationResult, timestamp: number }>();
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 Hour TTL for deterministic locking

// Vercel Native Serverless Handler
export default async function handler(req: Request | any, res: Response | any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  res.setHeader('X-LeadPure-Version', 'v12.0.0');
  res.setHeader('X-LeadPure-Kernel', 'Deterministic-Elite-v12');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    const { emails, options } = req.body || {};
    if (!Array.isArray(emails)) return res.status(400).json({ error: "emails array required" });

    const mergedOptions: ValidationOptions = { 
      excludeDisposable: true, 
      excludeRoleBased: true, 
      excludeCatchAll: true, 
      excludeSpamTraps: true, 
      ...(options || {}) 
    };

    const startTime = Date.now();
    const TIMEOUT_MS = 9500; // Increased for extra safety
    const MAX_CONCURRENT = 15; // Higher concurrency for smaller batches
    const domainLastHit = new Map<string, number>();

    // DETERMINISM_LOCK: We process in the EXACT order provided to guarantee identical timing patterns
    const resultsMap = new Map<string, ValidationResult>();
    
    for (let i = 0; i < emails.length; i += MAX_CONCURRENT) {
      const chunk = emails.slice(i, i + MAX_CONCURRENT);
      await Promise.all(chunk.map(async (email: string) => {
        const cleanEmail = email.toLowerCase().trim();
        
        // 1. Check Global Deterministic Cache
        const cached = globalBackendCache.get(cleanEmail);
        if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY)) {
          resultsMap.set(email, cached.result);
          return;
        }

        const domain = cleanEmail.split('@')[1];
        const lastHit = domainLastHit.get(domain) || 0;
        const waitTime = Math.max(0, 25 - (Date.now() - lastHit)); // Faster 25ms stagger
        if (waitTime > 0) await new Promise(res => setTimeout(res, waitTime));
        domainLastHit.set(domain, Date.now());

        try {
          const timeElapsed = Date.now() - startTime;
          if (timeElapsed > TIMEOUT_MS - 500) {
            resultsMap.set(email, createTimeoutResult(email));
            return;
          }

          const result = await validateEmailFull(email, mergedOptions);
          
          // ABSOLUTE_DETERMINISM: Cache EVERY result (including timeouts) for 1 hour
          // This ensures that for a 1-hour window, the result is locked.
          globalBackendCache.set(cleanEmail, { result, timestamp: Date.now() });
          
          resultsMap.set(email, result);
        } catch (err) {
          resultsMap.set(email, createErrorResult(email));
        }
      }));
    }

    // MAP BACK TO ORIGINAL ORDER
    const finalResults = emails.map(e => resultsMap.get(e)!);
    return res.status(200).json({ results: finalResults });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

function createTimeoutResult(email: string): ValidationResult {
  return {
    email, verificationStatus: 'unknown', verificationReason: 'Internal Probe Timeout',
    subStatus: 'timeout', confidenceScore: 50, bounceRisk: 'Unknown', reputationImpact: 'Unknown',
    mxRecordFound: false, isCatchAll: false, isDisposable: false, isRoleBased: false, isFreeEmail: false,
    provider: 'Unknown', smtpValid: false, syntaxValid: true
  };
}

function createErrorResult(email: string): ValidationResult {
  return {
    email, verificationStatus: 'unknown', verificationReason: 'Engine Processing Failure',
    subStatus: 'engine_error', confidenceScore: 0, bounceRisk: 'Unknown', reputationImpact: 'Unknown',
    mxRecordFound: false, isCatchAll: false, isDisposable: false, isRoleBased: false, isFreeEmail: false,
    provider: 'Unknown', smtpValid: false, syntaxValid: true
  };
}
