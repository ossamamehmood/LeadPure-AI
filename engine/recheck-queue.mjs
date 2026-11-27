import fs from 'node:fs';
import path from 'node:path';

export const FIRST_RECHECK_DELAY_MS = 60 * 60 * 1000; // ~1 hour
export const SECOND_RECHECK_DELAY_MS = 24 * 60 * 60 * 1000; // ~24 hours
export const MAX_RECHECK_ATTEMPTS = 2;
export const MAX_DRAIN_BATCH_SIZE = 25;
export const DISPATCH_LEASE_MS = 20 * 60 * 1000;
export const QUEUE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export const QUEUE_RELATIVE_PATH = path.join('recheck-queue', 'queue.json');
export const BATCHES_RELATIVE_DIR = path.join('recheck-queue', 'batches');

export function readJsonSafe(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

export function writeJsonAtomic(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, filePath);
}

export function normalizeQueue(raw, nowMs = Date.now()) {
  const base = raw && typeof raw === 'object' ? raw : {};
  const rawItems = Array.isArray(base.items) ? base.items : [];
  const items = rawItems.filter((item) => {
    if (!item || !item.email || !item.scanId) return false;
    if (item.status === 'pending') return true;
    const refMs = Date.parse(item.resolvedAt || item.updatedAt || item.createdAt || '');
    if (!Number.isFinite(refMs)) return true;
    return nowMs - refMs <= QUEUE_RETENTION_MS;
  });
  return {
    version: 1,
    updatedAt: base.updatedAt || new Date(nowMs).toISOString(),
    items
  };
}

function getScanRefKey(requestId, chunkIndex) {
  const chunkStr = chunkIndex !== null && chunkIndex !== undefined && chunkIndex !== '' ? String(chunkIndex) : 'single';
  return `${requestId}::${chunkStr}`;
}

export function extractUnknownReason(probeItem) {
  if (!probeItem || typeof probeItem !== 'object') return 'Mail server unreachable or probe inconclusive';
  const dbg = probeItem.debug || {};
  if (dbg.greylisted_or_temp || dbg.greylist_retries?.final_reply) {
    return String(dbg.greylist_retries?.final_reply || dbg.rcpt_reply || `Temporary deferral (${dbg.greylisted_or_temp || '4xx'})`);
  }
  if (dbg.policy_rejection) {
    return String(dbg.rcpt_reply || `Policy rejection (${dbg.policy_rejection.code || '5.7.x'})`);
  }
  if (dbg.identity_disagreement) {
    return String(dbg.confirm_reply || dbg.rcpt_reply || 'Conflicting mail server policy responses');
  }
  if (dbg.connect_error) return String(dbg.connect_error);
  return String(dbg.rcpt_reply || 'Inconclusive mail server reply');
}

/**
 * Enqueue UNKNOWN addresses from a completed probe run (single or bulk chunk).
 * - Deduplicates by exact (requestId, email).
 * - Attaches secondary scan references when the same email already has an active pending entry,
 *   preventing duplicate probe dispatches between overlapping bulk and single checks.
 * - Never enqueues SAFE / RISKY / INVALID results.
 */
export function enqueueUnknowns(queueRaw, { requestId, chunkIndex = null, results = [], nowMs = Date.now() }) {
  const queue = normalizeQueue(queueRaw, nowMs);
  const parsedChunk = chunkIndex !== null && chunkIndex !== undefined && String(chunkIndex).trim() !== ''
    ? Number(chunkIndex)
    : null;
  const nowIso = new Date(nowMs).toISOString();
  const firstAt = new Date(nowMs + FIRST_RECHECK_DELAY_MS).toISOString();
  const secondAt = new Date(nowMs + SECOND_RECHECK_DELAY_MS).toISOString();

  let addedCount = 0;
  let linkedCount = 0;
  const seenEmailsInCall = new Set();

  for (const item of Array.isArray(results) ? results : []) {
    if (!item || String(item.is_reachable || '').toLowerCase() !== 'unknown') continue;
    const emailLower = String(item.input || '').trim().toLowerCase();
    if (!emailLower || !emailLower.includes('@') || seenEmailsInCall.has(emailLower)) continue;
    seenEmailsInCall.add(emailLower);

    // Check if this exact scan + email was already recorded (idempotent on push retries)
    const alreadyInThisScan = queue.items.find((entry) => {
      if (entry.email !== emailLower) return false;
      if (entry.scanId === requestId) return true;
      return Array.isArray(entry.scans) && entry.scans.some((s) => s.requestId === requestId);
    });
    if (alreadyInThisScan) continue;

    // If this address already has an active pending re-check entry from another scan, attach scan ref instead of double-queuing
    const activePendingSameEmail = queue.items.find(
      (entry) =>
        entry.email === emailLower &&
        entry.status === 'pending' &&
        Number(entry.attempts || 0) < Number(entry.maxAttempts || MAX_RECHECK_ATTEMPTS)
    );
    if (activePendingSameEmail) {
      if (!Array.isArray(activePendingSameEmail.scans)) {
        activePendingSameEmail.scans = [{ requestId: activePendingSameEmail.scanId, chunkIndex: activePendingSameEmail.chunkIndex }];
      }
      const existingRefs = new Set(activePendingSameEmail.scans.map((s) => getScanRefKey(s.requestId, s.chunkIndex)));
      if (!existingRefs.has(getScanRefKey(requestId, parsedChunk))) {
        activePendingSameEmail.scans.push({ requestId, chunkIndex: parsedChunk });
        activePendingSameEmail.updatedAt = nowIso;
        linkedCount++;
      }
      continue;
    }

    queue.items.push({
      id: `${requestId}::${emailLower}`,
      email: emailLower,
      scanId: requestId,
      chunkIndex: parsedChunk,
      scans: [{ requestId, chunkIndex: parsedChunk }],
      status: 'pending',
      attempts: 0,
      maxAttempts: MAX_RECHECK_ATTEMPTS,
      createdAt: nowIso,
      updatedAt: nowIso,
      scheduledFor: [firstAt, secondAt],
      nextAttemptAt: firstAt,
      dispatchedAt: null,
      pendingBatchId: null,
      resolvedAt: null,
      resolvedVerdict: null,
      lastReason: extractUnknownReason(item),
      history: []
    });
    addedCount++;
  }

  queue.updatedAt = nowIso;
  return { queue, addedCount, linkedCount };
}

/**
 * Selects up to MAX_DRAIN_BATCH_SIZE (<= 25) due pending UNKNOWN items and acquires a dispatch lease.
 */
export function selectDueBatch(queueRaw, { batchId, limit = MAX_DRAIN_BATCH_SIZE, nowMs = Date.now(), forceDue = false, targetScanId = '' } = {}) {
  const queue = normalizeQueue(queueRaw, nowMs);
  const cappedLimit = Math.min(MAX_DRAIN_BATCH_SIZE, Math.max(1, Number(limit) || MAX_DRAIN_BATCH_SIZE));
  const nowIso = new Date(nowMs).toISOString();
  const scanFilter = String(targetScanId || '').trim();

  const candidates = queue.items.filter((entry) => {
    if (entry.status !== 'pending') return false;
    const attempts = Number(entry.attempts || 0);
    const maxAttempts = Math.min(MAX_RECHECK_ATTEMPTS, Number(entry.maxAttempts || MAX_RECHECK_ATTEMPTS));
    if (attempts >= maxAttempts) return false;

    if (entry.dispatchedAt) {
      const leaseMs = Date.parse(entry.dispatchedAt);
      if (Number.isFinite(leaseMs) && nowMs - leaseMs < DISPATCH_LEASE_MS) return false;
    }

    if (scanFilter) {
      const matchesScan =
        entry.scanId === scanFilter ||
        (Array.isArray(entry.scans) && entry.scans.some((s) => s.requestId === scanFilter));
      if (!matchesScan) return false;
    }

    if (forceDue) return true;
    const dueMs = Date.parse(entry.nextAttemptAt || '');
    return Number.isFinite(dueMs) && dueMs <= nowMs;
  });

  // Oldest due items first
  candidates.sort((a, b) => Date.parse(a.nextAttemptAt || a.createdAt || '') - Date.parse(b.nextAttemptAt || b.createdAt || ''));

  const selectedItems = [];
  const selectedEmails = [];
  const seenEmails = new Set();

  for (const entry of candidates) {
    if (selectedEmails.length >= cappedLimit) break;
    if (seenEmails.has(entry.email)) continue;
    seenEmails.add(entry.email);
    entry.dispatchedAt = nowIso;
    entry.pendingBatchId = batchId;
    entry.updatedAt = nowIso;
    selectedItems.push(entry);
    selectedEmails.push(entry.email);
  }

  queue.updatedAt = nowIso;
  return {
    queue,
    batch: {
      batchId,
      createdAt: nowIso,
      emails: selectedEmails,
      itemIds: selectedItems.map((i) => i.id)
    }
  };
}

function getScanResultFilePath(repoDir, scanRef) {
  const { requestId, chunkIndex } = scanRef;
  if (chunkIndex !== null && chunkIndex !== undefined && String(chunkIndex).trim() !== '') {
    return path.join(repoDir, 'results', requestId, `chunk-${chunkIndex}.json`);
  }
  return path.join(repoDir, 'results', `${requestId}.json`);
}

function toCanonicalVerdict(isReachable) {
  const v = String(isReachable || 'unknown').toLowerCase();
  if (v === 'safe') return 'SAFE';
  if (v === 'risky') return 'RISKY';
  if (v === 'invalid') return 'INVALID';
  return 'UNKNOWN';
}

/**
 * Applies probe results from a completed re-check batch back into queue.json and updates
 * all linked stored scan files in place on the results branch.
 */
export function applyBatchResults(queueRaw, { repoDir, batchId, probeResults = [], nowMs = Date.now() }) {
  const queue = normalizeQueue(queueRaw, nowMs);
  const nowIso = new Date(nowMs).toISOString();

  const resultByEmail = new Map();
  for (const r of Array.isArray(probeResults) ? probeResults : []) {
    const em = String(r?.input || '').trim().toLowerCase();
    if (em) resultByEmail.set(em, r);
  }

  const batchMetaPath = repoDir ? path.join(repoDir, BATCHES_RELATIVE_DIR, `${batchId}.json`) : null;
  const batchMeta = batchMetaPath ? readJsonSafe(batchMetaPath, null) : null;
  const batchItemIds = new Set(Array.isArray(batchMeta?.itemIds) ? batchMeta.itemIds : []);

  let resolvedCount = 0;
  let updatedCount = 0;
  let exhaustedCount = 0;
  const dirtyFiles = new Map(); // filePath -> array

  const loadResultArray = (filePath) => {
    if (dirtyFiles.has(filePath)) return dirtyFiles.get(filePath);
    const parsed = readJsonSafe(filePath, null);
    if (!parsed) return null;
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    dirtyFiles.set(filePath, arr);
    return arr;
  };

  for (const entry of queue.items) {
    const belongsToBatch = entry.pendingBatchId === batchId || batchItemIds.has(entry.id);
    if (!belongsToBatch) continue;

    // Discipline: never exceed 2 attempts or mutate already resolved/exhausted entries
    if (entry.status !== 'pending' || Number(entry.attempts || 0) >= MAX_RECHECK_ATTEMPTS) {
      entry.dispatchedAt = null;
      entry.pendingBatchId = null;
      continue;
    }

    const probeResult = resultByEmail.get(entry.email);
    if (!probeResult) {
      entry.dispatchedAt = null;
      entry.pendingBatchId = null;
      continue;
    }

    const verdict = toCanonicalVerdict(probeResult.is_reachable);
    const isResolved = verdict !== 'UNKNOWN';

    entry.attempts = Number(entry.attempts || 0) + 1;
    entry.dispatchedAt = null;
    entry.pendingBatchId = null;
    entry.updatedAt = nowIso;
    entry.lastReason = isResolved
      ? `Resolved as ${verdict} on automatic re-check #${entry.attempts}`
      : extractUnknownReason(probeResult);

    if (!Array.isArray(entry.history)) entry.history = [];
    entry.history.push({
      attempt: entry.attempts,
      checkedAt: nowIso,
      verdict,
      resolved: isResolved,
      recheckRequestId: batchId,
      reason: entry.lastReason
    });

    if (isResolved) {
      entry.status = 'resolved';
      entry.resolvedAt = nowIso;
      entry.resolvedVerdict = verdict;
      entry.nextAttemptAt = null;
      resolvedCount++;
    } else if (entry.attempts >= Math.min(MAX_RECHECK_ATTEMPTS, Number(entry.maxAttempts || MAX_RECHECK_ATTEMPTS))) {
      entry.status = 'exhausted';
      entry.nextAttemptAt = null;
      exhaustedCount++;
    } else {
      entry.status = 'pending';
      const fallbackSecond = new Date(Date.parse(entry.createdAt || nowIso) + SECOND_RECHECK_DELAY_MS).toISOString();
      entry.nextAttemptAt = (Array.isArray(entry.scheduledFor) && entry.scheduledFor[1]) || fallbackSecond;
    }
    updatedCount++;

    if (repoDir) {
      const scanRefs = Array.isArray(entry.scans) && entry.scans.length > 0
        ? entry.scans
        : [{ requestId: entry.scanId, chunkIndex: entry.chunkIndex }];

      for (const scanRef of scanRefs) {
        const targetPath = getScanResultFilePath(repoDir, scanRef);
        const arr = loadResultArray(targetPath);
        if (!arr) continue;

        for (let i = 0; i < arr.length; i++) {
          const row = arr[i];
          if (String(row?.input || '').trim().toLowerCase() !== entry.email) continue;

          // Never downgrade an already definitive verdict in storage
          const prevReachable = String(row.is_reachable || 'unknown').toLowerCase();
          if (prevReachable !== 'unknown' && !row.recheck?.resolved) continue;

          const recheckMeta = {
            status: entry.status,
            attempts: entry.attempts,
            maxAttempts: entry.maxAttempts,
            resolved: isResolved,
            resolvedAt: entry.resolvedAt,
            initialVerdict: row.recheck?.initialVerdict || 'UNKNOWN',
            verdict,
            nextAttemptAt: entry.nextAttemptAt,
            lastCheckedAt: nowIso,
            recheckRequestId: batchId
          };

          if (isResolved) {
            arr[i] = {
              ...probeResult,
              input: row.input || probeResult.input,
              debug: {
                ...(probeResult.debug || {}),
                initial_verdict: 'unknown',
                resolved_on_recheck: true,
                recheck_resolved_at: nowIso,
                recheck_attempts: entry.attempts
              },
              recheck: recheckMeta
            };
          } else {
            arr[i] = {
              ...row,
              smtp: probeResult.smtp || row.smtp,
              mx: probeResult.mx || row.mx,
              debug: {
                ...(row.debug || {}),
                ...(probeResult.debug || {}),
                recheck_attempts: entry.attempts
              },
              recheck: recheckMeta
            };
          }
        }
      }
    }
  }

  if (repoDir) {
    for (const [filePath, arr] of dirtyFiles.entries()) {
      writeJsonAtomic(filePath, arr);
    }
  }

  queue.updatedAt = nowIso;
  return { queue, updatedCount, resolvedCount, exhaustedCount, updatedFileCount: dirtyFiles.size };
}

function parseCliArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[k] = 'true';
      } else {
        args[k] = next;
        i++;
      }
    }
  }
  return args;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]).endsWith('recheck-queue.mjs');
if (isCli) {
  const [cmd, ...rest] = process.argv.slice(2);
  const opts = parseCliArgs(rest);
  const repoDir = path.resolve(opts['repo-dir'] || '.');
  const queuePath = path.join(repoDir, QUEUE_RELATIVE_PATH);

  if (cmd === 'enqueue') {
    const requestId = opts['request-id'];
    const chunkIndex = opts['chunk-index'] || '';
    const resultsFile = opts.results;
    if (!requestId || !resultsFile) {
      console.error('usage: recheck-queue.mjs enqueue --request-id <id> [--chunk-index <n>] --results <result.json> [--repo-dir <dir>]');
      process.exit(2);
    }
    const probeResults = readJsonSafe(resultsFile, []);
    const currentQueue = readJsonSafe(queuePath, { version: 1, items: [] });
    const { queue, addedCount, linkedCount } = enqueueUnknowns(currentQueue, {
      requestId,
      chunkIndex,
      results: probeResults
    });
    if (addedCount > 0 || linkedCount > 0 || fs.existsSync(queuePath)) {
      writeJsonAtomic(queuePath, queue);
    }
    console.log(`recheck-queue enqueue: added=${addedCount} linked=${linkedCount} total=${queue.items.length}`);
  } else if (cmd === 'select') {
    const batchId = opts.batch;
    if (!batchId) {
      console.error('usage: recheck-queue.mjs select --batch <batchId> [--limit 25] [--force-due true] [--scan-id <id>] [--repo-dir <dir>] [--out-emails <file>]');
      process.exit(2);
    }
    const currentQueue = readJsonSafe(queuePath, { version: 1, items: [] });
    const { queue, batch } = selectDueBatch(currentQueue, {
      batchId,
      limit: Number(opts.limit || MAX_DRAIN_BATCH_SIZE),
      forceDue: opts['force-due'] === 'true',
      targetScanId: opts['scan-id'] || ''
    });
    if (batch.emails.length > 0) {
      writeJsonAtomic(queuePath, queue);
      writeJsonAtomic(path.join(repoDir, BATCHES_RELATIVE_DIR, `${batchId}.json`), batch);
    }
    if (opts['out-emails']) {
      fs.writeFileSync(opts['out-emails'], batch.emails.join('\n'));
    }
    console.log(`recheck-queue select: batch=${batchId} selected=${batch.emails.length}`);
  } else if (cmd === 'apply') {
    const batchId = opts.batch;
    const resultsFile = opts.results;
    if (!batchId || !resultsFile) {
      console.error('usage: recheck-queue.mjs apply --batch <batchId> --results <result.json> [--repo-dir <dir>]');
      process.exit(2);
    }
    const probeResults = readJsonSafe(resultsFile, []);
    const currentQueue = readJsonSafe(queuePath, { version: 1, items: [] });
    const summary = applyBatchResults(currentQueue, {
      repoDir,
      batchId,
      probeResults
    });
    writeJsonAtomic(queuePath, summary.queue);
    if (fs.existsSync(resultsFile)) {
      writeJsonAtomic(path.join(repoDir, BATCHES_RELATIVE_DIR, `${batchId}-result.json`), probeResults);
    }
    console.log(
      `recheck-queue apply: updated=${summary.updatedCount} resolved=${summary.resolvedCount} exhausted=${summary.exhaustedCount} files=${summary.updatedFileCount}`
    );
  } else {
    console.error('Unknown command. Expected enqueue | select | apply');
    process.exit(2);
  }
}
