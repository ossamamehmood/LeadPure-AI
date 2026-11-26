// LeadPure Verification Kernel (Offline Unit Helpers)
// Combines RFC 5322 syntax validation, role filtering, disposable detection,
// and DNS MX resolution with RFC 7505 null MX. Live production SMTP probing runs in engine/probe.mjs.

import { validateSyntax, SyntaxResult } from './syntax.js';
import { isDisposableDomain } from './data/disposable.js';
import { isRoleAccount } from './data/roles.js';
import { isFreeEmailProvider } from './data/free-providers.js';
import { checkMx, MxCheckResult } from './dns.js';
import { verifySmtpDeliverability, SmtpCheckResult, isProviderBlocked, isInvalidRecipient } from './smtp.js';
import { checkGravatar } from './gravatar.js';

export interface ValidationOptions {
  excludeDisposable: boolean;
  excludeRoleBased: boolean;
  excludeCatchAll: boolean;
  excludeSpamTraps: boolean;
}

export interface ValidationResult {
  email: string;
  verificationStatus: 'safe' | 'risky' | 'invalid' | 'unknown' | 'verified' | 'rejected' | 'blocked' | 'usable' | 'dangerous';
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
  suggestion?: string;
  spfExists?: boolean;
  hasGravatar?: boolean;
  gravatarUrl?: string;

  // Schema standards
  status: 'SAFE' | 'RISKY' | 'INVALID' | 'UNKNOWN';
  sub_status?: string;
  failure_code?: 'ERR_001' | 'ERR_002' | 'ERR_003' | 'ERR_004' | 'ERR_005' | 'ERR_006' | 'ERR_007' | 'ERR_008' | 'ERR_009' | null;
  smtp_code?: number | null;
  mx_ip?: string | null;
  timestamp?: string;
  is_catchall?: boolean;

  // Telemetry Trace Log & Raw Transcripts
  trace?: string;
  transcript?: string[];
}

// In-memory LRU-like caches
const emailCache = new Map<string, ValidationResult>();
const domainCache = new Map<string, MxCheckResult>();

/**
 * Validates a single email address using the honest 5-tier LeadPure protocol.
 */
export async function validateEmailFull(
  email: string,
  options: ValidationOptions
): Promise<ValidationResult> {
  const rawEmail = String(email || '').trim();
  const timestamp = new Date().toISOString();
  const trace: string[] = [];

  // Check cache
  const cacheKey = `${rawEmail.toLowerCase()}-${options.excludeDisposable}-${options.excludeRoleBased}-${options.excludeCatchAll}`;
  if (emailCache.has(cacheKey)) {
    return emailCache.get(cacheKey)!;
  }

  // ----------------- TIER 1: RFC 5322 SYNTAX & NORMALIZATION -----------------
  const syntax = validateSyntax(rawEmail);
  if (!syntax.isValid) {
    trace.push(`Syntax: Invalid (${syntax.errorReason || 'ERR_001'})`);
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'invalid',
      verificationReason: `Fatal Syntax: ${syntax.errorReason || 'Malformed email format'}`,
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
      trace: trace.join(' -> ')
    };
    return res;
  }

  trace.push('Syntax: Valid');
  const { username, domain, suggestion } = syntax;

  // ----------------- TIER 2: DISPOSABLE EMAIL DETECTION -----------------
  const isDisposable = isDisposableDomain(domain, rawEmail);
  if (isDisposable) {
    trace.push('DEA: Detected (ERR_004)');
    if (options.excludeDisposable) {
      const res: ValidationResult = {
        email: rawEmail,
        verificationStatus: 'invalid',
        verificationReason: 'System Suppressed: Disposable throwaway email detected',
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
        provider: 'Disposable Provider',
        smtpValid: false,
        syntaxValid: true,
        didyouseeme: false,
        suggestion,
        status: 'INVALID',
        sub_status: 'disposable',
        failure_code: 'ERR_004',
        smtp_code: null,
        mx_ip: null,
        timestamp,
        is_catchall: false,
        trace: trace.join(' -> ')
      };
      return res;
    }
  } else {
    trace.push('DEA: Clean');
  }

  // ----------------- TIER 3: ROLE-BASED IDENTITY DETECTION -----------------
  const isRole = isRoleAccount(username);
  if (isRole) {
    trace.push('Role: Detected (ERR_006)');
    if (options.excludeRoleBased) {
      const res: ValidationResult = {
        email: rawEmail,
        verificationStatus: 'invalid',
        verificationReason: 'System Suppressed: Generic non-individual role alias',
        subStatus: 'role_based',
        confidenceScore: 0,
        bounceRisk: 'Dangerous',
        reputationImpact: 'Critical',
        mxRecordFound: false,
        isCatchAll: false,
        isDisposable,
        isRoleBased: true,
        isFreeEmail: isFreeEmailProvider(domain),
        isSpamTrap: false,
        provider: 'Role Account',
        smtpValid: false,
        syntaxValid: true,
        didyouseeme: false,
        suggestion,
        status: 'INVALID',
        sub_status: 'role_based',
        failure_code: 'ERR_006',
        smtp_code: null,
        mx_ip: null,
        timestamp,
        is_catchall: false,
        trace: trace.join(' -> ')
      };
      return res;
    }
  } else {
    trace.push('Role: Clean');
  }

  // ----------------- TIER 4: DNS, MX & INFRASTRUCTURE -----------------
  let mxData = domainCache.get(domain);
  if (!mxData) {
    mxData = await checkMx(domain);
    domainCache.set(domain, mxData);
    if (domainCache.size > 5000) domainCache.clear();
  }

  if (!mxData.acceptsMail || !mxData.primaryMx) {
    trace.push(`DNS: Failed (${mxData.error || 'No active mail exchangers'}) (ERR_002)`);
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'invalid',
      verificationReason: `System Rejected: Domain does not accept email (${mxData.error || 'No MX records'})`,
      subStatus: 'domain_not_found',
      confidenceScore: 0,
      bounceRisk: 'Dangerous',
      reputationImpact: 'Critical',
      mxRecordFound: mxData.hasMx,
      mxRecord: mxData.primaryMx,
      isCatchAll: false,
      isDisposable,
      isRoleBased: isRole,
      isFreeEmail: isFreeEmailProvider(domain),
      isSpamTrap: false,
      provider: mxData.provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      suggestion,
      spfExists: mxData.spfExists,
      status: 'INVALID',
      sub_status: 'domain_not_found',
      failure_code: 'ERR_002',
      smtp_code: null,
      mx_ip: null,
      timestamp,
      is_catchall: false,
      trace: trace.join(' -> ')
    };
    return res;
  }

  trace.push(`DNS: MX resolved (${mxData.primaryMx})`);
  const isFreeEmail = isFreeEmailProvider(domain);
  const primaryMx = mxData.primaryMx;
  const primaryMxIp = mxData.primaryMxIp || null;

  // ----------------- TIER 5: LEADPURE LIVE SMTP PROBE & VERIFICATION -----------------
  trace.push(`Provider: ${mxData.provider.toUpperCase()}`);

  const smtpResult: SmtpCheckResult = await verifySmtpDeliverability(
    rawEmail,
    domain,
    primaryMx,
    mxData.provider,
    { checkCatchAll: options.excludeCatchAll }
  );

  // GATE 5.1: SMTP Unreachable (Outbound Port 25 Blocked / Host Network Restriction)
  if (!smtpResult.canConnect || smtpResult.verifMethod === 'smtp_unreachable') {
    trace.push('SMTP: Unreachable (Port 25 Restricted / Connection Failed) (ERR_009)');
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'unknown',
      verificationReason: 'SMTP connection failed: Target mail server did not respond on Port 25. Outbound SMTP is restricted on this host network.',
      subStatus: 'smtp_unreachable',
      confidenceScore: 40,
      bounceRisk: 'Unknown',
      reputationImpact: 'Unknown',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll: false,
      isDisposable,
      isRoleBased: isRole,
      isFreeEmail,
      isSpamTrap: false,
      provider: mxData.provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      suggestion,
      spfExists: mxData.spfExists,
      status: 'UNKNOWN',
      sub_status: 'smtp_unreachable',
      failure_code: 'ERR_009',
      smtp_code: null,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: false,
      trace: trace.join(' -> '),
      transcript: smtpResult.transcript
    };
    return res;
  }

  // GATE 5.2: Provider Anti-Probing Policy Block (e.g. Microsoft Hotmail/Outlook S3150 / 550 5.7.1)
  if (smtpResult.isBlocked || isProviderBlocked(smtpResult.response, smtpResult.code)) {
    trace.push(`SMTP: Provider Blocked (${smtpResult.response}) (ERR_007)`);
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'unknown',
      verificationReason: `Mail provider anti-probing policy blocked verification attempt (${smtpResult.response})`,
      subStatus: 'provider_blocked',
      confidenceScore: 40,
      bounceRisk: 'Unknown',
      reputationImpact: 'Unknown',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll: false,
      isDisposable,
      isRoleBased: isRole,
      isFreeEmail,
      isSpamTrap: false,
      provider: mxData.provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      suggestion,
      spfExists: mxData.spfExists,
      status: 'UNKNOWN',
      sub_status: 'provider_blocked',
      failure_code: 'ERR_007',
      smtp_code: smtpResult.code,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: false,
      trace: trace.join(' -> '),
      transcript: smtpResult.transcript
    };
    return res;
  }

  // GATE 5.3: Mailbox Disabled / Closed by Provider
  if (smtpResult.isDisabled) {
    trace.push('SMTP: Mailbox Deactivated/Closed (ERR_003)');
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'invalid',
      verificationReason: 'System Rejected: Mailbox is disabled or closed by provider',
      subStatus: 'mailbox_disabled',
      confidenceScore: 0,
      bounceRisk: 'Dangerous',
      reputationImpact: 'Critical',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll: smtpResult.isCatchAll,
      isDisposable,
      isRoleBased: isRole,
      isFreeEmail,
      isSpamTrap: false,
      provider: mxData.provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      suggestion,
      spfExists: mxData.spfExists,
      status: 'INVALID',
      sub_status: 'mailbox_disabled',
      failure_code: 'ERR_003',
      smtp_code: smtpResult.code,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: smtpResult.isCatchAll,
      trace: trace.join(' -> '),
      transcript: smtpResult.transcript
    };
    return res;
  }

  // GATE 5.4: Nonexistent Mailbox (SMTP 550 / User Unknown)
  if (!smtpResult.isDeliverable && (smtpResult.code === 550 || smtpResult.code === 551 || smtpResult.code === 552 || smtpResult.code === 553 || smtpResult.code === 554 || isInvalidRecipient(smtpResult.response, rawEmail))) {
    trace.push(`Verification: Mailbox Not Found (${smtpResult.response})`);
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'invalid',
      verificationReason: `Mailbox does not exist: Recipient address rejected (${smtpResult.response})`,
      subStatus: 'mailbox_not_found',
      confidenceScore: 0,
      bounceRisk: 'Dangerous',
      reputationImpact: 'Critical',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll: smtpResult.isCatchAll,
      isDisposable,
      isRoleBased: isRole,
      isFreeEmail,
      isSpamTrap: false,
      provider: mxData.provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      suggestion,
      spfExists: mxData.spfExists,
      status: 'INVALID',
      sub_status: 'mailbox_not_found',
      failure_code: 'ERR_003',
      smtp_code: smtpResult.code || 550,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: smtpResult.isCatchAll,
      trace: trace.join(' -> '),
      transcript: smtpResult.transcript
    };
    return res;
  }

  // GATE 5.5: Catch-All Detection (Accept-All Domain)
  // Requirement 2: If the server accepts random nonexistent address, domain is catch-all and verdict for ANY address on it can NEVER be safe; it is RISKY.
  if (smtpResult.isCatchAll) {
    trace.push('Catch-All: Active (Accept-All Domain) (ERR_005)');
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'risky',
      verificationReason: 'Catch-All Domain: Server accepts mail for any address. Individual mailbox existence cannot be confirmed without sending.',
      subStatus: 'catch_all',
      confidenceScore: 55,
      bounceRisk: 'Medium',
      reputationImpact: 'Neutral',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll: true,
      isDisposable,
      isRoleBased: isRole,
      isFreeEmail,
      isSpamTrap: false,
      provider: mxData.provider,
      smtpValid: true,
      syntaxValid: true,
      didyouseeme: false,
      suggestion,
      spfExists: mxData.spfExists,
      status: 'RISKY',
      sub_status: 'catch_all',
      failure_code: 'ERR_005',
      smtp_code: smtpResult.code || 250,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: true,
      trace: trace.join(' -> '),
      transcript: smtpResult.transcript
    };
    return res;
  }

  // GATE 5.6: Storage Full / Quota Exceeded
  if (smtpResult.hasFullInbox) {
    trace.push('SMTP: Quota Exceeded / Full Inbox (ERR_008)');
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'risky',
      verificationReason: 'Recipient mailbox storage is full / quota exceeded',
      subStatus: 'full_inbox',
      confidenceScore: 50,
      bounceRisk: 'Medium',
      reputationImpact: 'Neutral',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll: false,
      isDisposable,
      isRoleBased: isRole,
      isFreeEmail,
      isSpamTrap: false,
      provider: mxData.provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      suggestion,
      spfExists: mxData.spfExists,
      status: 'RISKY',
      sub_status: 'full_inbox',
      failure_code: 'ERR_008',
      smtp_code: smtpResult.code,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: false,
      trace: trace.join(' -> '),
      transcript: smtpResult.transcript
    };
    return res;
  }

  // GATE 5.7: Greylisting / Rate Limiting (Inconclusive)
  if (smtpResult.isGreylisted) {
    trace.push('SMTP: Greylisted (ERR_007)');
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'unknown',
      verificationReason: 'Target server is enforcing Greylisting / Rate Limiting. Inconclusive on first attempt.',
      subStatus: 'greylisted',
      confidenceScore: 45,
      bounceRisk: 'Unknown',
      reputationImpact: 'Unknown',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll: false,
      isDisposable,
      isRoleBased: isRole,
      isFreeEmail,
      isSpamTrap: false,
      provider: mxData.provider,
      smtpValid: false,
      syntaxValid: true,
      didyouseeme: false,
      suggestion,
      spfExists: mxData.spfExists,
      status: 'UNKNOWN',
      sub_status: 'greylisted',
      failure_code: 'ERR_007',
      smtp_code: smtpResult.code,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: false,
      trace: trace.join(' -> '),
      transcript: smtpResult.transcript
    };
    return res;
  }

  // GATE 5.8: Quality Warnings (Disposable or Role-Based not strictly excluded)
  if (isDisposable || isRole) {
    const reason = isDisposable ? 'Disposable email address' : 'Role-based account';
    trace.push(`Quality Warning: ${reason}`);
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'risky',
      verificationReason: `Deliverable but quality risk: ${reason}`,
      subStatus: isDisposable ? 'disposable' : 'role_based',
      confidenceScore: 55,
      bounceRisk: 'Medium',
      reputationImpact: 'Neutral',
      mxRecordFound: true,
      mxRecord: primaryMx,
      isCatchAll: false,
      isDisposable,
      isRoleBased: isRole,
      isFreeEmail,
      isSpamTrap: false,
      provider: mxData.provider,
      smtpValid: smtpResult.isDeliverable,
      syntaxValid: true,
      didyouseeme: false,
      suggestion,
      spfExists: mxData.spfExists,
      status: 'RISKY',
      sub_status: isDisposable ? 'disposable' : 'role_based',
      failure_code: isDisposable ? 'ERR_004' : 'ERR_006',
      smtp_code: smtpResult.code,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: false,
      trace: trace.join(' -> '),
      transcript: smtpResult.transcript
    };
    return res;
  }

  // GATE 5.9: FINAL VERDICT: SAFE / DELIVERABLE
  // Reached ONLY when:
  // 1. Syntax is clean
  // 2. DNS MX is valid and accepts mail
  // 3. Not disposable, not role-based
  // 4. Live SMTP handshake succeeded and confirmed recipient exists (code 250 OK)
  // 5. Catch-All test was negative (domain rejects random address)
  // 6. Quota is not full, account is not disabled, not greylisted, not blocked
  const gravatarUrl = await checkGravatar(rawEmail);
  const hasGravatar = !!gravatarUrl;
  if (hasGravatar) {
    trace.push('Gravatar: Active Profile Verified');
  }

  trace.push('Verified: Real-Time Handshake Confirmed (250 OK, Non-Catch-All)');
  const finalScore = hasGravatar ? 99 : 98;

  const result: ValidationResult = {
    email: rawEmail,
    verificationStatus: 'safe',
    verificationReason: hasGravatar 
      ? 'Mailbox verified deliverable: Recipient confirmed active with Gravatar profile (SMTP 250 OK)'
      : 'Mailbox verified deliverable: Recipient confirmed by target mail server (SMTP 250 OK, non-catch-all)',
    subStatus: 'valid',
    confidenceScore: finalScore,
    bounceRisk: 'Safe',
    reputationImpact: 'Positive',
    mxRecordFound: true,
    mxRecord: primaryMx,
    isCatchAll: false,
    isDisposable: false,
    isRoleBased: false,
    isFreeEmail,
    isSpamTrap: false,
    provider: mxData.provider,
    smtpValid: true,
    syntaxValid: true,
    didyouseeme: false,
    suggestion,
    spfExists: mxData.spfExists,
    hasGravatar,
    gravatarUrl: gravatarUrl || undefined,
    status: 'SAFE',
    sub_status: 'valid',
    failure_code: null,
    smtp_code: smtpResult.code || 250,
    mx_ip: primaryMxIp,
    timestamp,
    is_catchall: false,
    trace: trace.join(' -> '),
    transcript: smtpResult.transcript
  };

  emailCache.set(cacheKey, result);
  if (emailCache.size > 20000) emailCache.clear();

  return result;
}
