import crypto from 'crypto';
import dns from 'dns/promises';

// Strict score calculation per Phase 2d
export function calculatePhase2Score(reacherResult: any, hasSpf: boolean = false): number {
  const syntax = reacherResult.syntax || {};
  const mx = reacherResult.mx || {};
  const smtp = reacherResult.smtp || {};
  const misc = reacherResult.misc || {};
  const reachable = reacherResult.is_reachable;

  if (syntax.is_valid_syntax === false) return 0;
  if (mx.accepts_mail === false || (mx.records && mx.records.length === 0)) return 5;

  let score = 20;
  if (!misc.is_disposable) score += 10;
  if (!misc.is_role_account) score += 10;
  if (hasSpf) score += 5;
  if (smtp.is_deliverable) score += 45;
  if (smtp.is_catch_all) score -= 25;
  if (smtp.has_full_inbox) score -= 15;
  if (smtp.is_disabled) score = Math.min(score, 10);
  if (reachable === 'unknown') score = Math.min(score, 45);

  return Math.max(0, Math.min(95, score));
}

function isValidSyntax(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain || local.length > 64 || domain.length > 255) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email);
}

export default async function handler(req: any, res: any) {
  res.setHeader('X-LeadPure-Version', 'v15.0.0');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const token = process.env.REACHER_GH_TOKEN || process.env.GITHUB_TOKEN;
  const repoOwner = process.env.REACHER_REPO_OWNER || 'ossamamehmood';
  const repoName = process.env.REACHER_REPO_NAME || 'LeadPure-AI';
  const workflowFile = 'leadpure-check.yml';

  // -------------------------------------------------------------
  // GET /api/check?requestId=... (Polling for completed result)
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    const { requestId } = req.query || {};
    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'requestId parameter is required' });
    }

    try {
      let pollRes: any;
      if (token) {
        const resultUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/results/${requestId}.json?ref=results`;
        pollRes = await fetch(resultUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.raw+json',
            'User-Agent': 'LeadPure-AI-Engine'
          }
        });
      } else {
        const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/results/results/${requestId}.json`;
        pollRes = await fetch(rawUrl, {
          headers: {
            'User-Agent': 'LeadPure-AI-Engine'
          }
        });
      }

      if (pollRes.status === 404) {
        return res.json({
          status: 'pending',
          requestId,
          message: 'Checking — a real SMTP probe is running on GitHub Actions; this takes 1–3 minutes'
        });
      }

      if (pollRes.ok) {
        const rawJson: any = await pollRes.json();
        const resultArray = Array.isArray(rawJson) ? rawJson : [rawJson];
        const primary = resultArray[0] || {};

        const mappedList = await Promise.all(resultArray.map(async (item: any) => {
          let hasSpf = false;
          try {
            const domain = item.input?.split('@')[1];
            if (domain) {
              const txts = await dns.resolveTxt(domain);
              hasSpf = txts.some(r => r.join('').toLowerCase().startsWith('v=spf1'));
            }
          } catch {}

          const score = calculatePhase2Score(item, hasSpf);
          let ui_label = 'UNKNOWN — could not verify';
          let ui_reason = item.smtp?.response || 'Could not verify mailbox';

          if (item.is_reachable === 'safe') {
            ui_label = 'SAFE — mailbox verified';
            ui_reason = 'Mailbox verified deliverable: Recipient confirmed by target mail server (non-catch-all)';
          } else if (item.is_reachable === 'risky') {
            ui_label = 'RISKY';
            const reasons = [];
            if (item.smtp?.is_catch_all) reasons.push('Catch-All Domain (accepts any local part)');
            if (item.misc?.is_role_account) reasons.push('Role Account (shared inbox)');
            if (item.misc?.is_disposable) reasons.push('Disposable Email Domain');
            if (item.smtp?.has_full_inbox) reasons.push('Mailbox Over Quota');
            ui_reason = reasons.join(', ') || 'Domain or address characteristics present bounce risk';
          } else if (item.is_reachable === 'invalid') {
            ui_label = 'INVALID';
            ui_reason = item.smtp?.is_disabled ? 'Account disabled by provider' : 'Mailbox does not exist (rejected by MX)';
          }

          const status = item.is_reachable === 'safe' ? 'SAFE' : (item.is_reachable === 'risky' ? 'RISKY' : (item.is_reachable === 'invalid' ? 'INVALID' : 'UNKNOWN'));
          const verificationStatus = item.is_reachable === 'safe' ? 'safe' : (item.is_reachable === 'risky' ? 'risky' : (item.is_reachable === 'invalid' ? 'blocked' : 'unknown'));

          let sub_status = 'ok';
          if (item.syntax?.is_valid_syntax === false) sub_status = 'invalid_syntax';
          else if (!item.mx?.accepts_mail) sub_status = 'domain_not_found';
          else if (item.misc?.is_disposable) sub_status = 'disposable';
          else if (item.misc?.is_role_account) sub_status = 'role_based';
          else if (item.smtp?.is_catch_all) sub_status = 'catch_all';
          else if (item.is_reachable === 'invalid') sub_status = 'mailbox_not_found';
          else if (item.is_reachable === 'unknown') sub_status = 'unreachable';

          return {
            email: item.input,
            status,
            sub_status,
            subStatus: sub_status,
            verificationStatus,
            verificationReason: ui_reason,
            confidenceScore: score,
            bounceRisk: item.is_reachable === 'safe' ? 'Safe' : (item.is_reachable === 'risky' ? 'Medium' : (item.is_reachable === 'invalid' ? 'High' : 'Unknown')),
            reputationImpact: item.is_reachable === 'safe' ? 'Positive' : (item.is_reachable === 'risky' ? 'Neutral' : (item.is_reachable === 'invalid' ? 'Critical' : 'Unknown')),
            isCatchAll: !!item.smtp?.is_catch_all,
            isDeliverable: !!item.smtp?.is_deliverable,
            mxRecordFound: !!item.mx?.accepts_mail,
            mxRecord: item.mx?.records?.[0] || '',
            provider: item.misc?.is_b2c ? 'Consumer Node' : 'Enterprise Node',
            isFreeEmail: !!item.misc?.is_b2c,
            isDisposable: !!item.misc?.is_disposable,
            isRoleBased: !!item.misc?.is_role_account,
            spfExists: hasSpf,
            smtpValid: !!item.smtp?.can_connect_smtp,
            syntaxValid: item.syntax?.is_valid_syntax !== false,
            ui_label,
            ui_reason,
            raw: item
          };
        }));

        const primaryMapped = mappedList[0] || {};
        return res.json({
          ...primaryMapped,
          status: 'completed',
          results: mappedList,
          requestId,
          timestamp: new Date().toISOString()
        });
      }

      return res.json({
        status: 'error',
        is_reachable: 'unknown',
        confidenceScore: null,
        ui_label: 'UNKNOWN — verification backend unreachable',
        ui_reason: `GitHub API returned status ${pollRes.status}`
      });
    } catch (err: any) {
      return res.json({
        status: 'error',
        is_reachable: 'unknown',
        confidenceScore: null,
        ui_label: 'UNKNOWN — verification backend unreachable',
        ui_reason: `Polling error: ${err.message}`
      });
    }
  }

  // -------------------------------------------------------------
  // POST /api/check (Dispatch verification request)
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    const { email, emails } = req.body || {};
    const rawList: string[] = emails ? (Array.isArray(emails) ? emails : [emails]) : (email ? [email] : []);

    if (rawList.length === 0) {
      return res.status(400).json({ error: 'email or emails array required' });
    }

    const targetEmail = rawList[0].trim();
    const domain = targetEmail.split('@')[1] || '';

    // 1. Local Syntax Fast-Check
    if (!isValidSyntax(targetEmail)) {
      return res.json({
        status: 'completed',
        input: targetEmail,
        is_reachable: 'invalid',
        confidenceScore: 0,
        ui_label: 'INVALID',
        ui_reason: 'RFC syntax invalid',
        syntax: { is_valid_syntax: false, domain, username: targetEmail.split('@')[0] },
        misc: { is_disposable: false, is_role_account: false },
        mx: { accepts_mail: false, records: [] },
        smtp: { can_connect_smtp: false, is_deliverable: false, is_catch_all: false }
      });
    }

    if (!token) {
      return res.json({
        status: 'error',
        input: targetEmail,
        is_reachable: 'unknown',
        confidenceScore: null,
        ui_label: 'UNKNOWN — verification backend unreachable',
        ui_reason: 'REACHER_GH_TOKEN not configured in Vercel environment'
      });
    }

    const requestId = `lp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    try {
      const dispatchUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/dispatches`;
      const dispatchRes = await fetch(dispatchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'LeadPure-AI-Engine'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            request_id: requestId,
            emails: rawList.join('\n')
          }
        })
      });

      if (!dispatchRes.ok) {
        const errText = await dispatchRes.text();
        return res.json({
          status: 'error',
          input: targetEmail,
          is_reachable: 'unknown',
          confidenceScore: null,
          ui_label: 'UNKNOWN — verification backend unreachable',
          ui_reason: `Workflow dispatch failed (${dispatchRes.status}): ${errText.slice(0, 100)}`
        });
      }

      // Return pending state with requestId so client can poll
      return res.json({
        status: 'pending',
        requestId,
        targetEmail,
        message: 'Checking — a real SMTP probe is running on GitHub Actions; this takes 1–3 minutes'
      });
    } catch (err: any) {
      return res.json({
        status: 'error',
        input: targetEmail,
        is_reachable: 'unknown',
        confidenceScore: null,
        ui_label: 'UNKNOWN — verification backend unreachable',
        ui_reason: `Dispatch error: ${err.message}`
      });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
