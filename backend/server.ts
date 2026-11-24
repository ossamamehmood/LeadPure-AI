import express from 'express';
import net from 'net';
import dns from 'dns';
import crypto from 'crypto';

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const AUTH_TOKEN = process.env.SMTP_BACKEND_API_KEY || process.env.AUTH_TOKEN;

app.use(express.json());

const resolver = new dns.promises.Resolver();
try {
  resolver.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

interface SmtpProbeResult {
  connected: boolean;
  code: number | null;
  response: string;
  isPositive: boolean;
  transcript: string[];
}

function executeSocketStep(
  email: string,
  mxHost: string,
  fromEmail = 'verify@leadpure.ai',
  timeoutMs = 8000
): Promise<SmtpProbeResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    let step = 0;
    let lastCode: number | null = null;
    let fullResponse = '';
    const transcript: string[] = [];

    const timer = setTimeout(() => {
      finish('Connection Timeout (Port 25)', true);
    }, timeoutMs);

    const finish = (reason = '', isTimeout = false) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      socket.removeAllListeners();
      socket.destroy();
      resolve({
        connected: step > 0,
        code: lastCode,
        response: fullResponse.trim() || reason,
        isPositive: lastCode === 250 || lastCode === 251,
        transcript
      });
    };

    socket.setTimeout(timeoutMs);
    socket.on('timeout', () => finish('TCP Socket Timeout', true));
    socket.on('error', (err) => {
      fullResponse += ` [Error: ${err.message}]`;
      transcript.push(`<- [Error: ${err.message}]`);
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
      if (!/^\d{3}\s/.test(lastLine)) {
        return; // Waiting for complete multi-line reply
      }

      const code = parseInt(lastLine.substring(0, 3), 10);
      lastCode = code;

      try {
        if (step === 0) {
          if (code === 220) {
            step++;
            transcript.push('-> EHLO leadpure.ai');
            socket.write('EHLO leadpure.ai\r\n');
          } else {
            finish();
          }
        } else if (step === 1) {
          if (code === 250) {
            step++;
            transcript.push(`-> MAIL FROM:<${fromEmail}>`);
            socket.write(`MAIL FROM:<${fromEmail}>\r\n`);
          } else {
            transcript.push('-> HELO leadpure.ai');
            socket.write('HELO leadpure.ai\r\n');
            step++;
          }
        } else if (step === 2) {
          if (code === 250) {
            step++;
            transcript.push(`-> RCPT TO:<${email}>`);
            socket.write(`RCPT TO:<${email}>\r\n`);
          } else {
            finish();
          }
        } else if (step === 3) {
          step++;
          transcript.push('-> QUIT');
          socket.write('QUIT\r\n');
        } else if (step >= 4 || code === 221) {
          finish();
        }
      } catch (err: any) {
        finish(err.message);
      }
    });

    socket.connect(25, mxHost.replace(/\.$/, ''));
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'leadpure-smtp-verifier',
    version: '13.0.0',
    port25Capable: true,
    timestamp: new Date().toISOString()
  });
});

// Reacher-compatible endpoint: POST /v0/check_email
app.post('/v0/check_email', async (req, res) => {
  // Optional auth token check
  if (AUTH_TOKEN) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== AUTH_TOKEN && authHeader !== `Bearer ${AUTH_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing API token' });
    }
  }

  const { to_email } = req.body || {};
  if (!to_email || typeof to_email !== 'string' || !to_email.includes('@')) {
    return res.status(400).json({ error: 'Invalid request: to_email is required' });
  }

  const email = to_email.trim().toLowerCase();
  const [username, domain] = email.split('@');

  // 1. Resolve MX
  let mxRecords: dns.MxRecord[] = [];
  try {
    mxRecords = await resolver.resolveMx(domain);
  } catch (err: any) {
    // Check A record fallback RFC 5321
    try {
      const aRecords = await resolver.resolve4(domain);
      if (aRecords && aRecords.length > 0) {
        mxRecords = [{ exchange: domain, priority: 0 }];
      }
    } catch {}
  }

  if (!mxRecords || mxRecords.length === 0) {
    return res.json({
      input: email,
      is_reachable: 'invalid',
      misc: { is_disposable: false, is_role_account: false },
      mx: { accepts_mail: false, records: [] },
      smtp: {
        can_connect_smtp: false,
        has_full_inbox: false,
        is_catch_all: false,
        is_deliverable: false,
        is_disabled: false,
        code: null,
        response: 'Domain has no active MX or A records'
      },
      syntax: { domain, is_valid_syntax: true, username },
      transcript: []
    });
  }

  // Sort MX by priority
  mxRecords.sort((a, b) => a.priority - b.priority);
  const primaryMx = mxRecords[0].exchange;
  const mxHostnames = mxRecords.map(r => r.exchange);

  // 2. Catch-All Probe: test random 16-character address
  const randomProbeLocal = `leadpure_catchall_${crypto.randomBytes(8).toString('hex')}`;
  const randomProbeEmail = `${randomProbeLocal}@${domain}`;
  const catchAllProbe = await executeSocketStep(randomProbeEmail, primaryMx);
  const isCatchAll = catchAllProbe.connected && (catchAllProbe.isPositive || catchAllProbe.code === 250 || catchAllProbe.code === 251);

  // 3. Target Recipient Probe
  const targetProbe = await executeSocketStep(email, primaryMx);

  const combinedTranscript = [
    `--- CATCH-ALL PROBE (${randomProbeEmail}) ---`,
    ...catchAllProbe.transcript,
    `--- TARGET RECIPIENT PROBE (${email}) ---`,
    ...targetProbe.transcript
  ];

  // If could not connect to port 25
  if (!targetProbe.connected || targetProbe.code === null) {
    return res.json({
      input: email,
      is_reachable: 'unknown',
      misc: { is_disposable: false, is_role_account: false },
      mx: { accepts_mail: true, records: mxHostnames },
      smtp: {
        can_connect_smtp: false,
        has_full_inbox: false,
        is_catch_all: false,
        is_deliverable: false,
        is_disabled: false,
        code: null,
        response: targetProbe.response || 'Connection to port 25 timed out'
      },
      syntax: { domain, is_valid_syntax: true, username },
      transcript: combinedTranscript
    });
  }

  const code = targetProbe.code;
  const resp = targetProbe.response.toLowerCase();

  // Check Provider Anti-probing block (e.g. Microsoft Hotmail/Outlook S3150 / 550 5.7.1)
  const isBlocked = code === 421 || resp.includes('5.7.1') || resp.includes('blocked') || resp.includes('spamhaus') || resp.includes('barracuda') || resp.includes('unfortunate');
  if (isBlocked) {
    return res.json({
      input: email,
      is_reachable: 'unknown',
      misc: { is_disposable: false, is_role_account: false },
      mx: { accepts_mail: true, records: mxHostnames },
      smtp: {
        can_connect_smtp: true,
        has_full_inbox: false,
        is_catch_all: false,
        is_deliverable: false,
        is_disabled: false,
        code,
        response: targetProbe.response
      },
      syntax: { domain, is_valid_syntax: true, username },
      transcript: combinedTranscript
    });
  }

  // Check Catch-All (Verdict is RISKY, never SAFE)
  if (isCatchAll) {
    return res.json({
      input: email,
      is_reachable: 'risky',
      misc: { is_disposable: false, is_role_account: false },
      mx: { accepts_mail: true, records: mxHostnames },
      smtp: {
        can_connect_smtp: true,
        has_full_inbox: false,
        is_catch_all: true,
        is_deliverable: targetProbe.isPositive,
        is_disabled: false,
        code,
        response: 'Domain accepts mail for all recipients (Catch-All enabled)'
      },
      syntax: { domain, is_valid_syntax: true, username },
      transcript: combinedTranscript
    });
  }

  // Check Mailbox Nonexistent (550)
  if (code === 550 || code === 551 || code === 552 || code === 553 || code === 554 || resp.includes('does not exist') || resp.includes('user unknown') || resp.includes('mailbox not found') || resp.includes('nosuchuser')) {
    return res.json({
      input: email,
      is_reachable: 'invalid',
      misc: { is_disposable: false, is_role_account: false },
      mx: { accepts_mail: true, records: mxHostnames },
      smtp: {
        can_connect_smtp: true,
        has_full_inbox: false,
        is_catch_all: false,
        is_deliverable: false,
        is_disabled: false,
        code,
        response: targetProbe.response
      },
      syntax: { domain, is_valid_syntax: true, username },
      transcript: combinedTranscript
    });
  }

  // Check Deliverable (250 OK)
  if (targetProbe.isPositive || code === 250 || code === 251) {
    return res.json({
      input: email,
      is_reachable: 'safe',
      misc: { is_disposable: false, is_role_account: false },
      mx: { accepts_mail: true, records: mxHostnames },
      smtp: {
        can_connect_smtp: true,
        has_full_inbox: false,
        is_catch_all: false,
        is_deliverable: true,
        is_disabled: false,
        code,
        response: targetProbe.response
      },
      syntax: { domain, is_valid_syntax: true, username },
      transcript: combinedTranscript
    });
  }

  // Fallback unknown
  return res.json({
    input: email,
    is_reachable: 'unknown',
    misc: { is_disposable: false, is_role_account: false },
    mx: { accepts_mail: true, records: mxHostnames },
    smtp: {
      can_connect_smtp: true,
      has_full_inbox: false,
      is_catch_all: false,
      is_deliverable: false,
      is_disabled: false,
      code,
      response: targetProbe.response
    },
    syntax: { domain, is_valid_syntax: true, username },
    transcript: combinedTranscript
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[LeadPure SMTP Backend] Running on http://0.0.0.0:${PORT}`);
  console.log(`[LeadPure SMTP Backend] Reacher JSON API available at POST /v0/check_email`);
});
