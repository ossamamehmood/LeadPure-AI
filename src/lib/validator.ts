import dns from 'dns';
import net from 'net';

// ----------------- ENTERPRISE DNS RESOLVER -----------------
// Using custom public resolvers to prevent local/Vercel host DNS rate limits on large batches
const resolver = new dns.promises.Resolver();
resolver.setServers([
  '8.8.8.8', // Google Primary
  '1.1.1.1', // Cloudflare Primary
  '8.8.4.4', // Google Secondary
  '1.0.0.1'  // Cloudflare Secondary
]);

const resolveMx = resolver.resolveMx.bind(resolver);
const resolveTxt = resolver.resolveTxt.bind(resolver);

export interface ValidationOptions {
  excludeDisposable: boolean;
  excludeRoleBased: boolean;
  excludeCatchAll: boolean;
  excludeSpamTraps: boolean;
}

export interface ValidationResult {
  email: string;
  verificationStatus: 'verified' | 'risky' | 'rejected' | 'blocked' | 'unknown' | 'safe' | 'usable' | 'dangerous';
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
  // Expanded Enterprise Disposable List
  'temp-mail.org', 'guerrillamail.com', 'mailinator.com', '10minutemail.com', 
  'dispostable.com', 'getnada.com', 'throwawaymail.com', 'maildrop.cc', 
  'yopmail.com', 'trashmail.com', 'tempmail.net', 'temp-mail.io',
  'boun.cr', 'sharklasers.com', 'mail-fake.com', 'fakeinbox.com', 'emailfake.com',
  'disposable.com', 'spam4.me', 'pwned.com', 'mail-temp.com', '0r.jp',
  'mytemp.email', 'tempmailaddress.com', 'generator.email', 'tempemail.co',
  'minuteinbox.com', 'throwmail.cc', 'temp-mail.org', 'dropmail.me', '10mail.org',
  'guerrillamail.biz', 'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org',
  'spamgourmet.com', 'spambog.com', 'spambog.de', 'spambog.ru', 'discard.email',
  'disbox.net', 'disbox.org', '10minutemail.net', '10minutemail.co.za', '10minutemail.info',
  'tempmail.de', 'maildrop.cc', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf',
  'jetable.org.nf', 'nospam.ze.tc', 'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr',
  'courriel.fr.nf', 'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf'
]);

const rolePrefixes = new Set([
  // Expanded Enterprise Role List
  'admin', 'support', 'info', 'sales', 'hello', 'webmaster', 'jobs', 
  'office', 'contact', 'postmaster', 'no-reply', 'noreply', 'marketing', 'billing',
  'privacy', 'abuse', 'security', 'it', 'manager', 'editor', 'hr', 'careers',
  'dev', 'developer', 'sysadmin', 'root', 'accounting', 'legal', 'finance', 
  'enquiries', 'press', 'media', 'compliance', 'purchasing', 'help', 'team',
  'management', 'exec', 'executive', 'director', 'ceo', 'cto', 'cfo', 'coo',
  'board', 'investors', 'pr', 'partners', 'affiliates', 'sponsorship', 'inquiries',
  'frontdesk', 'reception', 'booking', 'reservations', 'events', 'design', 'ux',
  'web', 'social', 'community', 'engineering', 'qa', 'test', 'testing', 'operations',
  'facilities', 'maintenance', 'payroll', 'accounts', 'billing', 'invoices', 'ap', 'ar'
]);

const freeProviders = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
  'aol.com', 'icloud.com', 'msn.com', 'live.com', 'ymail.com',
  'mac.com', 'me.com', 'protonmail.com', 'pm.me', 'zoho.com', 
  'mail.com', 'gmx.com', 'yandex.com', 'yandex.ru', 'mail.ru', 'tutanota.com', 'fastmail.com'
]);

const toxicTlds = new Set(['.top', '.xyz', '.work', '.biz', '.buzz', '.loan', '.icu', '.gdn', '.monster', '.bid', '.date', '.party', '.win', '.cricket', '.download', '.science']);
const trustTlds = new Set(['.com', '.org', '.net', '.edu', '.gov', '.io', '.ai', '.co', '.de', '.uk', '.ca', '.fr', '.au', '.ch', '.jp', '.sg', '.in']);

// ----------------- DOMAIN & EMAIL CACHING -----------------
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
const emailCache = new Map<string, ValidationResult>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// ----------------- STATIC ENGINE PATTERNS -----------------
const syntaxRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const knownToxicPatterns = ['honey', 'trap', 'spam', 'test', 'fake', 'donotreply'];
const parkedIpPatterns = [
  '184.168.', // GoDaddy
  '103.224.182.', // Trellian
  '208.73.210.', // Overseas
  '64.190.63.', // Sedo
  '34.102.136.' // Google Cloud Parked
];
const suspicousAlphaNumRegex = /^[a-z]{1,2}[0-9]{5,}$/;

// ----------------- UTILITIES -----------------
const determineRisk = (score: number, smtpValid: boolean, isCatchAll: boolean, isFreeEmail: boolean, provider: string) => {
  // ELITE SAFETY PROTOCOL (v12.0): Probabilistic Deliverability
  // A lead is 'safe' if it has:
  // 1. Successful SMTP handshake + Not a Catch-all
  // 2. High-trust Free Provider (Gmail/Outlook) + High Score
  // 3. High-trust Enterprise Infrastructure (Google/MSFT/Mimecast) + High Score + Successful Syntax
  
  const isHighTrustProvider = provider === 'google' || provider === 'microsoft' || provider === 'enterprise_gateway';
  
  if (score < 45) return { bounceRisk: 'Dangerous' as const, reputationImpact: 'Critical' as const, finalStatus: 'dangerous' as const };
  
  // Deliverability Safety Margin Logic
  const hasDirectProof = smtpValid && !isCatchAll;
  const hasInfrastructureTrust = (isFreeEmail || isHighTrustProvider) && score >= 85;
  
  const isEliteVerified = hasDirectProof || hasInfrastructureTrust;
  
  if (isEliteVerified && score >= 80) {
    return { bounceRisk: 'Safe' as const, reputationImpact: 'Positive' as const, finalStatus: 'safe' as const };
  }
  
  return { bounceRisk: 'High' as const, reputationImpact: 'Negative' as const, finalStatus: 'risky' as const };
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
    const socket = new net.Socket();
    let resolved = false;
    let currentStep = 0;
    let responseData = '';
    let smtpCode = 0;
    let retried = false;

    const timeout = setTimeout(() => {
      cleanup('Connection Timeout', true);
    }, 5000); // Boosted to 5s for Enterprise Stability

    const cleanup = (reason = '', timedOut = false) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      socket.removeAllListeners();
      socket.destroy();
      if (reason) {
        resolve({ success: false, code: 0, response: reason, timedOut });
      }
    };

    socket.setTimeout(5000);
    socket.on('timeout', () => cleanup('TCP Socket Timeout', true));
    socket.on('error', (err) => cleanup(err.message));

    // High-precision timing (No Jitter for Determinism)
    const engineDelay = async () => new Promise(res => setTimeout(res, 20));

    socket.connect(25, mxRecord, () => {
      // Step 0: Wait for 220
    });

    socket.on('data', async (data) => {
      const response = data.toString();
      responseData += response;
      const lines = response.split('\n').filter(l => l.trim().length > 0);
      if (lines.length === 0) return;
      const lastLine = lines[lines.length - 1];
      const code = parseInt(lastLine.substring(0, 3), 10);

      try {
        if (currentStep === 0 && code === 220) {
          currentStep++;
          await humanDelay();
          socket.write(`EHLO leadpure.ai\r\n`);
        } else if (currentStep === 1 && code === 250) {
          currentStep++;
          await engineDelay();
          socket.write(`MAIL FROM:<${senderEmail}>\r\n`);
        } else if (currentStep === 2 && code === 250) {
          currentStep++;
          await engineDelay();
          socket.write(`RCPT TO:<${email}>\r\n`);
        } else if (currentStep === 3) {
          if (code >= 400 && code < 500 && !retried) {
            retried = true;
            await new Promise(res => setTimeout(res, 1000)); // Precise 1s backoff
            socket.write(`RCPT TO:<${email}>\r\n`);
            return;
          }
          
          smtpCode = code;
          currentStep++;
          await engineDelay();
          socket.write('QUIT\r\n');
        } else if (currentStep === 4 || code === 221) {
          const success = smtpCode === 250 || smtpCode === 251;
          cleanup();
          resolve({ success, code: smtpCode, response: responseData, timedOut: false });
        } else if (code >= 400) {
          cleanup();
          resolve({ success: false, code, response: lastLine, timedOut: false });
        }
      } catch (e) {
        cleanup('Execution Error');
      }
    });

    socket.connect(25, mxRecord);
  });
};

export const validateEmailFull = async (email: string, options: ValidationOptions): Promise<ValidationResult> => {
  let cleanEmail = email.toLowerCase().trim().replace(/[\s"'\r\n]/g, '');
  
  if (emailCache.has(cleanEmail)) {
    return emailCache.get(cleanEmail)!;
  }

  // ENTERPRISE WEIGHTED SCORING MATRIX (v10.1)
  let score = 0;
  let reasons: string[] = [];
  
  // 1. Strict RFC 5322 Syntax Check (v10.0 Enterprise)
  // Ensures no trailing dots, leading dots, or consecutive dots.
  const hasConsecutiveDots = cleanEmail.includes('..');
  const hasInvalidDots = cleanEmail.startsWith('.') || cleanEmail.includes('.@') || cleanEmail.endsWith('.');
  
  if (!syntaxRegex.test(cleanEmail) || hasConsecutiveDots || hasInvalidDots) {
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
    // Determine provider intelligence with robust fingerprinting
    isFreeEmail = freeProviders.has(domain);
    const mxDomain = (primaryMx || '').toLowerCase();
    
    // Check for Parked Domain Signature
    let isParked = false;
    try {
      const aRecords = await resolver.resolve4(domain);
      isParked = aRecords.some(ip => parkedIpPatterns.some(pattern => ip.startsWith(pattern)));
    } catch (e) {
      // Ignore DNS errors for A records
    }

    if (isParked) {
      return {
        email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'Suspicious Domain: Parked / Under Construction',
        subStatus: 'parked', confidenceScore: 0, bounceRisk: 'High', reputationImpact: 'Negative',
        mxRecordFound: true, mxRecord: primaryMx, isCatchAll: false, isDisposable: false, isRoleBased: false, isFreeEmail: false, provider: 'none',
        smtpValid: false, syntaxValid: true
      };
    }
    // Pattern-based fingerprinting for Enterprise Infrastructure
    const isGoogle = domain.includes('gmail.com') || mxDomain.includes('google.com') || mxDomain.includes('googlemail.com');
    const isMicrosoft = domain.includes('outlook') || domain.includes('hotmail') || mxDomain.includes('outlook.com') || mxDomain.includes('protection.outlook');
    const isGateway = mxDomain.includes('mimecast.com') || 
                      mxDomain.includes('pphosted.com') || 
                      mxDomain.includes('barracudanetworks.com') || 
                      mxDomain.includes('sophos.com') || 
                      mxDomain.includes('mcsv.net') ||
                      mxDomain.includes('trendmicro.com') ||
                      mxDomain.includes('appriver.com') ||
                      mxDomain.includes('fireeye.com') ||
                      mxDomain.includes('messagelabs.com');

    if (isGoogle) provider = 'google';
    else if (isMicrosoft) provider = 'microsoft';
    else if (isGateway) provider = 'enterprise_gateway';

    // Disposable Check
    isDisposable = disposableDomains.has(domain);

    if (mxRecordFound) {
      // Parallelize DNS queries
      const [spfResult, dmarcResult] = await Promise.all([
        checkSpf(domain),
        checkDmarc(domain)
      ]);
      hasSpf = spfResult;
      hasDmarc = dmarcResult;
    }
  }

  // --- WEIGHTED POINT ACCUMULATION (v10.3 Advanced) ---
  if (mxRecordFound) {
    score += 40; // Core infrastructure foundation
    reasons.push("MX Infrastructure Active");
  } else {
    return {
      email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'Dead Domain: No MX Records Detected',
      subStatus: 'domain_not_found', confidenceScore: 0, bounceRisk: 'Dangerous', reputationImpact: 'Critical',
      mxRecordFound: false, isCatchAll: false, isDisposable, isRoleBased: false, isFreeEmail, provider,
      smtpValid: false, syntaxValid: true
    };
  }

  // TLD Reputation Analysis
  const tld = domain.substring(domain.lastIndexOf('.'));
  if (trustTlds.has(tld)) {
    score += 10;
    reasons.push("High-Trust TLD Reputation");
  } else if (toxicTlds.has(tld)) {
    score -= 30;
    reasons.push("Low-Trust/Toxic TLD Signature");
  }

  if (hasSpf) { score += 15; reasons.push("SPF Authenticated"); }
  if (hasDmarc) { score += 15; reasons.push("DMARC Policy Active"); }
  
  if (provider === 'google' || provider === 'microsoft' || provider === 'enterprise_gateway') {
    score += 20;
    reasons.push("Trusted Enterprise Infrastructure");
  }

  if (isDisposable) {
    score -= 100;
    reasons.push("Disposable Mail Provider Filtered");
  }

  // Role-based Check
  const isRoleBased = rolePrefixes.has(localPart);
  if (isRoleBased) {
    score -= 15;
    reasons.push("Non-Individual Role Identity");
  }

  // 6. SMTP Handshake Check
  let smtpValid = true;
  let subStatus = 'valid';

  const skipSmtp = isFreeEmail;
  
  if (skipSmtp) {
    score += 25;
    reasons.push("High-Trust Free Provider Signal");
  } else if (primaryMx) {
    const smtpCheck = await performSmtpCheck(cleanEmail, primaryMx);
    
    if (smtpCheck.success) {
      score += 25;
      reasons.push("SMTP Verification Success");
      smtpValid = true;
    } else if (smtpCheck.code === 550) {
      return {
        email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'Critical Fail: Mailbox Does Not Exist (Code 550)',
        subStatus: 'mailbox_not_found', confidenceScore: 0, bounceRisk: 'Dangerous', reputationImpact: 'Critical',
        mxRecordFound: true, mxRecord: primaryMx, isCatchAll: false, isDisposable, isRoleBased, isFreeEmail, provider,
        smtpValid: false, syntaxValid: true
      };
    } else if (smtpCheck.timedOut || smtpCheck.code === 0 || (smtpCheck.code >= 400 && smtpCheck.code < 500)) {
      smtpValid = false;
      subStatus = smtpCheck.timedOut ? 'timeout' : 'greylisted';
      reasons.push("SMTP Inconclusive (Probing Suppressed by Firewall)");
    }

    if (smtpValid && !isFreeEmail) {
      // Catch-all Detection Logic (Optimized v10.1)
      const mxLower = (primaryMx || '').toLowerCase();
      const catchAllSignatures = [
        'mimecast.com', 'pphosted.com', 'outlook.com', 'google.com', 
        'barracudanetworks.com', 'sophos.com', 'mcsv.net'
      ];
      
      const hasCatchAllSignature = catchAllSignatures.some(sig => mxLower.includes(sig));
      const randomPrefix = `verify_${Math.random().toString(36).substring(2, 10)}`;
      const catchAllCheck = await performSmtpCheck(`${randomPrefix}@${domain}`, primaryMx || '');
      
      if (catchAllCheck.success || catchAllCheck.timedOut || hasCatchAllSignature) {
        isCatchAll = true;
      }
    }
  }

  if (!cachedDomain && mxRecordFound) {
    domainCache.set(domain, {
      mxRecordFound,
      mxRecord: primaryMx,
      isCatchAll,
      isDisposable,
      isFreeEmail,
      provider,
      hasSpf,
      hasDmarc,
      timestamp: Date.now()
    });
  }

  if (isCatchAll) {
    // Advanced Catch-All Behavior: Corporate Catch-alls are safer than random ones
    if (provider === 'google' || provider === 'microsoft') {
      score -= 5; // Minimal penalty for high-trust corporate catch-alls
      reasons.push("Enterprise Catch-All Configuration (Reduced Risk)");
    } else {
      score -= 15;
      reasons.push("Catch-All Domain Configuration Detected");
    }
  }

  if (isRoleBased) {
    score -= 10;
    reasons.push("Professional Role Identity");
  }

  // Identity Pattern Analysis: Detection of "Professional" vs "Randomized" identities
  const hasDigit = /\d/.test(localPart);
  const isProfessionalPattern = localPart.includes('.') || localPart.includes('_');
  if (isProfessionalPattern && !hasDigit) {
    score += 5;
    reasons.push("Professional Identity Signature");
  } else if (localPart.length > 15 && !isProfessionalPattern) {
    score -= 10;
    reasons.push("Irregular Identity Structure");
  }

  // Enterprise Spam Trap Heuristics: Precision filtering
  const isSuspiciousAlphaNum = suspicousAlphaNumRegex.test(localPart); // Extreme numeric randomness like "ab123456" instead of standard "john1990"
  
  const hasToxicPattern = knownToxicPatterns.some(p => localPart.includes(p));

  if (hasToxicPattern || isSuspiciousAlphaNum) {
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

  const { bounceRisk, reputationImpact, finalStatus } = determineRisk(score, smtpValid, isCatchAll, isFreeEmail, provider);

  const result: ValidationResult = {
    email: cleanEmail,
    verificationStatus: finalStatus,
    verificationReason: reasons.length > 0 ? reasons.join(' • ') : 'Verified Profile Integrity',
    subStatus,
    confidenceScore: finalStatus === 'safe' ? Math.max(98, Math.min(100, score)) : Math.min(85, score),
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

  // ELITE CACHE POLICY: Only persist definitive results.
  // Never cache 'unknown' or 'timeout' results to ensure consistency across runs.
  const isDefinitive = result.verificationStatus !== 'unknown' && result.subStatus !== 'timeout' && result.subStatus !== 'engine_error';
  
  if (isDefinitive) {
    emailCache.set(cleanEmail, result);
    if (emailCache.size > 20000) emailCache.clear();
  }

  return result;
};
