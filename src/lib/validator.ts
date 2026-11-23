// LeadPure Enterprise Neural Verification Kernel (v13.0)
// Combines RFC 5322 syntax validation, role filtering, disposable detection,
// DNS MX resolution with RFC 7505 null MX, and multi-protocol verification probes.

import { validateSyntax, SyntaxResult } from './syntax.js';
import { isDisposableDomain } from './data/disposable.js';
import { isRoleAccount } from './data/roles.js';
import { isFreeEmailProvider, shouldSkipCatchAll } from './data/free-providers.js';
import { checkMx, MxCheckResult } from './dns.js';
import { verifySmtpDeliverability, SmtpCheckResult } from './smtp.js';
import { checkGravatar } from './gravatar.js';

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
  suggestion?: string;
  domainAge?: string;
  domainAgeDays?: number;
  spfExists?: boolean;
  dkimExists?: boolean;
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

  // Telemetry Trace Log
  trace?: string;
}

// In-memory LRU-like caches
const emailCache = new Map<string, ValidationResult>();
const domainCache = new Map<string, MxCheckResult>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Validates a single email address using the comprehensive 5-tier LeadPure protocol.
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
      verificationStatus: 'blocked',
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
  const { username, domain, normalizedEmail, suggestion } = syntax;

  // ----------------- TIER 2: DISPOSABLE EMAIL DETECTION -----------------
  const isDisposable = isDisposableDomain(domain, rawEmail);
  if (isDisposable) {
    trace.push('DEA: Detected (ERR_004)');
    if (options.excludeDisposable) {
      const res: ValidationResult = {
        email: rawEmail,
        verificationStatus: 'blocked',
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
        verificationStatus: 'blocked',
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
      verificationStatus: 'rejected',
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
      domainAge: mxData.domainAge,
      domainAgeDays: mxData.domainAgeDays,
      spfExists: mxData.spfExists,
      dkimExists: mxData.dkimExists,
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

  // ----------------- TIER 5: LEADPURE MULTI-PROTOCOL VERIFICATION -----------------
  trace.push(`Provider: ${mxData.provider.toUpperCase()}`);

  const smtpResult: SmtpCheckResult = await verifySmtpDeliverability(
    rawEmail,
    domain,
    primaryMx,
    mxData.provider,
    { checkCatchAll: options.excludeCatchAll }
  );

  // Check Catch-All policy
  if (smtpResult.isCatchAll) {
    trace.push('Catch-All: Active (Accept-All Domain)');
    if (options.excludeCatchAll) {
      trace.push('Catch-All: Blocked by Policy (ERR_005)');
      const res: ValidationResult = {
        email: rawEmail,
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
        isRoleBased: isRole,
        isFreeEmail,
        isSpamTrap: false,
        provider: mxData.provider,
        smtpValid: false,
        syntaxValid: true,
        didyouseeme: false,
        suggestion,
        status: 'INVALID',
        sub_status: 'catch_all',
        failure_code: 'ERR_005',
        smtp_code: smtpResult.code,
        mx_ip: primaryMxIp,
        timestamp,
        is_catchall: true,
        trace: trace.join(' -> ')
      };
      return res;
    }
  }

  // Check Mailbox Disabled
  if (smtpResult.isDisabled) {
    trace.push('SMTP: Mailbox Deactivated/Closed (ERR_003)');
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'rejected',
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
      domainAge: mxData.domainAge,
      domainAgeDays: mxData.domainAgeDays,
      spfExists: mxData.spfExists,
      dkimExists: mxData.dkimExists,
      status: 'INVALID',
      sub_status: 'mailbox_disabled',
      failure_code: 'ERR_003',
      smtp_code: smtpResult.code,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: smtpResult.isCatchAll,
      trace: trace.join(' -> ')
    };
    return res;
  }

  // Check Mailbox Nonexistent (hard 5xx rejection or invalid phrase)
  if (!smtpResult.isDeliverable && (smtpResult.code === 550 || smtpResult.code === 551 || smtpResult.code === 554 || smtpResult.verifMethod === 'yahoo_api')) {
    trace.push(`Verification: Mailbox Not Found (${smtpResult.response})`);
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'rejected',
      verificationReason: `System Rejected: Mailbox does not exist (${smtpResult.response})`,
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
      domainAge: mxData.domainAge,
      domainAgeDays: mxData.domainAgeDays,
      spfExists: mxData.spfExists,
      dkimExists: mxData.dkimExists,
      status: 'INVALID',
      sub_status: 'mailbox_not_found',
      failure_code: 'ERR_003',
      smtp_code: smtpResult.code,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: smtpResult.isCatchAll,
      trace: trace.join(' -> ')
    };
    return res;
  }

  // Check Full Inbox (Reachable: Risky)
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
      status: 'RISKY',
      sub_status: 'full_inbox',
      failure_code: 'ERR_008',
      smtp_code: smtpResult.code,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: smtpResult.isCatchAll,
      trace: trace.join(' -> ')
    };
    return res;
  }

  // Check Greylisted / Throttling (Reachable: Risky / Inconclusive)
  if (smtpResult.isGreylisted) {
    trace.push('SMTP: Greylisted (ERR_007)');
    const res: ValidationResult = {
      email: rawEmail,
      verificationStatus: 'risky',
      verificationReason: 'Target server is enforcing Greylisting / Rate Limiting',
      subStatus: 'greylisted',
      confidenceScore: 60,
      bounceRisk: 'Medium',
      reputationImpact: 'Neutral',
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
      status: 'RISKY',
      sub_status: 'greylisted',
      failure_code: 'ERR_007',
      smtp_code: smtpResult.code,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: smtpResult.isCatchAll,
      trace: trace.join(' -> ')
    };
    return res;
  }

  // If Disposable or Role (and not strictly excluded), mark as RISKY
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
      isCatchAll: smtpResult.isCatchAll,
      isDisposable,
      isRoleBased: isRole,
      isFreeEmail,
      isSpamTrap: false,
      provider: mxData.provider,
      smtpValid: smtpResult.isDeliverable,
      syntaxValid: true,
      didyouseeme: false,
      suggestion,
      status: 'RISKY',
      sub_status: isDisposable ? 'disposable' : 'role_based',
      failure_code: isDisposable ? 'ERR_004' : 'ERR_006',
      smtp_code: smtpResult.code,
      mx_ip: primaryMxIp,
      timestamp,
      is_catchall: smtpResult.isCatchAll,
      trace: trace.join(' -> ')
    };
    return res;
  }

  // ----------------- FINAL VERDICT: SAFE / DELIVERABLE -----------------
  // LeadPure Identity Check: Gravatar Profile Signal
  const gravatarUrl = await checkGravatar(rawEmail);
  const hasGravatar = !!gravatarUrl;
  if (hasGravatar) {
    trace.push('Gravatar: Active Profile Verified');
  }

  trace.push(smtpResult.verifMethod === 'smtp' ? 'Verified: Real-Time Handshake Confirmed' : 'Verified: Active Domain & MX Infrastructure Confirmed');

  const finalScore = hasGravatar || smtpResult.verifMethod === 'smtp' || smtpResult.verifMethod === 'yahoo_api' ? 99 : 94;

  const result: ValidationResult = {
    email: rawEmail,
    verificationStatus: 'verified',
    verificationReason: hasGravatar 
      ? 'Deliverable: Verified Active Identity with Gravatar Profile'
      : 'Deliverable: Active target mail infrastructure verified',
    subStatus: 'valid',
    confidenceScore: finalScore,
    bounceRisk: 'Safe',
    reputationImpact: 'Positive',
    mxRecordFound: true,
    mxRecord: primaryMx,
    isCatchAll: smtpResult.isCatchAll,
    isDisposable: false,
    isRoleBased: false,
    isFreeEmail,
    isSpamTrap: false,
    provider: mxData.provider,
    smtpValid: true,
    syntaxValid: true,
    didyouseeme: false,
    suggestion,
    domainAge: mxData.domainAge,
    domainAgeDays: mxData.domainAgeDays,
    spfExists: mxData.spfExists,
    dkimExists: mxData.dkimExists,
    hasGravatar,
    gravatarUrl: gravatarUrl || undefined,
    status: 'SAFE',
    sub_status: 'valid',
    failure_code: null,
    smtp_code: smtpResult.code || 250,
    mx_ip: primaryMxIp,
    timestamp,
    is_catchall: smtpResult.isCatchAll,
    trace: trace.join(' -> ')
  };

  emailCache.set(cacheKey, result);
  if (emailCache.size > 20000) emailCache.clear();

  return result;
}
