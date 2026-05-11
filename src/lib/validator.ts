import dns from 'dns';
import net from 'net';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);
const resolve4 = promisify(dns.resolve4);

export interface ValidationOptions {
  excludeDisposable: boolean;
  excludeRoleBased: boolean;
  excludeCatchAll: boolean;
  excludeSpamTraps: boolean;
}

export interface ValidationResult {
  email: string;
  verificationStatus: 'verified' | 'risky' | 'rejected' | 'blocked' | 'unknown';
  verificationReason: string;
  subStatus: string;
  confidenceScore: number;
  bounceRisk: 'Safe' | 'Medium' | 'High' | 'Dangerous' | 'Unknown';
  reputationImpact: 'Positive' | 'Neutral' | 'Negative' | 'Critical' | 'Unknown';
  mxRecordFound: boolean;
  mxRecord?: string;
  isCatchAll: boolean;
  isDisposable: boolean;
  isRoleBased: boolean;
  isFreeEmail: boolean;
  provider: string;
  smtpValid: boolean;
  syntaxValid: boolean;
}

// ----------------- DATA SETS -----------------
const disposableDomains = new Set([
  'temp-mail.org', 'guerrillamail.com', 'mailinator.com', '10minutemail.com', 
  'dispostable.com', 'getnada.com', 'throwawaymail.com', 'maildrop.cc', 
  'yopmail.com', 'trashmail.com', 'tempmail.net', 'temp-mail.io',
  'boun.cr', 'sharklasers.com', 'mail-fake.com', 'fakeinbox.com', 'emailfake.com',
  'disposable.com', 'spam4.me', 'pwned.com', 'mail-temp.com', '0r.jp'
]);

const rolePrefixes = new Set([
  'admin', 'support', 'info', 'sales', 'hello', 'webmaster', 'jobs', 
  'office', 'contact', 'postmaster', 'no-reply', 'noreply', 'marketing', 'billing',
  'privacy', 'abuse', 'security', 'it', 'manager', 'editor', 'hr', 'careers',
  'dev', 'developer', 'sysadmin', 'root'
]);

const freeProviders = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
  'aol.com', 'icloud.com', 'msn.com', 'live.com', 'ymail.com',
  'mac.com', 'me.com'
]);

// ----------------- DOMAIN CACHING -----------------
// Cache domain-level analysis within the warm lambda to avoid redundant DNS & SMTP logic for batch runs
interface DomainCacheEntry {
  mxRecordFound: boolean;
  mxRecord: string | undefined;
  isCatchAll: boolean;
  isDisposable: boolean;
  isFreeEmail: boolean;
  provider: string;
  timestamp: number;
}
const domainCache = new Map<string, DomainCacheEntry>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// ----------------- UTILITIES -----------------
const determineRisk = (score: number) => {
  // Score System: 0-30 Invalid, 31-70 Risky, 71-100 Safe
  if (score <= 30) return { bounceRisk: 'Dangerous' as const, reputationImpact: 'Critical' as const, finalStatus: 'rejected' as const };
  if (score <= 70) return { bounceRisk: 'Medium' as const, reputationImpact: 'Negative' as const, finalStatus: 'risky' as const };
  return { bounceRisk: 'Safe' as const, reputationImpact: 'Positive' as const, finalStatus: 'verified' as const };
};

// DNS Resolve with Exponential Backoff Retry Logic
const resolveMxWithRetry = async (domain: string, retries = 2): Promise<dns.MxRecord[]> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const records = await resolveMx(domain);
      if (records && records.length > 0) return records;
    } catch (err: any) {
      if (i === retries || err.code === 'ENOTFOUND' || err.code === 'ENODATA') throw err;
      await new Promise(res => setTimeout(res, 500 * (i + 1))); // 500ms, 1000ms backoff
    }
  }
  throw new Error('DNS resolution failed after retries');
};

// 1. Core SMTP Handshake Logic
const performSmtpCheck = async (email: string, mxRecord: string, senderEmail = 'verify@leadpure.ai'): Promise<{ success: boolean, code: number, response: string, timedOut: boolean }> => {
  return new Promise((resolve) => {
    let resolved = false;
    let currentStep = 0;
    let responseData = '';
    let smtpCode = 0;

    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ success: false, code: 0, response: 'Connection Timeout', timedOut: true });
      }
    }, 4000); // 4s strict timeout per SMTP connection

    socket.connect(25, mxRecord, () => {
      // Connected!
    });

    socket.on('data', (data) => {
      const response = data.toString();
      responseData += response;
      const lines = response.split('\n').filter(l => l.trim().length > 0);
      if (lines.length === 0) return; // Prevent empty line crash
      const lastLine = lines[lines.length - 1];
      const code = parseInt(lastLine.substring(0, 3), 10);

      if (currentStep === 0 && code === 220) {
        currentStep++;
        socket.write(`EHLO leadpure.ai\r\n`);
      } else if (currentStep === 1 && code === 250) {
        currentStep++;
        socket.write(`MAIL FROM:<${senderEmail}>\r\n`);
      } else if (currentStep === 2 && code === 250) {
        currentStep++;
        socket.write(`RCPT TO:<${email}>\r\n`);
      } else if (currentStep === 3) {
        smtpCode = code;
        socket.write('QUIT\r\n');
      } else if (currentStep === 4 || code === 221) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          socket.destroy();
          resolve({ success: smtpCode === 250 || smtpCode === 251, code: smtpCode, response: responseData, timedOut: false });
        }
      } else if (code >= 400) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          socket.destroy();
          resolve({ success: false, code, response: lastLine, timedOut: false });
        }
      }
    });

    socket.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        socket.destroy();
        resolve({ success: false, code: 0, response: err.message, timedOut: false });
      }
    });
  });
};

export const validateEmailFull = async (email: string, options: ValidationOptions): Promise<ValidationResult> => {
  let cleanEmail = email.toLowerCase().trim().replace(/[\s"'\r\n]/g, '');
  let score = 100;
  let reasons: string[] = [];
  
  // 1. Syntax Check
  const syntaxRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!syntaxRegex.test(cleanEmail)) {
    return {
      email: cleanEmail,
      verificationStatus: 'blocked',
      verificationReason: 'Fatal Syntax: Impossible Identity Structure',
      subStatus: 'invalid_syntax',
      confidenceScore: 0,
      bounceRisk: 'Dangerous',
      reputationImpact: 'Critical',
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

  const parts = cleanEmail.split('@');
  const localPart = parts[0];
  const domain = parts[1];

  // 2. Identify Provider & Free Email (Cached if possible)
  let isFreeEmail = false;
  let provider = 'Other';
  let isDisposable = false;
  let isCatchAll = false;
  let mxRecordFound = true;
  let primaryMx: string | undefined = undefined;

  const cachedDomain = domainCache.get(domain);
  if (cachedDomain && (Date.now() - cachedDomain.timestamp < CACHE_TTL)) {
    mxRecordFound = cachedDomain.mxRecordFound;
    primaryMx = cachedDomain.mxRecord;
    isCatchAll = cachedDomain.isCatchAll;
    isDisposable = cachedDomain.isDisposable;
    isFreeEmail = cachedDomain.isFreeEmail;
    provider = cachedDomain.provider;
  } else {
    // Determine provider
    isFreeEmail = freeProviders.has(domain);
    if (domain.includes('gmail.com')) provider = 'google';
    else if (domain.includes('yahoo') || domain.includes('ymail')) provider = 'yahoo';
    else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) provider = 'microsoft';

    // Disposable Check
    isDisposable = disposableDomains.has(domain);

    // DNS MX Check (STRICT NO-FALLBACK FOR ZERO BOUNCE)
    let mxRecords: dns.MxRecord[] = [];
    try {
      mxRecords = await resolveMxWithRetry(domain);
      if (!mxRecords || mxRecords.length === 0) {
        throw new Error('No MX Records');
      }
      mxRecords.sort((a, b) => a.priority - b.priority);
      primaryMx = mxRecords[0].exchange;
    } catch (err: any) {
      // STRICT ZERO-BOUNCE RULE: If there is no explicit MX record, we assume the domain cannot receive mail.
      // We no longer fall back to A-records because parked/dead domains often have A-records but bounce all mail.
      mxRecordFound = false;
    }
  }

  if (isDisposable) {
    if (options.excludeDisposable) {
      return {
        email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'Policy Block: Disposable Mail Provider',
        subStatus: 'disposable', confidenceScore: 0, bounceRisk: 'Dangerous', reputationImpact: 'Critical',
        mxRecordFound, isCatchAll, isDisposable: true, isRoleBased: false, isFreeEmail, provider,
        smtpValid: false, syntaxValid: true
      };
    }
    score -= 85;
    reasons.push("Disposable Provider Flag");
  }

  if (!mxRecordFound) {
    return {
      email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'Engine Rejected: Dead Domain (No MX or A Records)',
      subStatus: 'domain_not_found', confidenceScore: 0, bounceRisk: 'Dangerous', reputationImpact: 'Critical',
      mxRecordFound: false, isCatchAll: false, isDisposable, isRoleBased: false, isFreeEmail, provider,
      smtpValid: false, syntaxValid: true
    };
  }

  // Role-based Check
  const isRoleBased = rolePrefixes.has(localPart);
  if (isRoleBased) {
    if (options.excludeRoleBased) {
      return {
        email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'Protocol Filter: Role-Based Identity Purge',
        subStatus: 'role_based', confidenceScore: 15, bounceRisk: 'Medium', reputationImpact: 'Neutral',
        mxRecordFound: true, isCatchAll, isDisposable, isRoleBased: true, isFreeEmail, provider,
        smtpValid: true, syntaxValid: true
      };
    }
    score -= 35;
    reasons.push("Generic Role Identity");
  }

  // 6. SMTP Handshake Check
  let smtpValid = true;
  let subStatus = 'valid';

  const skipSmtp = isFreeEmail && (provider === 'yahoo' || provider === 'microsoft');
  
  if (!skipSmtp && primaryMx) {
    // 6a. Real mailbox check
    const smtpCheck = await performSmtpCheck(cleanEmail, primaryMx);
    
    // Environment/Timeout Failures -> Graceful Degradation to DNS Heuristics
    if (smtpCheck.timedOut || smtpCheck.code === 0) {
      smtpValid = false;
      subStatus = 'smtp_firewall_blocked';
      // Minor confidence deduction for missing SMTP confirmation, but still allows it to be 'verified'
      score -= 1;
      reasons.push('SMTP Firewalled (Vercel) - Trusted DNS Heuristics');
    } else if (smtpCheck.code === 550) {
      return {
        email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'SMTP RCPT_TO: Mailbox Not Found (Code 550)',
        subStatus: 'mailbox_not_found', confidenceScore: 0, bounceRisk: 'Dangerous', reputationImpact: 'Critical',
        mxRecordFound: true, mxRecord: primaryMx, isCatchAll: false, isDisposable, isRoleBased, isFreeEmail, provider,
        smtpValid: false, syntaxValid: true
      };
    } else if (smtpCheck.code >= 400 && smtpCheck.code < 500) {
      smtpValid = false;
      subStatus = 'rate_limited';
      score -= 35; // Greylisting pushes score into 31-70 'risky' bracket
      reasons.push(`SMTP Soft-Bounce: Greylisted/RateLimited (Code ${smtpCheck.code})`);
    } else if (smtpCheck.success) {
      smtpValid = true;
    }

    // 6b. Catch-All Verification (Only executed once per domain if not cached)
    if (smtpValid && !isFreeEmail && !cachedDomain) {
      const randomPrefix = `verify_${Math.random().toString(36).substring(2, 10)}`;
      const catchAllCheck = await performSmtpCheck(`${randomPrefix}@${domain}`, primaryMx);
      
      if (catchAllCheck.success) {
        isCatchAll = true;
      }
    }
  }

  // Update Cache if we just performed a fresh lookup
  if (!cachedDomain) {
    domainCache.set(domain, {
      mxRecordFound,
      mxRecord: primaryMx,
      isCatchAll,
      isDisposable,
      isFreeEmail,
      provider,
      timestamp: Date.now()
    });
  }

  if (isCatchAll) {
    if (options.excludeCatchAll) {
      return {
        email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'Policy Block: Catch-All Protocol Confirmed via SMTP',
        subStatus: 'catch_all', confidenceScore: 30, bounceRisk: 'High', reputationImpact: 'Negative',
        mxRecordFound: true, mxRecord: primaryMx, isCatchAll: true, isDisposable, isRoleBased, isFreeEmail, provider,
        smtpValid: true, syntaxValid: true
      };
    }
    score -= 35; // Drops to 65, placing it squarely in the RISKY bracket
    reasons.push("Catch-All Domain Signature Confirmed");
    subStatus = 'catch_all';
  }

  // 7. Spam Trap Heuristics
  if (localPart.includes('honey') || localPart.includes('trap') || (/^[A-Za-z]{3}[0-9]{3}$/.test(localPart))) {
    if (options.excludeSpamTraps) {
      return {
        email: cleanEmail, verificationStatus: 'blocked', verificationReason: 'System Rejected: Honeypot / Spam Trap Probability High',
        subStatus: 'toxic', confidenceScore: 0, bounceRisk: 'Dangerous', reputationImpact: 'Critical',
        mxRecordFound: true, mxRecord: primaryMx, isCatchAll, isDisposable, isRoleBased, isFreeEmail, provider,
        smtpValid, syntaxValid: true
      };
    }
    score -= 75;
    reasons.push("Spam-Trap Behavior Profile");
  }

  const { bounceRisk, reputationImpact, finalStatus } = determineRisk(score);

  return {
    email: cleanEmail,
    verificationStatus: finalStatus,
    verificationReason: reasons.length > 0 ? reasons.join(' • ') : 'Verified Profile Integrity',
    subStatus,
    confidenceScore: score,
    bounceRisk,
    reputationImpact,
    mxRecordFound: true,
    mxRecord: primaryMx,
    isCatchAll,
    isDisposable,
    isRoleBased,
    isFreeEmail,
    provider,
    smtpValid,
    syntaxValid: true
  };
};
