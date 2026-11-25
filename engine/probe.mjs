// LeadPure own verification engine — probe.mjs v1.3
// Reacher's system, rebuilt as LeadPure's own code. Zero dependencies (Node 20 stdlib only).
// Pipeline per address: syntax -> MX -> SMTP RCPT probe across ALL MX candidates ->
// catch-all probe (random local part) -> safe / risky / invalid / unknown.
// v1.3 changes: adds a 4-worker parallel pool in main() for 100-email chunks while preserving
// all v1.2 verdict logic (2-pass retry, 30s greylist wait, forwarding-provider handling).
// Usage: node engine/probe.mjs <emails.txt> <result.json>
// Output: JSON array, one Reacher-shaped object per input email.

import { promises as dns } from 'node:dns';
import net from 'node:net';
import fs from 'node:fs';

const FROM_EMAIL = 'verify@leadpure.ai';
const HELO_HOST = 'leadpure.ai';
const CONNECT_TIMEOUT_MS = 20000;
const SESSION_TIMEOUT_MS = 45000;
const GREYLIST_WAIT_MS = 30000;
const PASS_WAIT_MS = 20000;

const ROLE_LOCALPARTS = new Set(('info contact hello admin support sales office bookings booking enquiries inquiries mail team help service services no-reply noreply postmaster webmaster marketing reception frontdesk appointments appointment officeadmin').split(' '));
const DISPOSABLE_DOMAINS = new Set(('mailinator.com guerrillamail.com 10minutemail.com tempmail.com temp-mail.org throwawaymail.com yopmail.com getnada.com trashmail.com fakeinbox.com maildrop.cc dispostable.com mohmal.com sharklasers.com guerrillamailblock.com pokemail.net spam4.me bccto.cc mailnesia.com mailinator.net emailondeck.com tempail.com minuteinbox.com').split(' '));
const FREEMAIL_DOMAINS = new Set(('gmail.com googlemail.com outlook.com hotmail.com live.com msn.com yahoo.com yahoo.co.uk aol.com icloud.com me.com mac.com proton.me protonmail.com gmx.com mail.com zoho.com fastmail.com').split(' '));
const FORWARDING_MX_PATTERNS = [/improvmx/i, /forwardemail/i, /mx\.cloudflare\.net/i, /email-routing/i];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function checkSyntax(email) {
  if (typeof email !== 'string' || email.length > 254) return false;
  const re = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
  return re.test(email);
}

function parseAddress(email) {
  const at = email.lastIndexOf('@');
  return { local: email.slice(0, at), domain: email.slice(at + 1).toLowerCase() };
}

function randomLocal() {
  return 'lpchk' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// One SMTP conversation against one IP. Resolves {connected, code} where code is the
// numeric RCPT TO response (250/251 accept, 5xx reject, 4xx greylist/temp), or null.
function smtpProbe(ip, mxHost, targetEmail) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let stage = 'banner';
    let buf = '';
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; try { socket.destroy(); } catch {} resolve(v); } };
    socket.setTimeout(CONNECT_TIMEOUT_MS, () => done({ connected: stage !== 'banner', code: null, error: 'connect_or_session_timeout' }));
    socket.once('error', (e) => done({ connected: false, code: null, error: String(e.code || e.message || e) }));
    socket.connect(25, ip, () => {
      socket.setTimeout(SESSION_TIMEOUT_MS);
    });
    socket.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!/^\d{3}[ -]/.test(line)) continue;
        if (line[3] === '-') continue; // multiline reply, wait for final line
        const code = parseInt(line.slice(0, 3), 10);
        try {
          if (stage === 'banner') {
            if (code !== 220) return done({ connected: true, code: null, error: 'banner_' + code });
            stage = 'helo'; socket.write(`HELO ${HELO_HOST}\r\n`);
          } else if (stage === 'helo') {
            stage = 'mailfrom'; socket.write(`MAIL FROM:<${FROM_EMAIL}>\r\n`);
          } else if (stage === 'mailfrom') {
            if (code >= 500) return done({ connected: true, code: null, error: 'mailfrom_' + code });
            stage = 'rcpt'; socket.write(`RCPT TO:<${targetEmail}>\r\n`);
          } else if (stage === 'rcpt') {
            try { socket.write('QUIT\r\n'); } catch {}
            return done({ connected: true, code, error: null });
          }
        } catch (e) { return done({ connected: true, code: null, error: String(e) }); }
      }
    });
  });
}

// Try candidates in order until one returns a definitive RCPT code (2xx or 5xx).
// A 4xx triggers ONE greylist retry across all candidates after GREYLIST_WAIT_MS.
async function probeAcrossCandidates(candidates, targetEmail) {
  let sawConnect = false;
  let lastError = null;
  for (const c of candidates) {
    const r = await smtpProbe(c.ip, c.host, targetEmail);
    if (r.connected) sawConnect = true;
    if (r.error) lastError = r.error;
    if (r.code !== null && (r.code < 400 || r.code >= 500)) return { ...r, sawConnect };
    if (r.code !== null && r.code >= 400 && r.code < 500) {
      await sleep(GREYLIST_WAIT_MS);
      for (const c2 of candidates) {
        const r2 = await smtpProbe(c2.ip, c2.host, targetEmail);
        if (r2.connected) sawConnect = true;
        if (r2.error) lastError = r2.error;
        if (r2.code !== null) return { ...r2, sawConnect };
      }
      return { connected: sawConnect, code: r.code, error: lastError, sawConnect };
    }
  }
  return { connected: sawConnect, code: null, error: lastError, sawConnect };
}

async function probeOnce(email) {
  const { local, domain } = parseAddress(email);
  const lowerLocal = local.toLowerCase();
  const probeTarget = `${lowerLocal}@${domain}`;
  const out = {
    input: email,
    is_reachable: 'unknown',
    misc: { is_disposable: DISPOSABLE_DOMAINS.has(domain), is_role_account: ROLE_LOCALPARTS.has(lowerLocal) },
    mx: { accepts_mail: false, records: [] },
    smtp: {
      can_connect_smtp: false, has_full_inbox: false, is_catch_all: false,
      is_deliverable: false, is_disabled: false,
    },
    syntax: { address: email, domain, is_valid_syntax: checkSyntax(email), username: local },
    debug: { backend_name: 'leadpure-own-engine', engine_version: '1.3.0' },
  };
  if (!out.syntax.is_valid_syntax) { out.is_reachable = 'invalid'; return out; }
  if (out.misc.is_disposable) { out.is_reachable = 'invalid'; out.debug.disposable_domain = true; return out; }

  let mxRecords = [];
  try {
    mxRecords = await dns.resolveMx(domain);
    mxRecords.sort((a, b) => a.priority - b.priority);
  } catch { mxRecords = []; }
  if (!mxRecords.length) {
    try { const a = await dns.resolve4(domain); if (a.length) mxRecords = [{ exchange: domain, priority: 0 }]; } catch {}
  }
  out.mx.records = mxRecords.map((m) => m.exchange);
  out.mx.accepts_mail = mxRecords.length > 0;
  if (!mxRecords.length) { out.is_reachable = 'invalid'; out.debug.no_mx = true; return out; }

  const isForwarding = mxRecords.some((m) => FORWARDING_MX_PATTERNS.some((p) => p.test(m.exchange)));
  if (isForwarding) out.debug.forwarding_provider = true;

  // Build candidate list: up to 4 MX hosts x up to 2 IPv4 each (max 6).
  const candidates = [];
  for (const mx of mxRecords.slice(0, 4)) {
    try {
      const ips = await dns.resolve4(mx.exchange);
      for (const ip of ips.slice(0, 2)) candidates.push({ host: mx.exchange, ip });
    } catch {}
    if (candidates.length >= 6) break;
  }
  if (!candidates.length) { out.debug.no_mx_ips = true; return out; }

  const rcpt = await probeAcrossCandidates(candidates, probeTarget);
  out.smtp.can_connect_smtp = !!rcpt.sawConnect;
  if (rcpt.code === null) { out.debug.connect_error = rcpt.error || 'no_rcpt_code'; return out; }
  if (rcpt.code >= 400 && rcpt.code < 500) { out.debug.greylisted_or_temp = rcpt.code; return out; }
  if (rcpt.code >= 500) {
    if (isForwarding) {
      // The forwarder rejected at RCPT, but it answers for the domain, not the real
      // mailbox — this cannot prove the mailbox does not exist. Stay honest: unknown.
      out.debug.forwarding_rcpt_rejected = rcpt.code;
      return out; // remains unknown
    }
    out.is_reachable = 'invalid';
    out.debug.rcpt_code = rcpt.code;
    return out;
  }
  // RCPT accepted (2xx).
  out.smtp.is_deliverable = true;
  if (isForwarding) {
    // Forwarder accepted the alias, but the final mailbox behind it is unverifiable.
    out.is_reachable = 'risky';
    out.debug.forwarding_alias_accepted = true;
    return out;
  }
  const ca = await probeAcrossCandidates(candidates, `${randomLocal()}@${domain}`);
  if (ca.code !== null && ca.code >= 200 && ca.code < 300) {
    out.smtp.is_catch_all = true;
    out.is_reachable = 'risky';
    return out;
  }
  if (out.misc.is_role_account) { out.is_reachable = 'risky'; return out; }
  if (FREEMAIL_DOMAINS.has(domain)) out.debug.freemail = true;
  out.is_reachable = 'safe';
  return out;
}

async function probeEmail(emailRaw) {
  const email = String(emailRaw || '').trim();
  let out = await probeOnce(email);
  // Second full pass only when the first ended unknown purely from connection trouble.
  if (out.is_reachable === 'unknown' && !out.smtp.can_connect_smtp) {
    await sleep(PASS_WAIT_MS);
    const retry = await probeOnce(email);
    if (retry.is_reachable !== 'unknown' || retry.smtp.can_connect_smtp) out = retry;
  }
  return out;
}

async function main() {
  const [, , inFile, outFile] = process.argv;
  if (!inFile || !outFile) { console.error('usage: probe.mjs <emails.txt> <result.json>'); process.exit(2); }
  const emails = fs.readFileSync(inFile, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const results = new Array(emails.length);
  const WORKER_COUNT = Math.min(4, Math.max(1, emails.length));
  let cursor = 0;

  const worker = async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= emails.length) break;
      const e = emails[idx];
      try {
        results[idx] = await probeEmail(e);
      } catch (err) {
        results[idx] = { input: e, is_reachable: 'unknown', debug: { backend_name: 'leadpure-own-engine', engine_version: '1.3.0', error: String(err && err.message || err) } };
      }
    }
  };

  await Promise.all(Array.from({ length: WORKER_COUNT }, () => worker()));
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`probed ${results.length} emails (${WORKER_COUNT} workers)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
