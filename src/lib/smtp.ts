import net from 'net';
import crypto from 'crypto';
import { shouldSkipCatchAll } from './data/free-providers.js';

export interface SmtpCheckResult {
  canConnect: boolean;
  isDeliverable: boolean;
  isCatchAll: boolean;
  hasFullInbox: boolean;
  isDisabled: boolean;
  isGreylisted: boolean;
  isBlocked?: boolean;
  code: number | null;
  response: string;
  verifMethod: 'smtp' | 'yahoo_api' | 'microsoft365_api' | 'backend' | 'smtp_unreachable';
  transcript?: string[];
}

// ----------------- LEADPURE SMTP RESPONSE PARSER -----------------

export function isGreylisted(response: string): boolean {
  const e = response.toLowerCase();
  return (
    e.includes('greylist') ||
    e.includes('graylist') ||
    e.includes('grey-list') ||
    e.includes('gray-list') ||
    e.includes('postgrey') ||
    e.includes('please come back later') ||
    e.includes('try again later') ||
    e.includes('temporary failure') ||
    e.includes('try later')
  );
}

export function isServiceClosing(code: number | null): boolean {
  return code === 421;
}

export function isFullInbox(response: string): boolean {
  const e = response.toLowerCase();
  return (
    e.includes('insufficient') ||
    e.includes('mailbox full') ||
    e.includes('quota exceeded') ||
    e.includes('over quota') ||
    e.includes('too many messages') ||
    e.includes('out of storage space') ||
    e.includes('exceeded storage allocation')
  );
}

export function isDisabledAccount(response: string): boolean {
  const e = response.toLowerCase();
  return (
    e.includes('disabled') ||
    e.includes('account closed') ||
    e.includes('inactive') ||
    e.includes('deactivated') ||
    e.includes('not our customer')
  );
}

/**
 * Detects whether the mail provider actively blocked the verification probe
 * due to anti-spam, tarpitting, or IP reputation rules (e.g. Microsoft Hotmail/Outlook).
 * RFC 3463: 5.7.1 = Delivery not authorized / refused by rule.
 */
export function isProviderBlocked(response: string, code: number | null): boolean {
  const e = response.toLowerCase();
  return (
    code === 421 ||
    e.includes('5.7.1') ||
    e.includes('blocked') ||
    e.includes('block list') ||
    e.includes('blocklist') ||
    e.includes('spamhaus') ||
    e.includes('barracuda') ||
    e.includes('reputation') ||
    e.includes('access denied') ||
    e.includes('service unavailable') ||
    e.includes('too many connections') ||
    e.includes('connection refused by rule') ||
    e.includes('unfortunate') || // "Unfortunately, messages from [IP] weren't sent" (Microsoft Hotmail/Outlook)
    e.includes('s3150') ||       // Microsoft NDR diagnostic code
    e.includes('client host')
  );
}

export function isInvalidRecipient(response: string, email: string): boolean {
  const e = response.toLowerCase();
  const cleanEmail = email.toLowerCase().trim();

  // Notice: 5.7.1 is intentionally excluded here as it is a provider policy block, not a dead mailbox.
  return (
    e.includes('address rejected') ||
    e.includes('unrouteable') ||
    e.includes('does not exist') ||
    e.includes('invalid address') ||
    e.includes('invalid email address') ||
    e.includes('invalid recipient') ||
    e.includes('may not exist') ||
    e.includes('recipient invalid') ||
    e.includes('recipient rejected') ||
    e.includes('unknown recipient') ||
    e.includes('unknown recipient address') ||
    e.includes('undeliverable') ||
    e.includes('user unknown') ||
    e.includes('unknown user') ||
    e.includes('recipient unknown') ||
    e.includes('no such user') ||
    e.includes('no such user here') ||
    e.includes(`mailbox ${cleanEmail} unknown`) ||
    e.includes('mailbox not found') ||
    e.includes('invalid mailbox') ||
    e.includes('no mailbox') ||
    e.includes('no such mailbox') ||
    e.includes('not our customer') ||
    e.includes('account closed') ||
    e.includes('mailbox unavailable') ||
    e.includes('mailbox is unavailable') ||
    e.includes('not a valid mailbox') ||
    e.includes('no such recipient') ||
    e.includes('have an account') ||
    e.includes('unknown local part') ||
    e.includes('no longer available') ||
    e.includes("dosn't exist") ||
    e.includes("doesn't exist") ||
    e.includes('could not be found') ||
    e.includes('no such person') ||
    e.includes('address error') ||
    e.includes('address is not handled') ||
    e.includes('recipient is not exist') ||
    e.includes('recipient not found') ||
    e.includes("email doesn't exist") ||
    e.includes('verify address failed') ||
    e.includes('unable to verify user') ||
    e.includes('utilisateur inconnu') ||
    e.includes('no mail-enabled subscriptions') ||
    e.includes('permanent: 5.1.1') ||
    e.includes('5.1.1')
  );
}

// ----------------- LEADPURE DIRECT HTTPS YAHOO PROBE -----------------

export async function checkYahooViaApi(username: string): Promise<{
  success: boolean;
  isDeliverable: boolean;
  reason: string;
}> {
  const signupUrl = 'https://login.yahoo.com/account/create?lang=en-US&src=ym&done=https%3A%2F%2Fmail.yahoo.com%2F&specId=yidregsimplified';
  const validateUrl = 'https://login.yahoo.com/account/create/validate?lang=en-US&src=ym&done=https%3A%2F%2Fmail.yahoo.com%2F&specId=yidregsimplified&validateField=userId';
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const getRes = await fetch(signupUrl, {
      headers: { 'User-Agent': userAgent },
      signal: controller.signal
    });
    clearTimeout(timeout);

    const cookies = (getRes.headers as any).getSetCookie
      ? (getRes.headers as any).getSetCookie().map((c: string) => c.split(';')[0]).join('; ')
      : getRes.headers.get('set-cookie') || '';

    const html = await getRes.text();
    const sessionIndexMatch = html.match(/name="sessionIndex"\s+value="([^"]+)"/i) || html.match(/value="([^"]+)"\s+name="sessionIndex"/i);
    const acrumbMatch = html.match(/name="acrumb"\s+value="([^"]+)"/i) || html.match(/value="([^"]+)"\s+name="acrumb"/i);
    const crumbMatch = html.match(/name="crumb"\s+value="([^"]+)"/i) || html.match(/value="([^"]+)"\s+name="crumb"/i);

    if (!sessionIndexMatch || !acrumbMatch) {
      return { success: false, isDeliverable: false, reason: 'Failed to obtain Yahoo session tokens' };
    }

    const params = new URLSearchParams();
    params.append('acrumb', acrumbMatch[1]);
    params.append('crumb', crumbMatch ? crumbMatch[1] : '');
    params.append('sessionIndex', sessionIndexMatch[1]);
    params.append('specId', 'yidregsimplified');
    params.append('userId', username);
    params.append('yidDomain', 'yahoo.com');

    const postController = new AbortController();
    const postTimeout = setTimeout(() => postController.abort(), 4500);

    const postRes = await fetch(validateUrl, {
      method: 'POST',
      headers: {
        'Origin': 'https://login.yahoo.com',
        'Referer': signupUrl,
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': userAgent,
        'Accept': '*/*',
        'Cookie': cookies,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString(),
      signal: postController.signal
    });
    clearTimeout(postTimeout);

    const data: any = await postRes.json();
    if (data && data.fields && data.fields.userId) {
      const err = data.fields.userId.error;
      if (err && (err.id === 'IDENTIFIER_EXISTS' || err.id === 'RESERVED_WORD_PRESENT' || err.id === 'IDENTIFIER_NOT_AVAILABLE')) {
        return { success: true, isDeliverable: true, reason: 'Yahoo verified active mailbox (LeadPure HTTPS probe)' };
      }
      if (!err) {
        return { success: true, isDeliverable: false, reason: 'Yahoo mailbox does not exist (available to register)' };
      }
      if (err.id === 'SOME_SPECIAL_CHARACTERS_NOT_ALLOWED' || err.id === 'INVALID_CHARACTERS' || err.id === 'LENGTH_TOO_SHORT' || err.id === 'LENGTH_TOO_LONG') {
        return { success: true, isDeliverable: false, reason: `Yahoo rejects username format: ${err.id}` };
      }
    }

    return { success: false, isDeliverable: false, reason: 'Yahoo API response was inconclusive' };
  } catch (err: any) {
    return { success: false, isDeliverable: false, reason: `Yahoo API error: ${err.message}` };
  }
}

// ----------------- LEADPURE MICROSOFT 365 ENTERPRISE VALIDATOR -----------------

export async function checkMicrosoft365Tenant(email: string, domain: string): Promise<boolean | null> {
  const atIdx = email.indexOf('@');
  if (atIdx === -1) return null;
  const username = email.substring(0, atIdx);
  const tenant = domain.split('.')[0];

  const onedriveUrl = `https://${tenant}-my.sharepoint.com/personal/${username.replace(/\./g, '_')}_${domain.replace(/\./g, '_')}/_layouts/15/onedrive.aspx`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(onedriveUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.status === 403) {
      return true;
    }
    return null;
  } catch {
    return null;
  }
}

// ----------------- LOW-LEVEL SMTP SOCKET HANDSHAKE (RFC 5321) -----------------

export async function executeSmtpSocketHandshake(
  email: string,
  mxRecord: string,
  fromEmail = 'verify@leadpure.ai',
  timeoutMs = 6000
): Promise<{
  connected: boolean;
  code: number | null;
  response: string;
  isPositive: boolean;
  timedOut: boolean;
  transcript: string[];
}> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    let currentStep = 0;
    let fullResponse = '';
    let lastCode: number | null = null;
    const transcript: string[] = [];

    const timer = setTimeout(() => {
      finish('SMTP Connection Timeout', true);
    }, timeoutMs);

    const finish = (reason = '', timedOut = false) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      socket.removeAllListeners();
      socket.destroy();
      resolve({
        connected: currentStep > 0,
        code: lastCode,
        response: fullResponse.trim() || reason,
        isPositive: lastCode === 250 || lastCode === 251,
        timedOut,
        transcript
      });
    };

    socket.setTimeout(timeoutMs);
    socket.on('timeout', () => finish('TCP Socket Timeout', true));
    socket.on('error', (err) => {
      fullResponse += ` [Socket Error: ${err.message}]`;
      transcript.push(`<- [Socket Error: ${err.message}]`);
      finish(err.message, false);
    });

    socket.on('data', (chunk) => {
      const text = chunk.toString();
      fullResponse += text;
      const lines = text.split('\r\n').map(l => l.trim()).filter(l => l.length > 0);
      for (const line of lines) {
        transcript.push(`<- ${line}`);
      }
      if (lines.length === 0) return;

      const lastLine = lines[lines.length - 1];
      // RFC 5321: final reply line format is 3-digit code followed by space
      if (!/^\d{3}\s/.test(lastLine)) {
        return; // Multiline buffer pending
      }

      const code = parseInt(lastLine.substring(0, 3), 10);
      lastCode = code;

      try {
        if (currentStep === 0) {
          // 220 Service Ready
          if (code === 220) {
            currentStep++;
            transcript.push('-> EHLO leadpure.ai');
            socket.write('EHLO leadpure.ai\r\n');
          } else {
            finish();
          }
        } else if (currentStep === 1) {
          // EHLO / HELO Response
          if (code === 250) {
            currentStep++;
            transcript.push(`-> MAIL FROM:<${fromEmail}>`);
            socket.write(`MAIL FROM:<${fromEmail}>\r\n`);
          } else {
            transcript.push('-> HELO leadpure.ai');
            socket.write('HELO leadpure.ai\r\n');
            currentStep++;
          }
        } else if (currentStep === 2) {
          // MAIL FROM Response
          if (code === 250) {
            currentStep++;
            transcript.push(`-> RCPT TO:<${email}>`);
            socket.write(`RCPT TO:<${email}>\r\n`);
          } else {
            finish();
          }
        } else if (currentStep === 3) {
          // RCPT TO Response (Crucial deliverability verdict)
          currentStep++;
          transcript.push('-> QUIT');
          socket.write('QUIT\r\n');
        } else if (currentStep >= 4 || code === 221) {
          finish();
        }
      } catch (err: any) {
        finish(err.message);
      }
    });

    const cleanHost = mxRecord.replace(/\.$/, '');
    socket.connect(25, cleanHost);
  });
}

// ----------------- EXTERNAL SMTP BACKEND SERVICE INTEGRATION -----------------

/**
 * Checks if an external SMTP verification backend or self-hosted Reacher instance is configured.
 * Compatible with reacherhq/check-if-email-exists JSON API specification.
 */
export async function queryExternalSmtpBackend(email: string): Promise<SmtpCheckResult | null> {
  const backendUrl = process.env.SMTP_BACKEND_URL || process.env.REACHER_API_URL || process.env.VITE_SMTP_BACKEND_URL;
  if (!backendUrl) return null;

  try {
    const url = backendUrl.replace(/\/+$/, '') + '/v0/check_email';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = process.env.SMTP_BACKEND_API_KEY || process.env.REACHER_API_KEY;
    if (apiKey) {
      headers['Authorization'] = apiKey;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to_email: email }),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[LeadPure] SMTP backend error ${res.status}: ${res.statusText}`);
      return null;
    }

    const data: any = await res.json();
    const reachable = String(data.is_reachable || '').toLowerCase(); // 'safe' | 'risky' | 'invalid' | 'unknown'
    const smtp = data.smtp || {};

    const isCatchAll = smtp.is_catch_all === true || (reachable === 'risky' && !smtp.has_full_inbox && !smtp.is_disabled);
    const isDeliverable = smtp.is_deliverable === true || reachable === 'safe';
    const canConnect = smtp.can_connect_smtp !== false;
    const hasFullInbox = smtp.has_full_inbox === true;
    const isDisabled = smtp.is_disabled === true;
    const isGreylisted = reachable === 'unknown' && canConnect;
    const isBlocked = reachable === 'unknown' && (!canConnect || smtp.is_blocked);
    const code = reachable === 'invalid' ? 550 : (reachable === 'safe' ? 250 : (smtp.code || null));

    return {
      canConnect,
      isDeliverable,
      isCatchAll,
      hasFullInbox,
      isDisabled,
      isGreylisted,
      isBlocked,
      code,
      response: smtp.response || `SMTP Backend Verdict: ${reachable.toUpperCase()}`,
      verifMethod: 'backend',
      transcript: data.transcript || []
    };
  } catch (err: any) {
    console.warn(`[LeadPure] Failed to reach external SMTP backend at ${backendUrl}: ${err.message}`);
    return null;
  }
}

/**
 * Executes full LeadPure neural deliverability and catch-all checks
 */
export async function verifySmtpDeliverability(
  email: string,
  domain: string,
  mxHost: string,
  provider: string,
  options?: { checkCatchAll?: boolean }
): Promise<SmtpCheckResult> {
  const atIdx = email.indexOf('@');
  const username = atIdx > -1 ? email.substring(0, atIdx) : email;

  // 1. Check if external SMTP backend service is configured (VPS or self-hosted Reacher instance)
  const backendResult = await queryExternalSmtpBackend(email);
  if (backendResult) {
    return backendResult;
  }

  // 2. Direct Yahoo HTTPS Probe (Works 100% over HTTPS even on Vercel)
  if (provider === 'yahoo') {
    const yahooRes = await checkYahooViaApi(username);
    if (yahooRes.success) {
      return {
        canConnect: true,
        isDeliverable: yahooRes.isDeliverable,
        isCatchAll: false,
        hasFullInbox: false,
        isDisabled: false,
        isGreylisted: false,
        code: yahooRes.isDeliverable ? 250 : 550,
        response: yahooRes.reason,
        verifMethod: 'yahoo_api'
      };
    }
  }

  // 3. Microsoft 365 Tenant Check
  if (provider === 'microsoft' && !shouldSkipCatchAll(domain, mxHost)) {
    const msExists = await checkMicrosoft365Tenant(email, domain);
    if (msExists === true) {
      return {
        canConnect: true,
        isDeliverable: true,
        isCatchAll: false,
        hasFullInbox: false,
        isDisabled: false,
        isGreylisted: false,
        code: 250,
        response: 'Microsoft 365 active tenant account confirmed',
        verifMethod: 'microsoft365_api'
      };
    }
  }

  // 4. Direct Outbound SMTP Handshake (Port 25)
  const smtpProbe = await executeSmtpSocketHandshake(email, mxHost);

  // If Port 25 connected successfully, parse RFC 5321 codes and exact phrases
  if (smtpProbe.connected && smtpProbe.code !== null) {
    const code = smtpProbe.code;
    const resp = smtpProbe.response;

    // A. Check Provider Anti-probing Block (e.g. Microsoft Hotmail/Outlook S3150 / 550 5.7.1)
    if (isProviderBlocked(resp, code)) {
      return {
        canConnect: true,
        isDeliverable: false,
        isCatchAll: false,
        hasFullInbox: false,
        isDisabled: false,
        isGreylisted: false,
        isBlocked: true,
        code,
        response: resp,
        verifMethod: 'smtp',
        transcript: smtpProbe.transcript
      };
    }

    // B. Catch-All Detection
    // For non-consumer domains, probe a random 16-char nonexistent local part to test if domain accepts everything
    let isCatchAll = false;
    if (!shouldSkipCatchAll(domain, mxHost)) {
      const randIdentity = `leadpure_probe_${crypto.randomBytes(8).toString('hex')}`;
      const controlEmail = `${randIdentity}@${domain}`;
      const controlProbe = await executeSmtpSocketHandshake(controlEmail, mxHost);
      if (controlProbe.connected && (controlProbe.isPositive || controlProbe.code === 250 || controlProbe.code === 251)) {
        isCatchAll = true;
      }
    }

    if (isServiceClosing(code)) {
      return {
        canConnect: true,
        isDeliverable: false,
        isCatchAll,
        hasFullInbox: false,
        isDisabled: false,
        isGreylisted: false,
        code,
        response: resp,
        verifMethod: 'smtp',
        transcript: smtpProbe.transcript
      };
    }

    if (isGreylisted(resp)) {
      return {
        canConnect: true,
        isDeliverable: false,
        isCatchAll,
        hasFullInbox: false,
        isDisabled: false,
        isGreylisted: true,
        code,
        response: resp,
        verifMethod: 'smtp',
        transcript: smtpProbe.transcript
      };
    }

    if (isDisabledAccount(resp)) {
      return {
        canConnect: true,
        isDeliverable: false,
        isCatchAll,
        hasFullInbox: false,
        isDisabled: true,
        isGreylisted: false,
        code,
        response: resp,
        verifMethod: 'smtp',
        transcript: smtpProbe.transcript
      };
    }

    if (isFullInbox(resp)) {
      return {
        canConnect: true,
        isDeliverable: false,
        isCatchAll,
        hasFullInbox: true,
        isDisabled: false,
        isGreylisted: false,
        code,
        response: resp,
        verifMethod: 'smtp',
        transcript: smtpProbe.transcript
      };
    }

    if (isInvalidRecipient(resp, email) || code === 550 || code === 551 || code === 552 || code === 554) {
      return {
        canConnect: true,
        isDeliverable: false,
        isCatchAll,
        hasFullInbox: false,
        isDisabled: false,
        isGreylisted: false,
        code,
        response: resp,
        verifMethod: 'smtp',
        transcript: smtpProbe.transcript
      };
    }

    if (smtpProbe.isPositive || code === 250 || code === 251) {
      return {
        canConnect: true,
        isDeliverable: true,
        isCatchAll,
        hasFullInbox: false,
        isDisabled: false,
        isGreylisted: false,
        code,
        response: resp,
        verifMethod: 'smtp',
        transcript: smtpProbe.transcript
      };
    }
  }

  // 5. Host Network Restricts Port 25 / Firewalled / Serverless Environment
  // When running on platforms like Vercel or local hosts where outbound TCP 25 is blocked:
  // HONEST REPORTING: Never return fake deliverability! Return honest UNKNOWN.
  return {
    canConnect: false,
    isDeliverable: false,
    isCatchAll: false,
    hasFullInbox: false,
    isDisabled: false,
    isGreylisted: false,
    isBlocked: false,
    code: null,
    response: `SMTP probe unreachable: Target mail server (${mxHost}) did not respond on Port 25. Outbound TCP port 25 is restricted on this host network. Connect an external SMTP backend via SMTP_BACKEND_URL for full mailbox verification.`,
    verifMethod: 'smtp_unreachable',
    transcript: smtpProbe.transcript
  };
}
