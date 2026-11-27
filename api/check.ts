import crypto from 'crypto';
import dns from 'dns/promises';

export type CanonicalVerdict = 'SAFE' | 'RISKY' | 'INVALID' | 'UNKNOWN';
export type CanonicalUiStatus = 'safe' | 'risky' | 'invalid' | 'unknown';

function isValidSyntax(email: string): boolean {
  if (!email || typeof email !== 'string' || email.length > 254) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain || local.length > 64 || domain.length > 255) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email);
}

function isValidRequestId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{3,80}$/.test(id);
}

function identifyProviderName(mxHost: string, isFree: boolean): string {
  const host = (mxHost || '').toLowerCase();
  if (host.includes('google.com') || host.includes('googlemail.com')) return isFree ? 'Google (Gmail)' : 'Google Workspace';
  if (host.includes('outlook.com') || host.includes('mx.microsoft')) return isFree ? 'Microsoft Consumer' : 'Microsoft 365';
  if (host.includes('yahoodns')) return 'Yahoo Mail';
  if (host.includes('icloud.com') || host.includes('apple.com')) return 'Apple iCloud';
  if (host.includes('protonmail')) return 'Proton Mail';
  if (host.includes('zoho.com')) return 'Zoho Mail';
  if (host.includes('improvmx')) return 'ImprovMX (Forwarding)';
  if (host.includes('forwardemail')) return 'ForwardEmail (Forwarding)';
  if (host.includes('mx.cloudflare.net') || host.includes('email-routing')) return 'Cloudflare Email Routing';
  if (host.includes('mimecast')) return 'Mimecast Gateway';
  if (host.includes('ppe-hosted')) return 'Proofpoint Essentials';
  if (host.includes('pphosted')) return 'Proofpoint Gateway';
  if (host.includes('privateemail')) return 'PrivateEmail';
  return mxHost ? mxHost.replace(/\.$/, '') : (isFree ? 'Consumer Provider' : 'Custom MX');
}

async function mapProbeResults(resultArray: any[]) {
  const spfPromiseCache = new Map<string, Promise<boolean>>();

  const getSpf = (domain: string): Promise<boolean> => {
    if (!domain) return Promise.resolve(false);
    const key = domain.toLowerCase();
    if (!spfPromiseCache.has(key)) {
      spfPromiseCache.set(
        key,
        dns.resolveTxt(key)
          .then(txts => txts.some(r => r.join('').toLowerCase().startsWith('v=spf1')))
          .catch(() => false)
      );
    }
    return spfPromiseCache.get(key)!;
  };

  return Promise.all(resultArray.map(async (item: any) => {
    const emailInput = String(item.input || '').trim();
    const domain = emailInput.split('@')[1] || '';
    const hasSpf = await getSpf(domain);
    const reachable = String(item.is_reachable || 'unknown').toLowerCase();
    const primaryMx = (item.mx?.records?.[0] || '').replace(/\.$/, '');
    const isFree = !!(item.misc?.is_b2c || item.debug?.freemail);
    const recheckRaw = item.recheck && typeof item.recheck === 'object' ? item.recheck : null;
    const greylistRaw = item.debug?.greylist_retries && typeof item.debug.greylist_retries === 'object'
      ? item.debug.greylist_retries
      : null;

    let verdict: CanonicalVerdict = 'UNKNOWN';
    let verificationStatus: CanonicalUiStatus = 'unknown';
    let ui_label = 'UNKNOWN';
    let ui_reason = 'Mail server unreachable or probe inconclusive';

    // Map internal engine diagnostics to user-friendly, plain-English verdict reasons.
    // Technical details remain in raw.debug (e.g. rcpt_reply, policy_rejection, identity_disagreement).
    if (reachable === 'safe') {
      verdict = 'SAFE';
      verificationStatus = 'safe';
      ui_label = 'SAFE';
      ui_reason = 'Safe to send: inbox confirmed active (not accept-all)';
    } else if (reachable === 'risky') {
      verdict = 'RISKY';
      verificationStatus = 'risky';
      ui_label = 'RISKY';
      const reasons: string[] = [];
      if (item.smtp?.is_catch_all) reasons.push('Accept-all domain (accepts any email name)');
      if (item.misc?.is_role_account) reasons.push('Shared team or role inbox (e.g. info@, support@)');
      if (item.misc?.is_disposable) reasons.push('Temporary disposable inbox');
      if (item.smtp?.has_full_inbox) reasons.push('Inbox is currently full');
      if (item.debug?.forwarding_alias_accepted) reasons.push('Forwarding alias accepted (final destination inbox cannot be confirmed)');
      ui_reason = reasons.join(', ') || 'Deliverability signals indicate extra sending risk';
    } else if (reachable === 'invalid') {
      verdict = 'INVALID';
      verificationStatus = 'invalid';
      ui_label = 'INVALID';
      if (item.syntax?.is_valid_syntax === false) ui_reason = 'Invalid email format';
      else if (item.debug?.disposable_domain || item.misc?.is_disposable) ui_reason = 'Temporary disposable email domain';
      else if (item.debug?.no_mx || item.mx?.accepts_mail === false) ui_reason = 'Domain is not set up to receive email';
      else if (item.smtp?.is_disabled) ui_reason = 'Mailbox has been disabled';
      else ui_reason = 'Mailbox does not exist (rejected by mail server)';
    } else {
      verdict = 'UNKNOWN';
      verificationStatus = 'unknown';
      ui_label = 'UNKNOWN';
      if (item.debug?.identity_disagreement) {
        ui_reason = 'Mail server gave conflicting policy responses; marked UNKNOWN instead of guessing';
      } else if (item.debug?.policy_rejection) {
        ui_reason = 'Mail server blocked the verification check by policy; status could not be confirmed';
      } else if (item.debug?.forwarding_rcpt_rejected) {
        ui_reason = 'Forwarding service declined check; final inbox could not be confirmed';
      } else if (item.debug?.greylisted_or_temp || (greylistRaw && Number(greylistRaw.count) >= 1)) {
        ui_reason = greylistRaw && Number(greylistRaw.count) >= 1
          ? `Mail server temporarily deferred check after ${greylistRaw.count} greylist retries; queued for automatic re-check`
          : 'Mail server is temporarily rate-limiting checks (greylisted); queued for automatic re-check';
      } else if (item.debug?.connect_error) {
        ui_reason = 'Could not reach the mail server in time; try again to confirm';
      } else {
        ui_reason = 'Mail server answer was inconclusive; kept UNKNOWN rather than guessing';
      }
    }

    let sub_status = 'ok';
    if (item.syntax?.is_valid_syntax === false) sub_status = 'invalid_syntax';
    else if (item.misc?.is_disposable || item.debug?.disposable_domain) sub_status = 'disposable';
    else if (!item.mx?.accepts_mail || item.debug?.no_mx) sub_status = 'domain_not_found';
    else if (item.misc?.is_role_account) sub_status = 'role_based';
    else if (item.smtp?.is_catch_all) sub_status = 'catch_all';
    else if (verdict === 'INVALID') sub_status = 'mailbox_not_found';
    else if (verdict === 'UNKNOWN') sub_status = 'unreachable';

    const resolvedOnRecheck = Boolean(recheckRaw?.resolved || item.debug?.resolved_on_recheck);
    const recheckStatus = recheckRaw?.status || (verdict === 'UNKNOWN' ? 'pending' : (resolvedOnRecheck ? 'resolved' : undefined));

    return {
      email: emailInput,
      status: verdict,
      verdict,
      sub_status,
      subStatus: sub_status,
      verificationStatus,
      verificationReason: ui_reason,
      bounceRisk: verdict === 'SAFE' ? 'Safe' : (verdict === 'RISKY' ? 'Medium' : (verdict === 'INVALID' ? 'High' : 'Unknown')),
      reputationImpact: verdict === 'SAFE' ? 'Positive' : (verdict === 'RISKY' ? 'Neutral' : (verdict === 'INVALID' ? 'Critical' : 'Unknown')),
      isCatchAll: !!item.smtp?.is_catch_all,
      isDeliverable: !!item.smtp?.is_deliverable,
      mxRecordFound: !!item.mx?.accepts_mail,
      mxRecord: primaryMx,
      provider: identifyProviderName(primaryMx, isFree),
      isFreeEmail: isFree,
      isDisposable: !!(item.misc?.is_disposable || item.debug?.disposable_domain),
      isRoleBased: !!item.misc?.is_role_account,
      spfExists: hasSpf,
      smtpValid: !!item.smtp?.can_connect_smtp,
      syntaxValid: item.syntax?.is_valid_syntax !== false,
      recheckStatus,
      resolvedOnRecheck,
      recheckResolvedAt: recheckRaw?.resolvedAt || item.debug?.recheck_resolved_at || undefined,
      recheckAttempts: Number(recheckRaw?.attempts ?? item.debug?.recheck_attempts ?? 0),
      recheckMaxAttempts: Number(recheckRaw?.maxAttempts ?? 2),
      recheckNextAt: recheckRaw?.nextAttemptAt || undefined,
      initialVerdict: recheckRaw?.initialVerdict || (resolvedOnRecheck ? 'UNKNOWN' : verdict),
      greylistRetries: greylistRaw ? { count: Number(greylistRaw.count || 0), final_reply: greylistRaw.final_reply } : undefined,
      ui_label,
      ui_reason,
      raw: item
    };
  }));
}

async function fetchGithubContent(url: string, token?: string, acceptRaw = false) {
  const headers: Record<string, string> = {
    'User-Agent': 'LeadPure-AI-Engine',
    'Accept': acceptRaw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { headers });
}

async function fetchRecheckQueue(repoOwner: string, repoName: string, token?: string) {
  try {
    const queueUrl = token
      ? `https://api.github.com/repos/${repoOwner}/${repoName}/contents/recheck-queue/queue.json?ref=results`
      : `https://raw.githubusercontent.com/${repoOwner}/${repoName}/results/recheck-queue/queue.json`;
    const res = await fetchGithubContent(queueUrl, token, true);
    if (!res.ok) return null;
    const data: any = await res.json();
    return Array.isArray(data?.items) ? data : null;
  } catch {
    return null;
  }
}

function mergeQueueStatusIntoMapped(mappedList: any[], requestId: string, queueData: any) {
  if (!queueData || !Array.isArray(queueData.items)) return mappedList;
  const byEmail = new Map<string, any>();
  for (const entry of queueData.items) {
    const matches =
      entry?.scanId === requestId ||
      (Array.isArray(entry?.scans) && entry.scans.some((s: any) => s?.requestId === requestId));
    if (matches && entry?.email) {
      byEmail.set(String(entry.email).toLowerCase(), entry);
    }
  }
  if (byEmail.size === 0) return mappedList;

  return mappedList.map((contact) => {
    const emailLower = String(contact?.email || '').trim().toLowerCase();
    const entry = byEmail.get(emailLower);
    if (!entry) return contact;

    return {
      ...contact,
      recheckStatus: entry.status || contact.recheckStatus,
      recheckAttempts: Number(entry.attempts ?? contact.recheckAttempts ?? 0),
      recheckMaxAttempts: Number(entry.maxAttempts ?? contact.recheckMaxAttempts ?? 2),
      recheckNextAt: entry.nextAttemptAt ?? contact.recheckNextAt ?? null,
      resolvedOnRecheck: Boolean(contact.resolvedOnRecheck || entry.status === 'resolved'),
      recheckResolvedAt: contact.recheckResolvedAt || entry.resolvedAt || undefined
    };
  });
}

async function putGithubFile(url: string, token: string, message: string, jsonObj: any, sha?: string) {
  const content = Buffer.from(JSON.stringify(jsonObj, null, 2), 'utf8').toString('base64');
  const payload: any = { message, content, branch: 'results' };
  if (sha) payload.sha = sha;
  return fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'LeadPure-AI-Engine'
    },
    body: JSON.stringify(payload)
  });
}

async function dispatchWorkflow(
  repoOwner: string,
  repoName: string,
  workflowFile: string,
  token: string,
  requestId: string,
  emailsText: string,
  chunkIndex?: number
) {
  const dispatchUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/dispatches`;
  const inputs: Record<string, string> = {
    request_id: requestId,
    emails: emailsText
  };
  if (typeof chunkIndex === 'number') {
    inputs.chunk_index = String(chunkIndex);
  }
  return fetch(dispatchUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'LeadPure-AI-Engine'
    },
    body: JSON.stringify({ ref: 'main', inputs })
  });
}

const FAILED_RUNNER_REASON =
  "This check didn't complete - the verification runner couldn't be reached. Please try again.";

const TERMINAL_FAILED_CONCLUSIONS = new Set([
  'failure',
  'cancelled',
  'timed_out',
  'startup_failure',
  'action_required'
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getRequestTimestampMs(requestId: string): number | null {
  const m = requestId.match(/^lp_(\d{10,16})_[a-f0-9]+$/i);
  return m ? Number(m[1]) : null;
}

function matchWorkflowRunForRequest(
  runs: any[],
  requestId: string,
  chunkIndex?: number
): any | null {
  const reqRegex = new RegExp(`(?:^|\\s)${escapeRegExp(requestId)}(?:$|\\s)`);
  const chunkRegex = typeof chunkIndex === 'number'
    ? new RegExp(`(?:^|\\s)chunk-${chunkIndex}(?:$|\\s)`)
    : null;

  const matched = runs.filter((run) => {
    const title = String(run?.display_title || run?.name || '');
    if (!reqRegex.test(title)) return false;
    if (chunkRegex) return chunkRegex.test(title);
    return !/(?:^|\s)chunk-\d+(?:$|\s)/.test(title);
  });

  if (matched.length === 0) return null;
  matched.sort((a, b) => Date.parse(b.created_at || '') - Date.parse(a.created_at || ''));
  return matched[0];
}

async function fetchWorkflowRunsList(
  repoOwner: string,
  repoName: string,
  workflowFile: string,
  token: string
): Promise<any[] | null> {
  try {
    const runsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/runs?event=workflow_dispatch&per_page=30`;
    const runsRes = await fetchGithubContent(runsUrl, token, false);
    if (!runsRes.ok) return null;
    const data: any = await runsRes.json();
    return Array.isArray(data?.workflow_runs) ? data.workflow_runs : [];
  } catch {
    return null;
  }
}

async function isWorkflowDisabled(
  repoOwner: string,
  repoName: string,
  workflowFile: string,
  token: string
): Promise<boolean> {
  try {
    const wfUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}`;
    const wfRes = await fetchGithubContent(wfUrl, token, false);
    if (!wfRes.ok) return wfRes.status === 404;
    const wf: any = await wfRes.json();
    return Boolean(wf?.state && wf.state !== 'active');
  } catch {
    return false;
  }
}

async function inspectTargetFailure(params: {
  repoOwner: string;
  repoName: string;
  workflowFile: string;
  token?: string;
  requestId: string;
  chunkIndex?: number;
  targetUrl: string;
  runsCache?: any[] | null;
}) {
  const { repoOwner, repoName, workflowFile, token, requestId, chunkIndex, targetUrl, runsCache } = params;
  if (!token) return { failed: false as const };

  const runs = runsCache !== undefined
    ? runsCache
    : await fetchWorkflowRunsList(repoOwner, repoName, workflowFile, token);

  if (runs) {
    const run = matchWorkflowRunForRequest(runs, requestId, chunkIndex);
    if (run && run.status === 'completed') {
      const conclusion = String(run.conclusion || '');
      const updatedMs = Date.parse(run.updated_at || '');
      const completedWithNoFileGraceExpired =
        conclusion === 'success' && Number.isFinite(updatedMs) && (Date.now() - updatedMs > 15_000);

      if (TERMINAL_FAILED_CONCLUSIONS.has(conclusion) || completedWithNoFileGraceExpired) {
        // Re-check storage once to eliminate commit-vs-status race conditions.
        const recheckRes = await fetchGithubContent(targetUrl, token, true);
        if (recheckRes.ok) {
          return { failed: false as const, recoveredRes: recheckRes };
        }
        return {
          failed: true as const,
          runId: run.id,
          conclusion: completedWithNoFileGraceExpired ? 'missing_result' : conclusion,
          ui_reason: FAILED_RUNNER_REASON
        };
      }
    }

    if (!run) {
      const reqTs = getRequestTimestampMs(requestId);
      if (reqTs && Date.now() - reqTs > 15_000) {
        if (await isWorkflowDisabled(repoOwner, repoName, workflowFile, token)) {
          return {
            failed: true as const,
            conclusion: 'workflow_disabled',
            ui_reason: FAILED_RUNNER_REASON
          };
        }
      }
    }
  }

  return { failed: false as const };
}

export default async function handler(req: any, res: any) {
  res.setHeader('X-LeadPure-Version', 'v14.0.0');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  // Prefer LEADPURE_* env vars, preserving REACHER_* fallback for backwards compatibility
  const token = process.env.LEADPURE_GH_TOKEN || process.env.REACHER_GH_TOKEN || process.env.GITHUB_TOKEN;
  const repoOwner = process.env.LEADPURE_REPO_OWNER || process.env.REACHER_REPO_OWNER || 'ossamamehmood';
  const repoName = process.env.LEADPURE_REPO_NAME || process.env.REACHER_REPO_NAME || 'LeadPure';
  const workflowFile = 'leadpure-check.yml';

  // -------------------------------------------------------------
  // GET /api/check?requestId=... [&chunk=N | &mode=manifest]
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    const { requestId, chunk, mode, withQueue } = req.query || {};
    if (!isValidRequestId(requestId)) {
      return res.status(400).json({ error: 'Valid requestId parameter is required' });
    }

    if (chunk !== undefined && !/^\d+$/.test(String(chunk))) {
      return res.status(400).json({ error: 'Invalid chunk parameter' });
    }

    try {
      // 0. Direct re-check queue query: GET /api/check?requestId=...&mode=queue
      if (mode === 'queue') {
        const queueData = await fetchRecheckQueue(repoOwner, repoName, token);
        const items = (queueData?.items || []).filter(
          (entry: any) =>
            entry?.scanId === requestId ||
            (Array.isArray(entry?.scans) && entry.scans.some((s: any) => s?.requestId === requestId))
        );
        return res.json({
          status: 'completed',
          requestId,
          updatedAt: queueData?.updatedAt || null,
          items
        });
      }

      // 1. Specific chunk download: GET /api/check?requestId=...&chunk=N
      if (chunk !== undefined) {
        const chunkIdx = Number(chunk);
        const chunkUrl = token
          ? `https://api.github.com/repos/${repoOwner}/${repoName}/contents/results/${requestId}/chunk-${chunk}.json?ref=results`
          : `https://raw.githubusercontent.com/${repoOwner}/${repoName}/results/results/${requestId}/chunk-${chunk}.json`;
        let chunkRes = await fetchGithubContent(chunkUrl, token, true);
        if (chunkRes.status === 404) {
          const failure = await inspectTargetFailure({
            repoOwner,
            repoName,
            workflowFile,
            token,
            requestId,
            chunkIndex: chunkIdx,
            targetUrl: chunkUrl
          });
          if (failure.failed) {
            return res.json({
              status: 'failed',
              requestId,
              chunkIndex: chunkIdx,
              runId: failure.runId,
              conclusion: failure.conclusion,
              ui_reason: failure.ui_reason
            });
          }
          if (!failure.recoveredRes) {
            return res.json({ status: 'pending', requestId, chunkIndex: chunkIdx });
          }
          chunkRes = failure.recoveredRes;
        }
        if (!chunkRes.ok) {
          return res.json({
            status: 'failed',
            requestId,
            chunkIndex: chunkIdx,
            ui_reason: `Failed to fetch chunk ${chunk} (HTTP ${chunkRes.status})`
          });
        }
        const rawJson: any = await chunkRes.json();
        const resultArray = Array.isArray(rawJson) ? rawJson : [rawJson];
        let mappedList = await mapProbeResults(resultArray);
        const needsQueueMerge =
          withQueue === '1' ||
          mappedList.some((m: any) => m.status === 'UNKNOWN' || m.resolvedOnRecheck);
        if (needsQueueMerge) {
          const queueData = await fetchRecheckQueue(repoOwner, repoName, token);
          mappedList = mergeQueueStatusIntoMapped(mappedList, requestId, queueData);
        }
        return res.json({
          status: 'completed',
          requestId,
          chunkIndex: chunkIdx,
          results: mappedList,
          timestamp: new Date().toISOString()
        });
      }

      // 2. Single-email check fast path (skip if explicitly requesting manifest)
      if (mode !== 'manifest') {
        const singleUrl = token
          ? `https://api.github.com/repos/${repoOwner}/${repoName}/contents/results/${requestId}.json?ref=results`
          : `https://raw.githubusercontent.com/${repoOwner}/${repoName}/results/results/${requestId}.json`;
        const singleRes = await fetchGithubContent(singleUrl, token, true);

        if (singleRes.ok) {
          const rawJson: any = await singleRes.json();
          const resultArray = Array.isArray(rawJson) ? rawJson : [rawJson];
          let mappedList = await mapProbeResults(resultArray);
          if (
            withQueue === '1' ||
            mappedList.some((m: any) => m.status === 'UNKNOWN' || m.resolvedOnRecheck)
          ) {
            const queueData = await fetchRecheckQueue(repoOwner, repoName, token);
            mappedList = mergeQueueStatusIntoMapped(mappedList, requestId, queueData);
          }
          const primaryMapped = mappedList[0] || {};
          return res.json({
            ...primaryMapped,
            status: 'completed',
            results: mappedList,
            requestId,
            timestamp: new Date().toISOString()
          });
        }

        if (singleRes.status !== 404) {
          return res.json({
            status: 'failed',
            requestId,
            ui_reason: `Verification storage returned status ${singleRes.status}`
          });
        }
      }

      // 3. Bulk Manifest & Chunk Directory Polling
      const manifestApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/results/${requestId}/manifest.json?ref=results`;
      const manifestUrl = token
        ? manifestApiUrl
        : `https://raw.githubusercontent.com/${repoOwner}/${repoName}/results/results/${requestId}/manifest.json`;

      const dirUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/results/${requestId}?ref=results`;

      const [manifestRes, dirRes] = await Promise.all([
        fetchGithubContent(manifestUrl, token, false),
        token ? fetchGithubContent(dirUrl, token, false) : Promise.resolve(null)
      ]);

      if (manifestRes.status === 404) {
        if (mode !== 'manifest') {
          const singleUrl = token
            ? `https://api.github.com/repos/${repoOwner}/${repoName}/contents/results/${requestId}.json?ref=results`
            : `https://raw.githubusercontent.com/${repoOwner}/${repoName}/results/results/${requestId}.json`;
          const singleFailure = await inspectTargetFailure({
            repoOwner,
            repoName,
            workflowFile,
            token,
            requestId,
            targetUrl: singleUrl
          });
          if (singleFailure.recoveredRes) {
            const rawJson: any = await singleFailure.recoveredRes.json();
            const resultArray = Array.isArray(rawJson) ? rawJson : [rawJson];
            const mappedList = await mapProbeResults(resultArray);
            const primaryMapped = mappedList[0] || {};
            return res.json({
              ...primaryMapped,
              status: 'completed',
              results: mappedList,
              requestId,
              timestamp: new Date().toISOString()
            });
          }
          if (singleFailure.failed) {
            return res.json({
              status: 'failed',
              requestId,
              runId: singleFailure.runId,
              conclusion: singleFailure.conclusion,
              ui_reason: singleFailure.ui_reason
            });
          }
        }
        return res.json({
          status: 'pending',
          requestId,
          message: 'SMTP probe queued or running on worker...'
        });
      }

      if (!manifestRes.ok) {
        return res.json({
          status: 'failed',
          requestId,
          ui_reason: `Manifest read failed (${manifestRes.status})`
        });
      }

      let manifestData: any = null;
      let manifestSha: string | undefined = undefined;
      if (token) {
        const fileObj: any = await manifestRes.json();
        manifestSha = fileObj.sha;
        manifestData = JSON.parse(Buffer.from(fileObj.content, 'base64').toString('utf8'));
      } else {
        manifestData = await manifestRes.json();
      }

      const completedChunks: number[] = [];
      if (dirRes && dirRes.ok) {
        const dirEntries: any[] = await dirRes.json();
        if (Array.isArray(dirEntries)) {
          for (const entry of dirEntries) {
            const m = String(entry.name || '').match(/^chunk-(\d+)\.json$/);
            if (m) completedChunks.push(Number(m[1]));
          }
        }
      } else if (!token) {
        // Fallback probe if unauthenticated raw endpoint is used
        for (let i = 0; i < (manifestData.chunkCount || 1); i++) {
          const r = await fetch(`https://raw.githubusercontent.com/${repoOwner}/${repoName}/results/results/${requestId}/chunk-${i}.json`);
          if (r.ok) completedChunks.push(i);
        }
      }

      completedChunks.sort((a, b) => a - b);
      const chunksDone = completedChunks.length;
      const chunkCount = manifestData.chunkCount || 1;
      const allDone = chunksDone >= chunkCount;

      if (allDone && manifestData.status !== 'completed' && token && manifestSha) {
        manifestData.status = 'completed';
        manifestData.completedChunks = completedChunks;
        manifestData.completedAt = new Date().toISOString();
        // Best-effort manifest status update
        putGithubFile(manifestApiUrl, token, `manifest completed ${requestId}`, manifestData, manifestSha).catch(() => {});
      }

      // Check for any failed chunk workflows while chunks are still outstanding
      const failedChunks: Record<number, string> = {};
      if (!allDone && token) {
        const completedSet = new Set(completedChunks);
        const runs = await fetchWorkflowRunsList(repoOwner, repoName, workflowFile, token);
        if (runs) {
          for (let i = 0; i < chunkCount; i++) {
            if (completedSet.has(i)) continue;
            const chunkUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/results/${requestId}/chunk-${i}.json?ref=results`;
            const check = await inspectTargetFailure({
              repoOwner,
              repoName,
              workflowFile,
              token,
              requestId,
              chunkIndex: i,
              targetUrl: chunkUrl,
              runsCache: runs
            });
            if (check.recoveredRes) {
              completedChunks.push(i);
            } else if (check.failed) {
              failedChunks[i] = check.ui_reason;
            }
          }
          completedChunks.sort((a, b) => a - b);
        }
      }

      const finalChunksDone = completedChunks.length;
      const finalAllDone = finalChunksDone >= chunkCount;

      // Convenience fallback: if external single-poll caller hit bulk with <=1 chunk and didn't pass mode=manifest
      if (mode !== 'manifest' && finalAllDone && chunkCount === 1) {
        const cUrl = token
          ? `https://api.github.com/repos/${repoOwner}/${repoName}/contents/results/${requestId}/chunk-0.json?ref=results`
          : `https://raw.githubusercontent.com/${repoOwner}/${repoName}/results/results/${requestId}/chunk-0.json`;
        const cRes = await fetchGithubContent(cUrl, token, true);
        if (cRes.ok) {
          const rawJson: any = await cRes.json();
          const resultArray = Array.isArray(rawJson) ? rawJson : [rawJson];
          const mappedList = await mapProbeResults(resultArray);
          return res.json({
            ...(mappedList[0] || {}),
            status: 'completed',
            results: mappedList,
            manifest: { ...manifestData, completedChunks, chunksDone: finalChunksDone, failedChunks },
            requestId,
            timestamp: new Date().toISOString()
          });
        }
      }

      return res.json({
        status: finalAllDone ? 'completed' : 'pending',
        requestId,
        manifest: {
          ...manifestData,
          status: finalAllDone ? 'completed' : 'pending',
          completedChunks,
          chunksDone: finalChunksDone,
          failedChunks
        }
      });
    } catch (err: any) {
      return res.json({
        status: 'failed',
        requestId,
        ui_reason: `Polling error: ${err.message}`
      });
    }
  }

  // -------------------------------------------------------------
  // POST /api/check (Single Check, Bulk Init, or Chunk Dispatch)
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    const { email, emails, action, requestId: existingReqId, chunkIndex } = req.body || {};

    if (!token) {
      return res.json({
        status: 'failed',
        ui_reason: 'GitHub workflow token (LEADPURE_GH_TOKEN / REACHER_GH_TOKEN) is not configured on server'
      });
    }

    // Sub-action: dispatch subsequent 100-email chunk for an existing bulk request
    if (action === 'dispatch_chunk') {
      if (!isValidRequestId(existingReqId)) {
        return res.status(400).json({ error: 'Invalid requestId' });
      }
      if (typeof chunkIndex !== 'number' || chunkIndex < 0 || !Number.isInteger(chunkIndex)) {
        return res.status(400).json({ error: 'Invalid chunkIndex' });
      }
      const chunkList = (Array.isArray(emails) ? emails : [])
        .map((e: any) => String(e || '').replace(/[\r\n]+/g, '').trim())
        .filter(Boolean);

      if (chunkList.length === 0 || chunkList.length > 100) {
        return res.status(400).json({ error: 'Chunk must contain between 1 and 100 emails' });
      }

      try {
        const dispatchRes = await dispatchWorkflow(
          repoOwner, repoName, workflowFile, token, existingReqId, chunkList.join('\n'), chunkIndex
        );
        if (!dispatchRes.ok) {
          const errText = await dispatchRes.text();
          return res.json({
            status: 'failed',
            ui_reason: `Chunk ${chunkIndex} dispatch failed (${dispatchRes.status}): ${errText.slice(0, 120)}`
          });
        }
        return res.json({ status: 'dispatched', requestId: existingReqId, chunkIndex });
      } catch (err: any) {
        return res.json({ status: 'failed', ui_reason: `Chunk dispatch error: ${err.message}` });
      }
    }

    // Determine single vs bulk request
    const isBulk = Array.isArray(emails) || action === 'init_bulk';
    const rawList: string[] = (Array.isArray(emails) ? emails : (email ? [email] : []))
      .map((e: any) => String(e || '').replace(/[\r\n]+/g, '').trim())
      .filter(Boolean);

    if (rawList.length === 0) {
      return res.status(400).json({ error: 'email or non-empty emails array required' });
    }

    if (rawList.length > 5000) {
      return res.status(400).json({ error: 'Maximum list limit is 5,000 emails per scan' });
    }

    // Single email path (kept simple and backwards compatible)
    if (!isBulk && rawList.length === 1) {
      const targetEmail = rawList[0];
      if (!isValidSyntax(targetEmail)) {
        const invalidMapped = await mapProbeResults([{
          input: targetEmail,
          is_reachable: 'invalid',
          misc: { is_disposable: false, is_role_account: false },
          mx: { accepts_mail: false, records: [] },
          smtp: { can_connect_smtp: false, is_deliverable: false, is_catch_all: false },
          syntax: { address: targetEmail, is_valid_syntax: false }
        }]);
        return res.json({
          ...invalidMapped[0],
          status: 'completed',
          results: invalidMapped,
          timestamp: new Date().toISOString()
        });
      }

      const requestId = `lp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      try {
        const dispatchRes = await dispatchWorkflow(repoOwner, repoName, workflowFile, token, requestId, targetEmail);
        if (!dispatchRes.ok) {
          const errText = await dispatchRes.text();
          return res.json({
            status: 'failed',
            requestId,
            ui_reason: FAILED_RUNNER_REASON,
            detail: `Workflow dispatch failed (${dispatchRes.status}): ${errText.slice(0, 120)}`
          });
        }
        return res.json({
          status: 'pending',
          requestId,
          targetEmail,
          message: 'SMTP probe running on worker...'
        });
      } catch (err: any) {
        return res.json({
          status: 'failed',
          requestId,
          ui_reason: FAILED_RUNNER_REASON,
          detail: `Dispatch error: ${err.message}`
        });
      }
    }

    // Bulk path: Split into chunks of 100 emails, write manifest.json, dispatch first 3 chunks max
    const requestId = `lp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const CHUNK_SIZE = 100;
    const chunks: string[][] = [];
    for (let i = 0; i < rawList.length; i += CHUNK_SIZE) {
      chunks.push(rawList.slice(i, i + CHUNK_SIZE));
    }

    const manifest = {
      requestId,
      version: '14',
      totalEmails: rawList.length,
      chunkSize: CHUNK_SIZE,
      chunkCount: chunks.length,
      completedChunks: [],
      chunksDone: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      const manifestApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/results/${requestId}/manifest.json`;
      const putRes = await putGithubFile(manifestApiUrl, token, `init manifest ${requestId}`, manifest);
      if (!putRes.ok) {
        const errText = await putRes.text();
        return res.json({
          status: 'failed',
          ui_reason: `Failed to initialize scan manifest (${putRes.status}): ${errText.slice(0, 120)}`
        });
      }

      const initialConcurrent = Math.min(3, chunks.length);
      const dispatchedChunks: number[] = [];
      for (let idx = 0; idx < initialConcurrent; idx++) {
        const dRes = await dispatchWorkflow(
          repoOwner, repoName, workflowFile, token, requestId, chunks[idx].join('\n'), idx
        );
        if (!dRes.ok) {
          const errText = await dRes.text();
          return res.json({
            status: 'failed',
            ui_reason: `Initial chunk ${idx} dispatch failed (${dRes.status}): ${errText.slice(0, 120)}`
          });
        }
        dispatchedChunks.push(idx);
      }

      return res.json({
        status: 'pending',
        mode: 'bulk',
        requestId,
        totalEmails: rawList.length,
        chunkSize: CHUNK_SIZE,
        chunkCount: chunks.length,
        dispatchedChunks,
        message: `Dispatched ${dispatchedChunks.length} of ${chunks.length} chunk(s)`
      });
    } catch (err: any) {
      return res.json({ status: 'failed', ui_reason: `Bulk init error: ${err.message}` });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
