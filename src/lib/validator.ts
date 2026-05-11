import dns from 'dns';
import net from 'net';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);
const resolve4 = promisify(dns.resolve4);
const resolveTxt = promisify(dns.resolveTxt);

export interface ValidationOptions {
  excludeDisposable: boolean;
  excludeRoleBased: boolean;
  excludeCatchAll: boolean;
  excludeSpamTraps: boolean;
  strictMode?: boolean;
}

export interface ValidationResult {
  email: string;
  status: 'valid' | 'risky' | 'invalid';
  confidence_score: number;
  signals: {
    dns: 'found' | 'not_found' | 'error';
    mx: boolean;
    smtp: 'success' | 'blocked' | 'unknown';
  };
  reasons: string[];
  // Keeping these for internal logic and backward compatibility if needed by UI
  score: number;
  smtp_status: 'verified' | 'blocked' | 'failed' | 'unknown';
  dns_status: 'found' | 'not_found' | 'error';
  verificationStatus: 'verified' | 'risky' | 'rejected' | 'blocked' | 'unknown';
  subStatus: string;
  bounceRisk: 'Safe' | 'Medium' | 'High' | 'Dangerous' | 'Unknown';
  mxRecordFound: boolean;
  mxRecord?: string;
  isCatchAll: boolean;
  isDisposable: boolean;
  isRoleBased: boolean;
  isFreeEmail: boolean;
  provider: string;
  smtpValid: boolean;
  syntaxValid: boolean;
  verificationReason: string;
  reputationImpact: 'Positive' | 'Neutral' | 'Negative' | 'Critical' | 'Unknown';
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
interface DomainCacheEntry {
  mxRecordFound: boolean;
  mxRecord: string | undefined;
  isCatchAll: boolean;
  isDisposable: boolean;
  isFreeEmail: boolean;
  provider: string;
  hasSpf: boolean;
  hasDmarc: boolean;
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

// DNS Resolve with Multi-Provider Fallback
const resolveMxMultiProvider = async (domain: string): Promise<dns.MxRecord[]> => {
  const dnsProviders = [
    undefined, // System default
    ['8.8.8.8', '8.8.4.4'], // Google
    ['1.1.1.1', '1.0.0.1'], // Cloudflare
    ['9.9.9.9', '149.112.112.112'] // Quad9
  ];

  for (const servers of dnsProviders) {
    try {
      if (servers) {
        const resolver = new dns.promises.Resolver();
        resolver.setServers(servers);
        const records = await resolver.resolveMx(domain);
        if (records && records.length > 0) return records;
      } else {
        const records = await resolveMx(domain);
        if (records && records.length > 0) return records;
      }
    } catch (err: any) {
      // Continue to next provider unless it's a fatal error that would affect all
      if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') continue;
    }
  }
  return [];
};

const checkSpf = async (domain: string): Promise<boolean> => {
  try {
    const txtRecords = await resolveTxt(domain);
    return txtRecords.some(records => records.some(r => r.includes('v=spf1')));
  } catch {
    return false;
  }
};

const checkDmarc = async (domain: string): Promise<boolean> => {
  try {
    const txtRecords = await resolveTxt(`_dmarc.${domain}`);
    return txtRecords.some(records => records.some(r => r.includes('v=DMARC1')));
  } catch {
    return false;
  }
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
  let score = 0;
  let reasons: string[] = [];
  let status: 'valid' | 'risky' | 'invalid' = 'invalid';
  let smtp_status: 'verified' | 'blocked' | 'failed' | 'unknown' = 'unknown';
  let dns_status: 'found' | 'not_found' | 'error' = 'not_found';
  
  // 1. Syntax Check (Fatal if failed)
  const syntaxRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!syntaxRegex.test(cleanEmail)) {
    return {
      email: cleanEmail,
      status: 'invalid',
      confidence_score: 0,
      signals: { dns: 'not_found', mx: false, smtp: 'unknown' },
      reasons: ['Fatal Syntax: Impossible Identity Structure'],
      score: 0,
      smtp_status: 'failed',
      dns_status: 'not_found',
      verificationStatus: 'blocked',
      subStatus: 'invalid_syntax',
      bounceRisk: 'Dangerous',
      mxRecordFound: false,
      isCatchAll: false,
      isDisposable: false,
      isRoleBased: false,
      isFreeEmail: false,
      provider: 'Unknown',
      smtpValid: false,
      syntaxValid: false,
      verificationReason: 'Fatal Syntax: Impossible Identity Structure',
      reputationImpact: 'Critical'
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
  let mxRecordFound = false;
  let primaryMx: string | undefined = undefined;
  let hasSpf = false;
  let hasDmarc = false;

  const cachedDomain = domainCache.get(domain);
  if (cachedDomain && (Date.now() - cachedDomain.timestamp < CACHE_TTL)) {
    mxRecordFound = cachedDomain.mxRecordFound;
    primaryMx = cachedDomain.mxRecord;
    isCatchAll = cachedDomain.isCatchAll;
    isDisposable = cachedDomain.isDisposable;
    isFreeEmail = cachedDomain.isFreeEmail;
    provider = cachedDomain.provider;
    hasSpf = cachedDomain.hasSpf;
    hasDmarc = cachedDomain.hasDmarc;
  } else {
    isFreeEmail = freeProviders.has(domain);
    if (domain.includes('gmail.com')) provider = 'google';
    else if (domain.includes('yahoo') || domain.includes('ymail')) provider = 'yahoo';
    else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) provider = 'microsoft';

    isDisposable = disposableDomains.has(domain);

    // DNS Audit using Multi-Provider
    try {
      const mxRecords = await resolveMxMultiProvider(domain);
      if (mxRecords && mxRecords.length > 0) {
        mxRecords.sort((a, b) => a.priority - b.priority);
        primaryMx = mxRecords[0].exchange;
        mxRecordFound = true;
        dns_status = 'found';
      } else {
        mxRecordFound = false;
        dns_status = 'not_found';
      }
    } catch {
      mxRecordFound = false;
      dns_status = 'error';
    }

    if (mxRecordFound) {
      hasSpf = await checkSpf(domain);
      hasDmarc = await checkDmarc(domain);
    }
  }

  // --- SCORING ENGINE ---
  
  // MX Record (+40)
  if (mxRecordFound) {
    score += 40;
    reasons.push("MX Record Found");
  } else {
    reasons.push("No MX Records Found");
  }

  // Strong Domain Reputation (+15)
  if (mxRecordFound && (hasSpf || hasDmarc)) {
    score += 15;
    reasons.push("Strong Domain Reputation (SPF/DMARC)");
  }

  // Disposable Domain (-100)
  if (isDisposable) {
    score -= 100;
    reasons.push("Disposable Provider Flag");
  }

  // Role-based Email (-15)
  const isRoleBased = rolePrefixes.has(localPart);
  if (isRoleBased) {
    score -= 15;
    reasons.push(`Generic Role Identity: ${localPart}`);
  }

  // SMTP Check
  let smtpValid = false;
  let subStatus = 'unknown';
  let smtp_signal: 'success' | 'blocked' | 'unknown' = 'unknown';

  if (mxRecordFound && primaryMx) {
    const smtpCheck = await performSmtpCheck(cleanEmail, primaryMx);
    
    if (smtpCheck.success) {
      score += 40;
      smtpValid = true;
      smtp_status = 'verified';
      smtp_signal = 'success';
      reasons.push("SMTP Verified Success");
      subStatus = 'valid';
    } else if (smtpCheck.timedOut || smtpCheck.code === 0) {
      score -= 10;
      smtp_status = 'blocked';
      smtp_signal = 'blocked';
      reasons.push("SMTP Blocked/Firewalled (Uncertain State)");
      subStatus = 'smtp_firewall_blocked';
    } else {
      score -= 10; // Per requirement: SMTP blocked/unknown -> -10
      smtp_status = 'failed';
      smtp_signal = 'unknown';
      reasons.push(`SMTP Validation Uncertain: ${smtpCheck.response}`);
      subStatus = 'smtp_failed';
    }

    // Catch-all detection
    if (smtpValid && !isFreeEmail && !cachedDomain) {
      const mxLower = (primaryMx || '').toLowerCase();
      const catchAllSignatures = ['mimecast.com', 'pphosted.com', 'outlook.com', 'google.com'];
      const hasCatchAllSignature = catchAllSignatures.some(sig => mxLower.includes(sig));
      
      const randomPrefix = `verify_${Math.random().toString(36).substring(2, 10)}`;
      const catchAllCheck = await performSmtpCheck(`${randomPrefix}@${domain}`, primaryMx || '');
      
      if (catchAllCheck.success || hasCatchAllSignature) {
        isCatchAll = true;
        reasons.push("Catch-all Domain Detected");
        score -= 20; // Catch-all penalty
      }
    }
  }

  // Final Status Determination (New Thresholds)
  if (options.strictMode) {
    // Strict Mode: Highest confidence tier only
    const isStrictlyValid = mxRecordFound && smtpValid && !isDisposable && !isRoleBased;
    if (isStrictlyValid) {
      status = 'valid';
    } else {
      // In strict mode, if it doesn't meet all criteria, it's either risky or invalid
      status = score >= 45 ? 'risky' : 'invalid';
      reasons.push("Strict Mode: Reclassified from VALID to RISKY due to incomplete verification signals");
    }
  } else {
    // Default: Confidence-based scoring
    if (score >= 75) status = 'valid';
    else if (score >= 45) status = 'risky';
    else status = 'invalid';
  }

  // Cache results
  if (!cachedDomain) {
    domainCache.set(domain, {
      mxRecordFound, mxRecord: primaryMx, isCatchAll, isDisposable, isFreeEmail, provider, hasSpf, hasDmarc, timestamp: Date.now()
    });
  }

  const { bounceRisk } = determineRisk(score);

  return {
    email: cleanEmail,
    status,
    confidence_score: Math.max(0, Math.min(100, score)),
    signals: {
      dns: dns_status,
      mx: mxRecordFound,
      smtp: smtp_signal
    },
    reasons,
    score,
    smtp_status,
    dns_status,
    verificationStatus: status === 'valid' ? 'verified' : (status === 'risky' ? 'risky' : 'rejected'),
    subStatus,
    bounceRisk,
    mxRecordFound,
    mxRecord: primaryMx,
    isCatchAll,
    isDisposable,
    isRoleBased,
    isFreeEmail,
    provider,
    smtpValid,
    syntaxValid: true,
    verificationReason: reasons.join(' • '),
    reputationImpact: score >= 75 ? 'Positive' : (score >= 45 ? 'Neutral' : 'Negative')
  };
};
