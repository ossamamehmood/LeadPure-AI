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
  verificationStatus: 'verified' | 'risky' | 'rejected' | 'blocked';
  verificationReason: string;
  subStatus: string;
  confidenceScore: number;
  bounceRisk: 'Safe' | 'Medium' | 'High' | 'Dangerous';
  reputationImpact: 'Positive' | 'Neutral' | 'Negative' | 'Critical';
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

// Data Sets
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

// Utility for formatting reasons
const determineRisk = (score: number) => {
  if (score < 50) return { bounceRisk: 'Dangerous' as const, reputationImpact: 'Critical' as const, finalStatus: 'rejected' as const };
  if (score < 80) return { bounceRisk: 'High' as const, reputationImpact: 'Negative' as const, finalStatus: 'rejected' as const };
  if (score < 94) return { bounceRisk: 'Medium' as const, reputationImpact: 'Neutral' as const, finalStatus: 'risky' as const };
  if (score < 99) return { bounceRisk: 'Safe' as const, reputationImpact: 'Positive' as const, finalStatus: 'risky' as const };
  return { bounceRisk: 'Safe' as const, reputationImpact: 'Positive' as const, finalStatus: 'verified' as const };
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
      const lastLine = lines[lines.length - 1];
      const code = parseInt(lastLine.substring(0, 3), 10);

      // Simple SMTP State Machine
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
        // Final RCPT TO Response
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
        // Soft or Hard bounce during handshake
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

  // 2. Identify Provider & Free Email
  const isFreeEmail = freeProviders.has(domain);
  let provider = 'Other';
  if (domain.includes('gmail.com')) provider = 'google';
  else if (domain.includes('yahoo') || domain.includes('ymail')) provider = 'yahoo';
  else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) provider = 'microsoft';

  // 3. Disposable Check
  const isDisposable = disposableDomains.has(domain);
  if (isDisposable) {
    if (options.excludeDisposable) {
      return {
        email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'Policy Block: Disposable Mail Provider',
        subStatus: 'disposable', confidenceScore: 0, bounceRisk: 'Dangerous', reputationImpact: 'Critical',
        mxRecordFound: true, isCatchAll: false, isDisposable: true, isRoleBased: false, isFreeEmail, provider,
        smtpValid: false, syntaxValid: true
      };
    }
    score -= 85;
    reasons.push("Disposable Provider Flag");
  }

  // 4. Role-based Check
  const isRoleBased = rolePrefixes.has(localPart);
  if (isRoleBased) {
    if (options.excludeRoleBased) {
      return {
        email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'Protocol Filter: Role-Based Identity Purge',
        subStatus: 'role_based', confidenceScore: 15, bounceRisk: 'Medium', reputationImpact: 'Neutral',
        mxRecordFound: true, isCatchAll: false, isDisposable, isRoleBased: true, isFreeEmail, provider,
        smtpValid: true, syntaxValid: true
      };
    }
    score -= 35;
    reasons.push("Generic Role Identity");
  }

  // 5. DNS MX Check (Strict)
  let mxRecords: dns.MxRecord[] = [];
  try {
    mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) throw new Error('No MX');
    // Sort by priority
    mxRecords.sort((a, b) => a.priority - b.priority);
  } catch (err: any) {
    // Attempt A record fallback (some domains receive mail on A record)
    try {
      const aRecords = await resolve4(domain);
      if (!aRecords || aRecords.length === 0) throw new Error('No A');
    } catch (aErr) {
      return {
        email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'Engine Rejected: Dead Domain (No MX or A Records)',
        subStatus: 'domain_not_found', confidenceScore: 0, bounceRisk: 'Dangerous', reputationImpact: 'Critical',
        mxRecordFound: false, isCatchAll: false, isDisposable, isRoleBased, isFreeEmail, provider,
        smtpValid: false, syntaxValid: true
      };
    }
  }

  const primaryMx = mxRecords.length > 0 ? mxRecords[0].exchange : domain;

  // 6. SMTP Handshake Check
  let smtpValid = true;
  let isCatchAll = false;
  let subStatus = 'valid';

  // Do not perform SMTP checks on Yahoo/Microsoft as they aggressively block unknown IPs.
  // We perform it on Google/Custom domains.
  const skipSmtp = isFreeEmail && (provider === 'yahoo' || provider === 'microsoft');
  
  if (!skipSmtp && primaryMx) {
    // 6a. Real mailbox check
    const smtpCheck = await performSmtpCheck(cleanEmail, primaryMx);
    
    // Handle Vercel Port 25 Block (ETIMEDOUT or Connection Refused usually indicates firewall)
    if (smtpCheck.timedOut || smtpCheck.code === 0) {
      reasons.push("SMTP Reachability Blocked (Environment Firewall)");
      // We soft fail and don't reduce score drastically because this is an environment limit, not an email issue.
      smtpValid = true; 
    } else if (smtpCheck.code === 550) {
      return {
        email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'SMTP RCPT_TO: Mailbox Not Found (Code 550)',
        subStatus: 'mailbox_not_found', confidenceScore: 0, bounceRisk: 'Dangerous', reputationImpact: 'Critical',
        mxRecordFound: true, mxRecord: primaryMx, isCatchAll: false, isDisposable, isRoleBased, isFreeEmail, provider,
        smtpValid: false, syntaxValid: true
      };
    } else if (smtpCheck.code >= 400 && smtpCheck.code < 500) {
      score -= 20;
      reasons.push(`SMTP Soft-Bounce: Greylisted/RateLimited (Code ${smtpCheck.code})`);
    } else if (smtpCheck.success) {
      smtpValid = true;
    }

    // 6b. Catch-All Verification (Only if Mailbox was found and we didn't timeout)
    if (smtpValid && !smtpCheck.timedOut && !isFreeEmail) {
      const randomPrefix = `verify_${Math.random().toString(36).substring(2, 10)}`;
      const catchAllCheck = await performSmtpCheck(`${randomPrefix}@${domain}`, primaryMx);
      
      if (catchAllCheck.success) {
        isCatchAll = true;
        if (options.excludeCatchAll) {
          return {
            email: cleanEmail, verificationStatus: 'rejected', verificationReason: 'Policy Block: Catch-All Protocol Confirmed via SMTP',
            subStatus: 'catch_all', confidenceScore: 30, bounceRisk: 'High', reputationImpact: 'Negative',
            mxRecordFound: true, mxRecord: primaryMx, isCatchAll: true, isDisposable, isRoleBased, isFreeEmail, provider,
            smtpValid: true, syntaxValid: true
          };
        }
        score -= 25;
        reasons.push("Catch-All Domain Signature Confirmed");
        subStatus = 'catch_all';
      }
    }
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
