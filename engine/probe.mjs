// LeadPure Own Engine — SMTP mailbox probe (no dependencies, Node 20+)
// Copied system design from Reacher (MIT): syntax -> MX -> SMTP RCPT probe -> catch-all probe.
// Usage: node probe.mjs emails.txt results.json
// Output: JSON array in the Reacher result shape, so api/check.ts mapping works unchanged.

import dns from 'dns/promises';
import net from 'net';
import fs from 'fs';

const FROM_EMAIL = 'verify@leadpure.ai';
const HELLO_NAME = 'leadpure.ai';
const CONNECT_TIMEOUT_MS = 8000;
const SESSION_TIMEOUT_MS = 15000;

const ROLE_LOCALPARTS = new Set([
  'info','contact','hello','support','admin','sales','office','help','team',
  'mail','enquiries','inquiries','reception','booking','bookings','noreply','no-reply'
]);

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.info','sharklasers.com',
  'tempmail.com','temp-mail.org','10minutemail.com','yopmail.com','throwawaymail.com',
  'getnada.com','maildrop.cc','dispostable.com','fakeinbox.com','trashmail.com',
  'mailnesia.com','mintemail.com','mytemp.email','tempinbox.com','emailondeck.com',
  'mohmal.com','burnermail.io',' guerrillamail.biz'.trim(),'spamgourmet.com','mailcatch.com'
]);

const FREEMAIL_DOMAINS = new Set([
  'gmail.com','googlemail.com','outlook.com','hotmail.com','live.com','msn.com',
  'yahoo.com','ymail.com','aol.com','icloud.com','me.com','mac.com','proton.me','protonmail.com','gmx.com'
]);

function checkSyntax(email) {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  const parts = email.split('@');
  const valid = parts.length === 2 && re.test(email) && !parts[0].startsWith('.') && !parts[0].endsWith('.') && !email.includes('..');
  return {
    address: email,
    domain: parts[1] || '',
    is_valid_syntax: valid,
    username: parts[0] || '',
    normalized_email: email,
    suggestion: null
  };
}

// One SMTP session: connect, banner, EHLO, MAIL FROM, RCPT TO. Returns the RCPT reply code.
function smtpRcptProbe(mxHost, targetEmail) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: mxHost, port: 25, family: 4 });
    socket.setTimeout(SESSION_TIMEOUT_MS);
    let buffer = '';
    let stage = 'banner';
    let done = false;

    const finish = (out) => {
      if (done) return;
      done = true;
      try { socket.write('QUIT\r\n'); } catch {}
      socket.destroy();
      resolve(out);
    };

    socket.on('timeout', () => finish({ connected: stage !== 'banner', code: null, error: 'timeout' }));
    socket.on('error', (err) => finish({ connected: false, code: null, error: String(err.code || err.message || err) }));
    socket.on('connect', () => { /* wait for banner */ });

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      // SMTP replies can be multiline: wait for a line ending with \r\n whose 4th char is a space.
      const lines = buffer.split('\r\n');
      const lastComplete = [...lines].reverse().find(l => /^\d{3} /.test(l));
      if (!lastComplete) return;
      const code = parseInt(lastComplete.slice(0, 3), 10);
      buffer = '';

      if (stage === 'banner') {
        if (code !== 220) return finish({ connected: true, code, error: 'bad_banner' });
        stage = 'ehlo';
        socket.write(`EHLO ${HELLO_NAME}\r\n`);
      } else if (stage === 'ehlo') {
        if (code >= 500) { // EHLO refused, retry with HELO
          stage = 'helo';
          socket.write(`HELO ${HELLO_NAME}\r\n`);
          return;
        }
        stage = 'mailfrom';
        socket.write(`MAIL FROM:<${FROM_EMAIL}>\r\n`);
      } else if (stage === 'helo') {
        stage = 'mailfrom';
        socket.write(`MAIL FROM:<${FROM_EMAIL}>\r\n`);
      } else if (stage === 'mailfrom') {
        if (code >= 500) return finish({ connected: true, code, error: 'mail_from_rejected' });
        stage = 'rcpt';
        socket.write(`RCPT TO:<${targetEmail}>\r\n`);
      } else if (stage === 'rcpt') {
        return finish({ connected: true, code, error: null });
      }
    });

    // If the server never sends a banner, the connect timeout fires via socket timeout.
    setTimeout(() => finish({ connected: false, code: null, error: 'banner_timeout' }), CONNECT_TIMEOUT_MS).unref?.();
  });
}

async function probeEmail(emailRaw) {
  const email = String(emailRaw || '').trim();
  const syntax = checkSyntax(email);
  const domain = syntax.domain.toLowerCase();
  const local = syntax.username.toLowerCase();

  const result = {
    input: email,
    is_reachable: 'unknown',
    misc: {
      is_disposable: DISPOSABLE_DOMAINS.has(domain),
      is_role_account: ROLE_LOCALPARTS.has(local),
      is_b2c: FREEMAIL_DOMAINS.has(domain),
      gravatar_url: null,
      haveibeenpwned: null
    },
    mx: { accepts_mail: false, records: [] },
    smtp: {
      can_connect_smtp: false,
      has_full_inbox: false,
      is_catch_all: false,
      is_deliverable: false,
      is_disabled: false
    },
    syntax,
    debug: { backend_name: 'leadpure-own-engine', engine_version: '1.0.0' }
  };

  if (!syntax.is_valid_syntax) {
    result.is_reachable = 'invalid';
    return result;
  }
  if (result.misc.is_disposable) {
    result.is_reachable = 'risky';
    return result;
  }

  // MX lookup
  let mxRecords = [];
  try {
    mxRecords = await dns.resolveMx(domain);
    mxRecords.sort((a, b) => a.priority - b.priority);
    result.mx.records = mxRecords.map(r => (r.exchange.endsWith('.') ? r.exchange : r.exchange + '.'));
    result.mx.accepts_mail = mxRecords.length > 0;
  } catch {
    result.mx.accepts_mail = false;
  }
  if (!mxRecords.length) {
    result.is_reachable = 'invalid'; // domain accepts no mail at all
    return result;
  }

  let probe = null;
  let activeMxHost = '';
  // Try up to 3 MX hosts if the first one cannot connect
  for (const record of mxRecords.slice(0, 3)) {
    const host = record.exchange.replace(/\.$/, '');
    activeMxHost = host;
    probe = await smtpRcptProbe(host, email);
    if (probe.code && probe.code >= 400 && probe.code < 500) {
      await new Promise(r => setTimeout(r, 4000));
      probe = await smtpRcptProbe(host, email);
    }
    if (probe.connected && probe.code != null) {
      break;
    }
  }

  result.smtp.can_connect_smtp = !!(probe && probe.connected);
  result.debug.mx_host = activeMxHost;
  result.debug.probe_code = probe ? probe.code : null;
  result.debug.probe_error = probe ? probe.error : 'no_probe';
  console.log(`[PROBE] ${email} -> ${activeMxHost}: connected=${probe?.connected}, code=${probe?.code}, error=${probe?.error}`);

  if (!probe || !probe.connected || probe.code == null) {
    result.is_reachable = 'unknown'; // server unreachable / timed out: honest unknown, never guessed
    return result;
  }

  if (probe.code >= 500) {
    // 550/551/553: mailbox does not exist or is disabled at this server
    result.is_reachable = 'invalid';
    result.smtp.is_deliverable = false;
    if (probe.code === 550 || probe.code === 553) result.smtp.is_disabled = false;
    return result;
  }

  if (probe.code >= 400) {
    result.is_reachable = 'unknown'; // still greylisted / temporary after retry
    return result;
  }

  // 2xx: server accepted the recipient. Now the catch-all probe with a random local part.
  result.smtp.is_deliverable = true;
  const randomLocal = 'lp' + Math.random().toString(36).slice(2, 12) + 'x';
  const caProbe = await smtpRcptProbe(activeMxHost, `${randomLocal}@${domain}`);
  if (caProbe.code && caProbe.code >= 200 && caProbe.code < 300) {
    result.smtp.is_catch_all = true;
  }

  if (result.smtp.is_catch_all) {
    result.is_reachable = 'risky';
  } else if (result.misc.is_role_account) {
    result.is_reachable = 'risky';
  } else {
    result.is_reachable = 'safe';
  }
  return result;
}

const [, , inFile, outFile] = process.argv;
if (!inFile || !outFile) {
  console.error('Usage: node probe.mjs <emails.txt> <results.json>');
  process.exit(2);
}
const emails = fs.readFileSync(inFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const out = [];
for (const e of emails) {
  try {
    out.push(await probeEmail(e));
  } catch (err) {
    const syntax = checkSyntax(e);
    out.push({
      input: e, is_reachable: 'unknown',
      misc: { is_disposable: false, is_role_account: false, is_b2c: false, gravatar_url: null, haveibeenpwned: null },
      mx: { accepts_mail: false, records: [] },
      smtp: { can_connect_smtp: false, has_full_inbox: false, is_catch_all: false, is_deliverable: false, is_disabled: false },
      syntax, debug: { backend_name: 'leadpure-own-engine', engine_version: '1.0.0', error: String(err && err.message || err) }
    });
  }
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
console.log(`probed ${out.length} email(s)`);
