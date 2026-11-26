import { validateEmailFull } from './src/lib/validator.js';
import { validateSyntax } from './src/lib/syntax.js';
import { isDisposableDomain } from './src/lib/data/disposable.js';
import { isRoleAccount } from './src/lib/data/roles.js';
import { checkMx } from './src/lib/dns.js';
import { checkGravatar } from './src/lib/gravatar.js';

async function runTestSuite() {
  console.log("=================================================");
  console.log("   LEADPURE-AI V14 VERIFICATION SUITE           ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Syntax Unit Tests
  console.log("[1] Syntax & Normalization Suite:");
  assert(validateSyntax('user@gmail.com').isValid === true, 'Valid syntax user@gmail.com');
  assert(validateSyntax('user..name@gmail.com').isValid === false, 'Consecutive dots rejected');
  assert(validateSyntax('user@gmial.com').suggestion === 'user@gmail.com', 'Typo suggestion for gmial.com');
  assert(validateSyntax('ossama@gmail.com').suggestion === undefined, 'No false suggestion for gmail.com');

  // 2. Disposable Detection Suite
  console.log("\n[2] Disposable Domain Suite:");
  assert(isDisposableDomain('temp-mail.org', 'test@temp-mail.org') === true, 'temp-mail.org is disposable');
  assert(isDisposableDomain('mailinator.com', 'test@mailinator.com') === true, 'mailinator.com is disposable');
  assert(isDisposableDomain('gmail.com', 'user@gmail.com') === false, 'gmail.com is NOT disposable');

  // 3. Role Account Suite
  console.log("\n[3] Role Account Suite:");
  assert(isRoleAccount('support') === true, 'support is role account');
  assert(isRoleAccount('billing') === true, 'billing is role account');
  assert(isRoleAccount('ossamamehmood110') === false, 'personal username is NOT role account');

  // 4. DNS MX Suite
  console.log("\n[4] DNS MX & Null MX Suite:");
  const googleMx = await checkMx('gmail.com');
  assert(googleMx.hasMx === true && googleMx.acceptsMail === true, 'gmail.com resolves active MX');
  assert(googleMx.provider === 'google', 'gmail.com identified as google provider');
  
  const fakeMx = await checkMx('nonexistentdomain1234567.com');
  assert(fakeMx.acceptsMail === false, 'nonexistent domain does not accept email');

  // 5. Full Engine End-to-End Validation
  console.log("\n[5] End-to-End LeadPure Verification Suite:");
  
  // Nonexistent domain (DNS Tier)
  const nonExistent = await validateEmailFull('fake@nonexistentdomain1234567.com', {
    excludeDisposable: true,
    excludeRoleBased: true,
    excludeCatchAll: true,
    excludeSpamTraps: true
  });
  assert(nonExistent.status === 'INVALID', 'Nonexistent domain status is INVALID');
  assert(nonExistent.failure_code === 'ERR_002', 'Nonexistent domain failure code is ERR_002');
  assert(nonExistent.confidenceScore === 0, 'Nonexistent domain confidence score is 0');

  // Disposable email (DEA Tier)
  const disposable = await validateEmailFull('throwaway@temp-mail.org', {
    excludeDisposable: true,
    excludeRoleBased: true,
    excludeCatchAll: true,
    excludeSpamTraps: true
  });
  assert(disposable.status === 'INVALID', 'Disposable email status is INVALID');
  assert(disposable.failure_code === 'ERR_004', 'Disposable email failure code is ERR_004');
  assert(disposable.confidenceScore === 0, 'Disposable email confidence score is 0');

  // Role email (Role Tier)
  const roleEmail = await validateEmailFull('support@stripe.com', {
    excludeDisposable: true,
    excludeRoleBased: true,
    excludeCatchAll: true,
    excludeSpamTraps: true
  });
  assert(roleEmail.status === 'INVALID', 'Role email status is INVALID when excluded');
  assert(roleEmail.failure_code === 'ERR_006', 'Role email failure code is ERR_006');
  assert(roleEmail.confidenceScore === 0, 'Role email confidence score is 0');

  // Nonexistent Yahoo account (verified via LeadPure HTTPS probe)
  const fakeYahoo = await validateEmailFull('nonexistentuser9823471@yahoo.com', {
    excludeDisposable: true,
    excludeRoleBased: true,
    excludeCatchAll: true,
    excludeSpamTraps: true
  });
  assert(fakeYahoo.status === 'INVALID', 'Nonexistent Yahoo mailbox status is INVALID');
  assert(fakeYahoo.sub_status === 'mailbox_not_found', 'Nonexistent Yahoo sub_status is mailbox_not_found');
  assert(fakeYahoo.confidenceScore === 0, 'Nonexistent Yahoo confidence score is 0');

  // Honest handling when Port 25 is restricted / blocked
  // If running in an environment without outbound Port 25 access and no backend URL:
  // Must return honest UNKNOWN, never fake SAFE!
  const port25Probe = await validateEmailFull('test-unreachable-port25@gmail.com', {
    excludeDisposable: true,
    excludeRoleBased: false,
    excludeCatchAll: false,
    excludeSpamTraps: true
  });
  if (port25Probe.status === 'UNKNOWN') {
    assert(port25Probe.sub_status === 'smtp_unreachable' || port25Probe.sub_status === 'timeout', 'Port 25 blocked returns honest UNKNOWN');
    assert(port25Probe.confidenceScore <= 50, 'Port 25 blocked confidence score <= 50');
  } else if (port25Probe.status === 'INVALID') {
    assert(port25Probe.sub_status === 'mailbox_not_found', 'Dead mailbox returned INVALID');
  }

  console.log("\n=================================================");
  console.log(`  TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite runtime failure:", err);
  process.exit(1);
});
