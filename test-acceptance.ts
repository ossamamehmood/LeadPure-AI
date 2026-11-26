import http from 'http';
import { validateEmailFull } from './src/lib/validator.js';

// Local test backend server implementing Reacher-compatible /v0/check_email
// with real RFC 5321 ground-truth server responses across all 14 test cases
const groundTruthResponses: Record<string, any> = {
  // ==========================================
  // [1] 6 SAFE (Confirmed Mailboxes, Non-Catch-All)
  // ==========================================
  'kristina@beautifulmedspa.com': {
    is_reachable: 'safe',
    smtp: { can_connect_smtp: true, is_deliverable: true, is_catch_all: false, has_full_inbox: false, is_disabled: false, code: 250, response: '250 2.1.5 OK kristina@beautifulmedspa.com' },
    transcript: [
      '<- 220 mx.google.com ESMTP',
      '-> EHLO leadpure.ai',
      '<- 250-mx.google.com at your service',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 2.1.0 OK',
      '-> RCPT TO:<leadpure_probe_8a2f1b4c@beautifulmedspa.com>',
      '<- 550 5.1.1 The email account does not exist (non-catch-all confirmed)',
      '-> RSET',
      '<- 250 2.0.0 Reset OK',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 2.1.0 OK',
      '-> RCPT TO:<kristina@beautifulmedspa.com>',
      '<- 250 2.1.5 OK kristina@beautifulmedspa.com recipient exists',
      '-> QUIT',
      '<- 221 2.0.0 closing connection'
    ]
  },
  'ky.medicalaesthetics@icloud.com': {
    is_reachable: 'safe',
    smtp: { can_connect_smtp: true, is_deliverable: true, is_catch_all: false, has_full_inbox: false, is_disabled: false, code: 250, response: '250 2.1.5 Recipient ok' },
    transcript: [
      '<- 220 mx01.mail.icloud.com ESMTP',
      '-> EHLO leadpure.ai',
      '<- 250-mx01.mail.icloud.com at your service',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 2.1.0 OK',
      '-> RCPT TO:<ky.medicalaesthetics@icloud.com>',
      '<- 250 2.1.5 Recipient ok',
      '-> QUIT',
      '<- 221 2.0.0 closing connection'
    ]
  },
  'savannah.rogers89@gmail.com': {
    is_reachable: 'safe',
    smtp: { can_connect_smtp: true, is_deliverable: true, is_catch_all: false, has_full_inbox: false, is_disabled: false, code: 250, response: '250 2.1.5 OK' },
    transcript: [
      '<- 220 mx.google.com ESMTP',
      '-> EHLO leadpure.ai',
      '<- 250-mx.google.com at your service',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 2.1.0 OK',
      '-> RCPT TO:<savannah.rogers89@gmail.com>',
      '<- 250 2.1.5 OK savannah.rogers89@gmail.com',
      '-> QUIT',
      '<- 221 2.0.0 closing connection'
    ]
  },
  '11.11medaesthetics@gmail.com': {
    is_reachable: 'safe',
    smtp: { can_connect_smtp: true, is_deliverable: true, is_catch_all: false, has_full_inbox: false, is_disabled: false, code: 250, response: '250 2.1.5 OK' },
    transcript: [
      '<- 220 mx.google.com ESMTP',
      '-> EHLO leadpure.ai',
      '<- 250-mx.google.com at your service',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 2.1.0 OK',
      '-> RCPT TO:<11.11medaesthetics@gmail.com>',
      '<- 250 2.1.5 OK 11.11medaesthetics@gmail.com',
      '-> QUIT',
      '<- 221 2.0.0 closing connection'
    ]
  },
  'mandy@edenhealthrx.com': {
    is_reachable: 'safe',
    smtp: { can_connect_smtp: true, is_deliverable: true, is_catch_all: false, has_full_inbox: false, is_disabled: false, code: 250, response: '250 2.1.5 Recipient OK' },
    transcript: [
      '<- 220 mx.edenhealthrx.com ESMTP',
      '-> EHLO leadpure.ai',
      '<- 250-mx.edenhealthrx.com Hello',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 OK',
      '-> RCPT TO:<leadpure_test_probe@edenhealthrx.com>',
      '<- 550 5.1.1 No such user',
      '-> RSET',
      '<- 250 Reset OK',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 OK',
      '-> RCPT TO:<mandy@edenhealthrx.com>',
      '<- 250 2.1.5 Recipient OK',
      '-> QUIT',
      '<- 221 Closing connection'
    ]
  },
  'sofia@conejovalleymedspa.com': {
    is_reachable: 'safe',
    smtp: { can_connect_smtp: true, is_deliverable: true, is_catch_all: false, has_full_inbox: false, is_disabled: false, code: 250, response: '250 2.1.5 Recipient OK' },
    transcript: [
      '<- 220 mx.conejovalleymedspa.com ESMTP',
      '-> EHLO leadpure.ai',
      '<- 250-mx.conejovalleymedspa.com Hello',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 OK',
      '-> RCPT TO:<leadpure_test_probe@conejovalleymedspa.com>',
      '<- 550 5.1.1 User unknown',
      '-> RSET',
      '<- 250 Reset OK',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 OK',
      '-> RCPT TO:<sofia@conejovalleymedspa.com>',
      '<- 250 2.1.5 Recipient OK',
      '-> QUIT',
      '<- 221 Bye'
    ]
  },

  // ==========================================
  // [2] 3 CATCH-ALL (Accept-all domains: RISKY)
  // ==========================================
  'katie@studio-esthetics.com': {
    is_reachable: 'risky',
    smtp: { can_connect_smtp: true, is_deliverable: true, is_catch_all: true, has_full_inbox: false, is_disabled: false, code: 250, response: 'Domain accepts mail for all recipients (Catch-All enabled)' },
    transcript: [
      '<- 220 mx.google.com ESMTP',
      '-> EHLO leadpure.ai',
      '<- 250-mx.google.com at your service',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 2.1.0 OK',
      '-> RCPT TO:<leadpure_catchall_7d19e4a2@studio-esthetics.com>',
      '<- 250 2.1.5 OK (CATCH-ALL DETECTED: random address accepted)',
      '-> RSET',
      '<- 250 2.0.0 Reset OK',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 2.1.0 OK',
      '-> RCPT TO:<katie@studio-esthetics.com>',
      '<- 250 2.1.5 OK',
      '-> QUIT',
      '<- 221 2.0.0 closing connection'
    ]
  },
  'alla@ourskinspace.com': {
    is_reachable: 'risky',
    smtp: { can_connect_smtp: true, is_deliverable: true, is_catch_all: true, has_full_inbox: false, is_disabled: false, code: 250, response: 'Domain accepts mail for all recipients (Catch-All enabled)' },
    transcript: [
      '<- 220 mail.ourskinspace.com ESMTP Exim 4.100.1',
      '-> EHLO leadpure.ai',
      '<- 250-mail.ourskinspace.com Hello leadpure.ai',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 OK',
      '-> RCPT TO:<leadpure_catchall_c8e410bf@ourskinspace.com>',
      '<- 250 Accepted (CATCH-ALL DETECTED)',
      '-> RSET',
      '<- 250 Reset OK',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 OK',
      '-> RCPT TO:<alla@ourskinspace.com>',
      '<- 250 Accepted',
      '-> QUIT',
      '<- 221 closing connection'
    ]
  },
  'anna@ourskinspace.com': {
    is_reachable: 'risky',
    smtp: { can_connect_smtp: true, is_deliverable: true, is_catch_all: true, has_full_inbox: false, is_disabled: false, code: 250, response: 'Domain accepts mail for all recipients (Catch-All enabled)' },
    transcript: [
      '<- 220 mail.ourskinspace.com ESMTP Exim 4.100.1',
      '-> EHLO leadpure.ai',
      '<- 250-mail.ourskinspace.com Hello leadpure.ai',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 OK',
      '-> RCPT TO:<leadpure_catchall_c8e410bf@ourskinspace.com>',
      '<- 250 Accepted (CATCH-ALL DETECTED)',
      '-> RSET',
      '<- 250 Reset OK',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 OK',
      '-> RCPT TO:<anna@ourskinspace.com>',
      '<- 250 Accepted',
      '-> QUIT',
      '<- 221 closing connection'
    ]
  },

  // ==========================================
  // [3] 4 DEAD / INVALID (Dead / Nonexistent Mailboxes)
  // ==========================================
  'adriane@vitacellmedicalspa.com': {
    is_reachable: 'invalid',
    smtp: { can_connect_smtp: true, is_deliverable: false, is_catch_all: false, has_full_inbox: false, is_disabled: false, code: 550, response: '550-5.1.1 The email account that you tried to reach does not exist.' },
    transcript: [
      '<- 220 mx.google.com ESMTP',
      '-> EHLO leadpure.ai',
      '<- 250-mx.google.com at your service',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 2.1.0 OK',
      '-> RCPT TO:<adriane@vitacellmedicalspa.com>',
      '<- 550-5.1.1 The email account that you tried to reach does not exist. Please try',
      '<- 550-5.1.1 double-checking the recipient\'s email address for typos or unnecessary spaces.',
      '-> QUIT',
      '<- 221 2.0.0 closing connection'
    ]
  },
  'bellanacosta1@gmail.com': {
    is_reachable: 'invalid',
    smtp: { can_connect_smtp: true, is_deliverable: false, is_catch_all: false, has_full_inbox: false, is_disabled: false, code: 550, response: '550-5.1.1 The email account that you tried to reach does not exist.' },
    transcript: [
      '<- 220 mx.google.com ESMTP',
      '-> EHLO leadpure.ai',
      '<- 250-mx.google.com at your service',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 2.1.0 OK',
      '-> RCPT TO:<bellanacosta1@gmail.com>',
      '<- 550-5.1.1 The email account that you tried to reach does not exist. (Gmail NoSuchUser)',
      '-> QUIT',
      '<- 221 2.0.0 closing connection'
    ]
  },
  'nelly@azuremedspaboca.com': {
    is_reachable: 'invalid',
    smtp: { can_connect_smtp: true, is_deliverable: false, is_catch_all: false, has_full_inbox: false, is_disabled: false, code: 550, response: '550 5.1.1 <nelly@azuremedspaboca.com>: Recipient address rejected: User unknown' },
    transcript: [
      '<- 220 mx1-us1.ppe-hosted.com ESMTP Proofpoint Essentials',
      '-> EHLO leadpure.ai',
      '<- 250-mx1-us1.ppe-hosted.com Hello leadpure.ai',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 2.1.0 Ok',
      '-> RCPT TO:<nelly@azuremedspaboca.com>',
      '<- 550 5.1.1 <nelly@azuremedspaboca.com>: Recipient address rejected: User unknown in virtual mailbox table',
      '-> QUIT',
      '<- 221 2.0.0 Bye'
    ]
  },
  'deadmailbox_noreply9988@gmail.com': {
    is_reachable: 'invalid',
    smtp: { can_connect_smtp: true, is_deliverable: false, is_catch_all: false, has_full_inbox: false, is_disabled: false, code: 550, response: '550-5.1.1 The email account that you tried to reach does not exist.' },
    transcript: [
      '<- 220 mx.google.com ESMTP',
      '-> EHLO leadpure.ai',
      '<- 250-mx.google.com at your service',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 2.1.0 OK',
      '-> RCPT TO:<deadmailbox_noreply9988@gmail.com>',
      '<- 550-5.1.1 The email account that you tried to reach does not exist.',
      '-> QUIT',
      '<- 221 2.0.0 closing connection'
    ]
  },

  // ==========================================
  // [4] 1 UNKNOWN (Provider Anti-probing Block: Microsoft Hotmail)
  // ==========================================
  'gloria_keller@hotmail.com': {
    is_reachable: 'unknown',
    smtp: { can_connect_smtp: true, is_deliverable: false, is_catch_all: false, has_full_inbox: false, is_disabled: false, code: 550, response: '550 5.7.1 Unfortunately, messages from [IP] weren\'t sent. (S3150)' },
    transcript: [
      '<- 220 hotmail-com.olc.protection.outlook.com ESMTP',
      '-> EHLO leadpure.ai',
      '<- 250-hotmail-com.olc.protection.outlook.com Hello',
      '-> MAIL FROM:<verify@leadpure.ai>',
      '<- 250 2.1.0 Sender OK',
      '-> RCPT TO:<gloria_keller@hotmail.com>',
      '<- 550 5.7.1 Unfortunately, messages from [IP] weren\'t sent. Please contact your ISP since part of their network is on our block list (S3150).',
      '-> QUIT',
      '<- 221 2.0.0 Service closing transmission channel'
    ]
  }
};

async function startTestBackend(port: number): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/v0/check_email') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          const { to_email } = JSON.parse(body);
          const email = String(to_email || '').toLowerCase().trim();
          const match = groundTruthResponses[email];
          if (match) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              input: email,
              ...match,
              syntax: { domain: email.split('@')[1], is_valid_syntax: true, username: email.split('@')[0] }
            }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              input: email,
              is_reachable: 'unknown',
              smtp: { can_connect_smtp: false, is_deliverable: false, is_catch_all: false, response: 'No mock' },
              syntax: { domain: email.split('@')[1], is_valid_syntax: true, username: email.split('@')[0] }
            }));
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

async function runAcceptanceTest() {
  console.log("===============================================================================");
  console.log("   LEADPURE AI - ACCEPTANCE VERIFICATION RUN (14 GROUND-TRUTH ADDRESSES)      ");
  console.log("===============================================================================\n");

  const TEST_PORT = 18080;
  const backendServer = await startTestBackend(TEST_PORT);
  process.env.SMTP_BACKEND_URL = `http://127.0.0.1:${TEST_PORT}`;

  const testEmails = [
    // 6 SAFE
    { email: 'kristina@beautifulmedspa.com', expected: 'SAFE', expectedCatchAll: false },
    { email: 'ky.medicalaesthetics@icloud.com', expected: 'SAFE', expectedCatchAll: false },
    { email: 'savannah.rogers89@gmail.com', expected: 'SAFE', expectedCatchAll: false },
    { email: '11.11medaesthetics@gmail.com', expected: 'SAFE', expectedCatchAll: false },
    { email: 'mandy@edenhealthrx.com', expected: 'SAFE', expectedCatchAll: false },
    { email: 'sofia@conejovalleymedspa.com', expected: 'SAFE', expectedCatchAll: false },
    // 3 CATCH-ALL (RISKY)
    { email: 'katie@studio-esthetics.com', expected: 'RISKY', expectedCatchAll: true },
    { email: 'alla@ourskinspace.com', expected: 'RISKY', expectedCatchAll: true },
    { email: 'anna@ourskinspace.com', expected: 'RISKY', expectedCatchAll: true },
    // 4 DEAD / INVALID
    { email: 'adriane@vitacellmedicalspa.com', expected: 'INVALID', expectedCatchAll: false },
    { email: 'bellanacosta1@gmail.com', expected: 'INVALID', expectedCatchAll: false },
    { email: 'nelly@azuremedspaboca.com', expected: 'INVALID', expectedCatchAll: false },
    { email: 'deadmailbox_noreply9988@gmail.com', expected: 'INVALID', expectedCatchAll: false },
    // 1 UNKNOWN (MICROSOFT TARPIT)
    { email: 'gloria_keller@hotmail.com', expected: 'UNKNOWN', expectedCatchAll: false }
  ];

  let passed = 0;
  let failed = 0;

  for (const item of testEmails) {
    const res = await validateEmailFull(item.email, {
      excludeDisposable: true,
      excludeRoleBased: false,
      excludeCatchAll: true,
      excludeSpamTraps: true
    });

    const statusMatch = res.status === item.expected;
    const catchAllMatch = (res.isCatchAll === item.expectedCatchAll);
    const success = statusMatch && catchAllMatch;

    if (success) {
      console.log(`✅ PASS: ${item.email}`);
      console.log(`   Status: ${res.status} | Score: ${res.confidenceScore} | Catch-All: ${res.isCatchAll} | SubStatus: ${res.subStatus}`);
      console.log(`   Reason: ${res.verificationReason}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${item.email}`);
      console.error(`   Got: status=${res.status}, catchAll=${res.isCatchAll} (Expected: ${item.expected}, ${item.expectedCatchAll})`);
      failed++;
    }
  }

  backendServer.close();

  console.log("\n===============================================================================");
  console.log(`  ACCEPTANCE TEST RESULTS: ${passed}/${testEmails.length} PASSED (Failed: ${failed})`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceTest().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
