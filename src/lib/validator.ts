import dns from 'dns';
import net from 'net';
import fs from 'fs';
import path from 'path';

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
  isSpamTrap: boolean;
  provider: string;
  smtpValid: boolean;
  syntaxValid: boolean;
  didyouseeme: boolean;
  
  // Standardized schema.md fields
  status: 'SAFE' | 'RISKY' | 'INVALID' | 'UNKNOWN';
  sub_status?: string;
  failure_code?: 'ERR_001' | 'ERR_002' | 'ERR_003' | 'ERR_004' | 'ERR_005' | 'ERR_006' | 'ERR_007' | 'ERR_008' | 'ERR_009' | null;
  smtp_code?: number | null;
  mx_ip?: string | null;
  timestamp?: string;
  is_catchall?: boolean;
  
  // Telemetry Trace Log
  trace?: string;
}

// ----------------- DATA SETS -----------------
const disposableDomains = new Set([
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

// Attempt to load 9,200+ disposable domains from high-speed local lookup table
try {
  const jsonPath = path.resolve('C:/Users/ossamamehmood/.gemini/antigravity/scratch/LeadPure-AI/src/lib/disposable-domains.json');
  if (fs.existsSync(jsonPath)) {
    const list = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (Array.isArray(list)) {
      list.forEach(d => disposableDomains.add(String(d).toLowerCase().trim()));
    }
  }
} catch (e) {
  console.warn('[DEA_INIT] Failed to load high-speed disposable domains list:', e);
}

const rolePrefixes = new Set([
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

// ----------------- LOW-LEVEL SMTP SOCKET HANDSHAKE ENGINE -----------------
export const performSmtpCheck = async (
  email: string,
  mxRecord: string,
  senderEmail = 'verify@leadpure.ai'
): Promise<{ success: boolean; code: number; response: string; timedOut: boolean }> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    let currentStep = 0;
    let responseData = '';
    let smtpCode = 0;

    const timeout = setTimeout(() => {
      cleanup('Connection Timeout', true);
    }, 6000); // 6s connection & processing timeout

    const cleanup = (reason = '', timedOut = false) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      socket.removeAllListeners();
      socket.destroy();
      resolve({
        success: smtpCode === 250 || smtpCode === 251,
        code: smtpCode,
        response: responseData.trim() || reason,
        timedOut
      });
    };

    socket.setTimeout(6000);
    socket.on('timeout', () => cleanup('TCP Socket Timeout', true));
    socket.on('error', (err) => {
      responseData += ` [Socket Error: ${err.message}]`;
      cleanup(err.message);
    });

    const engineDelay = () => new Promise(res => setTimeout(res, 50));

    socket.on('data', async (data) => {
      const response = data.toString();
      responseData += response;
      const lines = response.split('\r\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) return;
      
      const lastLine = lines[lines.length - 1];
      // RFC 5321 check: Standard reply has 3-digit code followed by a space
      const isCompleteLine = /^\d{3}\s/.test(lastLine);
      if (!isCompleteLine) return; // Wait for full line buffer

      const code = parseInt(lastLine.substring(0, 3), 10);
      try {
        if (currentStep === 0) {
          if (code === 220) {
            currentStep++;
            socket.write(`EHLO leadpure.ai\r\n`);
          } else {
            smtpCode = code;
            cleanup();
          }
        } else if (currentStep === 1) {
          if (code === 250) {
            currentStep++;
            await engineDelay();
            socket.write(`MAIL FROM:<${senderEmail}>\r\n`);
          } else {
            smtpCode = code;
            cleanup();
          }
        } else if (currentStep === 2) {
          if (code === 250) {
            currentStep++;
            await engineDelay();
            socket.write(`RCPT TO:<${email}>\r\n`);
          } else {
            smtpCode = code;
            cleanup();
          }
        } else if (currentStep === 3) {
          smtpCode = code;
          currentStep++;
          await engineDelay();
          socket.write('QUIT\r\n');
        } else if (currentStep === 4 || code === 221) {
          cleanup();
        }
      } catch (e: any) {
        cleanup(`Execution Error: ${e.message}`);
      }
    });

    socket.connect(25, mxRecord);
  });
};

// ----------------- CORE 10-LAYER VALIDATION PROTOCOL -----------------
export const validateEmailFull = async (email: string, options: ValidationOptions): Promise<ValidationResult> => {
  const cleanEmail = email.toLowerCase().trim().replace(/[\s"'\r\n]/g, '');
  const timestamp = new Date().toISOString();
  const traceSteps: string[] = [];

  // Return cached result if available
  if (emailCache.has(cleanEmail)) {
    return emailCache.get(cleanEmail)!;
  }

  // 1. Strict RFC Syntax Check (Layer 1)
  const hasConsecutiveDots = cleanEmail.includes('..');
  const hasInvalidDots = cleanEmail.startsWith('.') || cleanEmail.includes('.@') || cleanEmail.endsWith('.');
  
  if (!syntaxRegex.test(cleanEmail) || hasConsecutiveDots || hasInvalidDots) {
    traceSteps.push('Syntax: Invalid (ERR_001)');
    const res: ValidationResult = {
      email: cleanEmail,
      verificationStatus: 'blocked',
      verificationReason: 'Fatal Syntax: Malformed address structure',
      subStatus: 'invalid_syntax',
      confidenceScore: 0,
      bounceRisk: 'Dangerous',
      reputationImpact: 'Critical',
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
      status: 'INVALID',
      sub_status: 'invalid_syntax',
      failure_code: 'ERR_001',
      smtp_code: null,
      mx_ip: null,
      timestamp,
      is_catchall: false,
      trace: traceSteps.join(' -> ')
    };
    console.log(`[TRACE] [${cleanEmail}] syntax error: malformed structure`);
    return res;
  }
  traceSteps.push('Syntax: Valid');

  const parts = cleanEmail.split('@');
  const localPart = parts[0];
  const domain = parts[1];

  // 2. Disposable Email Asset Detection (Layer 4)
  const isDisposable = disposableDomains.has(domain);
  if (isDisposable && options.excludeDisposable) {
    traceSteps.push('DEA: Blocked (ERR_004)');
    const res: ValidationResult = {
      email: cleanEmail,
      verificationStatus: 'rejected',
      verificationReason: 'System Suppressed: Disposable / temporary burner mailbox detected',
      subStatus: 'disposable',
      confidenceScore: 0,
      bounceRisk: 'Dangerous',
      reputationImpact: 'Critical',
      mxRecordFound: false,
      isCatchAll: false,
      isDisposable: true,
      isRoleBased: false,
      isFreeEmail: false,
      isSpamTrap: false,
      provider: 'Unknown',
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      status: 'INVALID',
      sub_status: 'disposable',
      failure_code: 'ERR_004',
      smtp_code: null,
      mx_ip: null,
      timestamp,
      is_catchall: false,
      trace: traceSteps.join(' -> ')
    };
    console.log(`[TRACE] [${cleanEmail}] blocked disposable domain: ${domain}`);
    return res;
  }
  traceSteps.push('DEA: Passed');

  // 3. Suppress Generic Role Aliases (Layer 5)
  const isRoleBased = rolePrefixes.has(localPart);
  if (isRoleBased && options.excludeRoleBased) {
    traceSteps.push('Role: Blocked (ERR_006)');
    const res: ValidationResult = {
      email: cleanEmail,
      verificationStatus: 'blocked',
      verificationReason: 'System Suppressed: Non-individual generic role alias',
      subStatus: 'role_based',
      confidenceScore: 0,
      bounceRisk: 'Dangerous',
      reputationImpact: 'Critical',
      mxRecordFound: false,
      isCatchAll: false,
      isDisposable: false,
      isRoleBased: true,
      isFreeEmail: false,
      isSpamTrap: false,
      provider: 'Unknown',
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      status: 'INVALID',
      sub_status: 'role_based',
      failure_code: 'ERR_006',
      smtp_code: null,
      mx_ip: null,
      timestamp,
      is_catchall: false,
      trace: traceSteps.join(' -> ')
    };
    console.log(`[TRACE] [${cleanEmail}] blocked role prefix: ${localPart}`);
    return res;
  }
  traceSteps.push('Role: Passed');

  // 4. DNS & MX Infrastructure Checking (Layer 2)
  let mxRecordFound = false;
  let primaryMx: string | undefined = undefined;
  let mxIp: string | null = null;
  let isFreeEmail = freeProviders.has(domain);
  let provider = 'Other';

  try {
    const mxRecords = await resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      mxRecordFound = true;
      const sortedMx = mxRecords.sort((a, b) => a.preference - b.preference);
      primaryMx = sortedMx[0].exchange;
      
      // Resolve IP of primary MX for mx_ip
      try {
        const ips = await resolver.resolve4(primaryMx);
        if (ips && ips.length > 0) {
          mxIp = ips[0];
        }
      } catch (dnsErr) {
        // Fallback to resolve MX host name
      }
    }
  } catch (err) {
    mxRecordFound = false;
  }

  if (!mxRecordFound || !primaryMx) {
    traceSteps.push('DNS: Failed (ERR_002)');
    const res: ValidationResult = {
      email: cleanEmail,
      verificationStatus: 'rejected',
      verificationReason: 'System Rejected: Dead Domain (No MX records resolved)',
      subStatus: 'domain_not_found',
      confidenceScore: 0,
      bounceRisk: 'Dangerous',
      reputationImpact: 'Critical',
      mxRecordFound: false,
      isCatchAll: false,
      isDisposable,
      isRoleBased,
      isFreeEmail,
      isSpamTrap: false,
      provider: 'Unknown',
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      status: 'INVALID',
      sub_status: 'domain_not_found',
      failure_code: 'ERR_002',
      smtp_code: null,
      mx_ip: null,
      timestamp,
      is_catchall: false,
      trace: traceSteps.join(' -> ')
    };
    console.log(`[TRACE] [${cleanEmail}] DNS resolution failed for domain: ${domain}`);
    return res;
  }
  traceSteps.push(`DNS: MX resolved (${primaryMx})`);

  // Fingerprint Provider
  const mxLower = primaryMx.toLowerCase();
  if (domain.includes('gmail.com') || mxLower.includes('google.com') || mxLower.includes('googlemail.com')) {
    provider = 'google';
  } else if (domain.includes('outlook') || domain.includes('hotmail') || mxLower.includes('outlook.com') || mxLower.includes('protection.outlook')) {
    provider = 'microsoft';
  } else if (
    mxLower.includes('mimecast.com') || mxLower.includes('pphosted.com') || mxLower.includes('barracudanetworks.com') || 
    mxLower.includes('sophos.com') || mxLower.includes('mcsv.net') || mxLower.includes('trendmicro.com') ||
    mxLower.includes('appriver.com') || mxLower.includes('fireeye.com') || mxLower.includes('messagelabs.com')
  ) {
    provider = 'enterprise_gateway';
  }

  // Check Parked Domain Signature
  let isParked = false;
  try {
    const aRecords = await resolver.resolve4(domain);
    isParked = aRecords.some(ip => parkedIpPatterns.some(pattern => ip.startsWith(pattern)));
  } catch (e) {
    // Ignore parked domain DNS error
  }

  if (isParked) {
    traceSteps.push('DNS: Parked Domain (ERR_002)');
    const res: ValidationResult = {
      email: cleanEmail,
      verificationStatus: 'rejected',
      verificationReason: 'System Rejected: Domain is parked or under construction',
      subStatus: 'parked',
      confidenceScore: 0,
      bounceRisk: 'Dangerous',
      reputationImpact: 'Critical',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll: false,
      isDisposable,
      isRoleBased,
      isFreeEmail,
      isSpamTrap: false,
      provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      status: 'INVALID',
      sub_status: 'parked',
      failure_code: 'ERR_002',
      smtp_code: null,
      mx_ip: mxIp,
      timestamp,
      is_catchall: false,
      trace: traceSteps.join(' -> ')
    };
    console.log(`[TRACE] [${cleanEmail}] blocked parked domain: ${domain}`);
    return res;
  }

  // 5. Catch-All Double Probe Protection (Layer 7)
  let isCatchAll = false;
  const cachedDomain = domainCache.get(domain);
  if (cachedDomain && (Date.now() - cachedDomain.timestamp < CACHE_TTL)) {
    isCatchAll = cachedDomain.isCatchAll;
    traceSteps.push(`Catch-All: Cached (${isCatchAll ? 'Active' : 'Inactive'})`);
  } else {
    // Run randomized control handshake before target validation
    const randomIdentity = `false_positive_test_${Math.random().toString(36).substring(2, 10)}`;
    const controlEmail = `${randomIdentity}@${domain}`;
    console.log(`[TRACE] [${cleanEmail}] executing control probe on catch-all: ${controlEmail}`);
    
    const controlCheck = await performSmtpCheck(controlEmail, primaryMx);
    
    // Explicit trace logging of the control handshake
    console.log(`[TRACE] [${cleanEmail}] control SMTP response: code=${controlCheck.code} response="${controlCheck.response}" timedOut=${controlCheck.timedOut}`);

    if (controlCheck.success || controlCheck.code === 250 || controlCheck.code === 251) {
      isCatchAll = true;
      traceSteps.push('Catch-All: Control probe accepted (Accept-All Active)');
    } else {
      traceSteps.push('Catch-All: Control probe rejected (Accept-All Inactive)');
    }

    // Cache the domain intelligence
    domainCache.set(domain, {
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll,
      isDisposable,
      isFreeEmail,
      provider,
      timestamp: Date.now()
    });
  }

  if (isCatchAll && options.excludeCatchAll) {
    traceSteps.push('Catch-All: Blocked (ERR_005)');
    const res: ValidationResult = {
      email: cleanEmail,
      verificationStatus: 'rejected',
      verificationReason: 'System Suppressed: Accept-All / Catch-All Domain policy filter',
      subStatus: 'catch_all',
      confidenceScore: 0,
      bounceRisk: 'Dangerous',
      reputationImpact: 'Critical',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll: true,
      isDisposable,
      isRoleBased,
      isFreeEmail,
      isSpamTrap: false,
      provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      status: 'INVALID',
      sub_status: 'catch_all',
      failure_code: 'ERR_005',
      smtp_code: 250,
      mx_ip: mxIp,
      timestamp,
      is_catchall: true,
      trace: traceSteps.join(' -> ')
    };
    console.log(`[TRACE] [${cleanEmail}] blocked catch-all domain: ${domain}`);
    return res;
  }

  // 6. Deep Outbound SMTP Handshake (Layer 6)
  console.log(`[TRACE] [${cleanEmail}] executing deep SMTP probe to MX server: ${primaryMx}`);
  const smtpCheck = await performSmtpCheck(cleanEmail, primaryMx);
  
  // Explicit trace logging of target handshake
  console.log(`[TRACE] [${cleanEmail}] SMTP probe result: code=${smtpCheck.code} response="${smtpCheck.response}" timedOut=${smtpCheck.timedOut}`);

  let result: ValidationResult;

  if (smtpCheck.timedOut) {
    traceSteps.push('SMTP: Socket Timeout (ERR_009)');
    result = {
      email: cleanEmail,
      verificationStatus: 'risky',
      verificationReason: `SMTP Connection Timeout: ${smtpCheck.response}`,
      subStatus: 'timeout',
      confidenceScore: 50,
      bounceRisk: 'Medium',
      reputationImpact: 'Neutral',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll,
      isDisposable,
      isRoleBased,
      isFreeEmail,
      isSpamTrap: false,
      provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      status: 'RISKY',
      sub_status: 'timeout',
      failure_code: 'ERR_009',
      smtp_code: null,
      mx_ip: mxIp,
      timestamp,
      is_catchall: isCatchAll,
      trace: traceSteps.join(' -> ')
    };
  } else if (smtpCheck.code === 550 || smtpCheck.code === 551 || smtpCheck.code === 552 || smtpCheck.code === 554) {
    traceSteps.push(`SMTP: Hard Fail Code ${smtpCheck.code} (ERR_003)`);
    result = {
      email: cleanEmail,
      verificationStatus: 'rejected',
      verificationReason: `System Rejected: Mailbox does not exist (SMTP ${smtpCheck.code})`,
      subStatus: 'mailbox_not_found',
      confidenceScore: 0,
      bounceRisk: 'Dangerous',
      reputationImpact: 'Critical',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll,
      isDisposable,
      isRoleBased,
      isFreeEmail,
      isSpamTrap: false,
      provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      status: 'INVALID',
      sub_status: 'mailbox_not_found',
      failure_code: 'ERR_003',
      smtp_code: smtpCheck.code,
      mx_ip: mxIp,
      timestamp,
      is_catchall: isCatchAll,
      trace: traceSteps.join(' -> ')
    };
  } else if (smtpCheck.code === 421 || smtpCheck.code === 450 || smtpCheck.code === 451 || smtpCheck.code === 452) {
    traceSteps.push(`SMTP: Greylisted/Throttled Code ${smtpCheck.code} (ERR_007)`);
    result = {
      email: cleanEmail,
      verificationStatus: 'risky',
      verificationReason: `System Deflected: Target server Greylisting/Throttling (SMTP ${smtpCheck.code})`,
      subStatus: 'greylisted',
      confidenceScore: 60,
      bounceRisk: 'High',
      reputationImpact: 'Negative',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll,
      isDisposable,
      isRoleBased,
      isFreeEmail,
      isSpamTrap: false,
      provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      status: 'RISKY',
      sub_status: 'greylisted',
      failure_code: 'ERR_007',
      smtp_code: smtpCheck.code,
      mx_ip: mxIp,
      timestamp,
      is_catchall: isCatchAll,
      trace: traceSteps.join(' -> ')
    };
  } else if (smtpCheck.success || smtpCheck.code === 250 || smtpCheck.code === 251) {
    traceSteps.push(`SMTP: Handshake Success Code ${smtpCheck.code || 250}`);
    result = {
      email: cleanEmail,
      verificationStatus: 'safe',
      verificationReason: 'Verified Deliverable: Active target mailbox handshake confirmed',
      subStatus: 'valid',
      confidenceScore: 99,
      bounceRisk: 'Safe',
      reputationImpact: 'Positive',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll,
      isDisposable,
      isRoleBased,
      isFreeEmail,
      isSpamTrap: false,
      provider,
      smtpValid: true,
      syntaxValid: true,
      didyouseeme: false,
      status: 'SAFE',
      sub_status: 'valid',
      failure_code: null,
      smtp_code: smtpCheck.code || 250,
      mx_ip: mxIp,
      timestamp,
      is_catchall: isCatchAll,
      trace: traceSteps.join(' -> ')
    };
  } else {
    traceSteps.push(`SMTP: Inconclusive Code ${smtpCheck.code || 0} (ERR_003)`);
    result = {
      email: cleanEmail,
      verificationStatus: 'risky',
      verificationReason: `SMTP Inconclusive Handshake: ${smtpCheck.response} (Code ${smtpCheck.code})`,
      subStatus: 'inconclusive',
      confidenceScore: 50,
      bounceRisk: 'Medium',
      reputationImpact: 'Neutral',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll,
      isDisposable,
      isRoleBased,
      isFreeEmail,
      isSpamTrap: false,
      provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      status: 'RISKY',
      sub_status: 'inconclusive',
      failure_code: 'ERR_003',
      smtp_code: smtpCheck.code || null,
      mx_ip: mxIp,
      timestamp,
      is_catchall: isCatchAll,
      trace: traceSteps.join(' -> ')
    };
  }

  // ELITE CACHE POLICY
  const isDefinitive = result.status === 'SAFE' || (result.status === 'INVALID' && result.sub_status !== 'engine_error');
  if (isDefinitive) {
    emailCache.set(cleanEmail, result);
    if (emailCache.size > 20000) emailCache.clear();
  }

  return result;
};
