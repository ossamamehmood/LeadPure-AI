import { parsePhoneNumberWithError, CountryCode } from 'libphonenumber-js';
import { ProcessedContact, ValidationRules } from '../types';

export interface BulkProgressUpdate {
  progress: number;
  logMessage?: string;
  emailsDone?: number;
  emailsTotal?: number;
  chunksDone?: number;
  chunksTotal?: number;
  etaSeconds?: number | null;
  requestId?: string;
  validSnapshot?: ProcessedContact[];
  eliminatedSnapshot?: any[];
}

export interface SavedScanState {
  requestId: string;
  fileName: string;
  startedAt: string;
  totalRows: number;
  emails: string[];
  mappings: any;
  rules: ValidationRules;
  rows?: any[];
}

export const LAST_SCAN_STORAGE_KEY = 'leadpure_last_scan_v14';

export function saveScanState(state: SavedScanState) {
  try {
    const serialized = JSON.stringify(state);
    if (serialized.length < 3_500_000) {
      localStorage.setItem(LAST_SCAN_STORAGE_KEY, serialized);
    } else {
      // If original rows with extra columns are huge, save minimal resume payload
      const minimal: SavedScanState = { ...state, rows: undefined };
      localStorage.setItem(LAST_SCAN_STORAGE_KEY, JSON.stringify(minimal));
    }
  } catch (e) {
    console.warn('[STORAGE] Unable to persist scan state:', e);
  }
}

export function loadSavedScanState(): SavedScanState | null {
  try {
    const raw = localStorage.getItem(LAST_SCAN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.requestId === 'string' && Array.isArray(parsed.emails)) {
      return parsed;
    }
  } catch {}
  return null;
}

export function clearSavedScanState() {
  try {
    localStorage.removeItem(LAST_SCAN_STORAGE_KEY);
  } catch {}
}

export const cleanText = (text: string | any, applyTitleCase: boolean = true): string => {
  if (typeof text !== 'string') return String(text || '').trim();
  let cleaned = text.trim().replace(/\s+/g, ' ');

  if (cleaned.length > 0 && applyTitleCase) {
    const lower = cleaned.toLowerCase();
    const normalizationMap: Record<string, string> = {
      'florida': 'FL', 'illinois': 'IL', 'california': 'CA', 'new york': 'NY',
      'texas': 'TX', 'virginia': 'VA', 'virgenia': 'VA', 'georgia': 'GA',
      'ontario': 'ON', 'british columbia': 'BC', 'quebec': 'QC'
    };
    if (normalizationMap[lower]) return normalizationMap[lower];

    cleaned = lower.replace(/\w\S*/g, (txt) => {
      if (txt.includes('-')) {
        return txt.replace(/(?:^|-)[a-z]/g, match => match.toUpperCase());
      }
      if (/^(O'|Mc|Mac)/i.test(txt)) {
        if (txt.toLowerCase().startsWith('mc')) return 'Mc' + txt.charAt(2).toUpperCase() + txt.slice(3);
        if (txt.toLowerCase().startsWith('mac')) return 'Mac' + txt.charAt(3).toUpperCase() + txt.slice(4);
        if (txt.toLowerCase().startsWith("o'")) return "O'" + txt.charAt(2).toUpperCase() + txt.slice(3);
      }
      return txt.charAt(0).toUpperCase() + txt.slice(1);
    });
  }

  return cleaned;
};

const phoneCache = new Map<string, string>();

export const formatPhone = (phone: string, country?: string, forcePlus: boolean = true): string => {
  const raw = String(phone).trim();
  const cleaned = raw.replace(/\D/g, '');
  if (!cleaned) return '';

  const cacheKey = `${raw}-${country || ''}-${forcePlus}`;
  if (phoneCache.has(cacheKey)) return phoneCache.get(cacheKey)!;

  let formatted = '';
  if (raw.startsWith('+')) {
    try {
      const parsed = parsePhoneNumberWithError(raw);
      formatted = parsed.format('E.164');
    } catch {
      formatted = '+' + cleaned;
    }
  } else {
    try {
      const countryCode = (country?.toUpperCase().slice(0, 2) || 'US') as CountryCode;
      const parsed = parsePhoneNumberWithError(cleaned, countryCode);
      formatted = parsed.format('E.164');
    } catch {
      formatted = cleaned.startsWith('00') ? '+' + cleaned.slice(2) : '+' + cleaned;
    }
  }

  formatted = formatted.replace(/[\s\(\)\-\.]/g, '');
  if (forcePlus && !formatted.startsWith('+')) {
    formatted = '+' + formatted.replace(/\D/g, '');
  }

  phoneCache.set(cacheKey, formatted);
  if (phoneCache.size > 10000) phoneCache.clear();
  return formatted;
};

export const autoCorrectEmail = (email: string): string => {
  let cleaned = String(email || '').toLowerCase().trim();
  cleaned = cleaned.normalize('NFC').replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF\s]/g, '');
  if (!cleaned) return '';

  const typoRegex = /\.(cm|con|cpm|copm|coom|comm|com\.com)$/;
  if (typoRegex.test(cleaned)) {
    cleaned = cleaned.replace(typoRegex, '.com');
  } else if (cleaned.endsWith('.net.net')) {
    cleaned = cleaned.replace('.net.net', '.net');
  } else if (cleaned.endsWith('.org.org')) {
    cleaned = cleaned.replace('.org.org', '.org');
  }

  return cleaned;
};

export const processContacts = async (
  data: any[],
  mappings: any,
  rules: ValidationRules,
  onProgress?: (update: BulkProgressUpdate) => void,
  signal?: AbortSignal,
  resumeContext?: { requestId: string; fileName: string },
  uploadFileName?: string
): Promise<{
  valid: ProcessedContact[];
  eliminated: any[];
  stats: any;
  timedOut: boolean;
  failedChunkCount?: number;
  failureMessage?: string | null;
  requestId?: string;
}> => {
  console.log(`[PROCESSOR_V14.0.0] Initializing verification scan (${data.length} input rows).`);

  const stats = {
    totalInput: data.length,
    sanitizedRows: 0,
    emptyIdentities: 0,
    duplicateEntries: 0,
    arrivedCount: 0,
    safeCount: 0,
    riskyCount: 0,
    invalidCount: 0,
    unknownCount: 0,
    timedOutMissingCount: 0,
    catchAllMatch: 0,
    disposableMatch: 0,
    roleBasedMatch: 0,
    verifiedLeads: 0
  };

  // Stage 1: Prepare unique email identities (preserving original row mapping)
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const preProcessedData: any[] = [];
  const emailsToVerify: string[] = [];

  data.forEach((item) => {
    if (!item || typeof item !== 'object') {
      stats.sanitizedRows++;
      return;
    }

    const emailKey = mappings.emailKey;
    const rawEmail = autoCorrectEmail(String(item[emailKey] || ''));

    if (!rawEmail) {
      stats.emptyIdentities++;
      return;
    }

    if (seenEmails.has(rawEmail)) {
      stats.duplicateEntries++;
      return;
    }

    const phoneKey = mappings.phoneKey;
    if (phoneKey) {
      const rawPhone = String(item[phoneKey] || '').trim();
      if (rawPhone) {
        const normalizedPhone = formatPhone(rawPhone, item[mappings.countryKey], rules.forcePlusSign);
        if (normalizedPhone && seenPhones.has(normalizedPhone)) {
          stats.duplicateEntries++;
          return;
        }
        if (normalizedPhone) seenPhones.add(normalizedPhone);
      }
    }

    seenEmails.add(rawEmail);
    preProcessedData.push(item);
    emailsToVerify.push(rawEmail);
  });

  const total = preProcessedData.length;
  if (total === 0) {
    return {
      valid: [],
      eliminated: [],
      stats: { ...stats, definitiveRate: 0, finalDeliverable: 0, finalFiltered: 0 },
      timedOut: false
    };
  }

  if (total > 5000) {
    throw new Error(`Unique email count (${total}) exceeds 5,000 limit per scan.`);
  }

  // Split into 100-email chunks
  const CHUNK_SIZE = 100;
  const chunkSlices: string[][] = [];
  for (let i = 0; i < total; i += CHUNK_SIZE) {
    chunkSlices.push(emailsToVerify.slice(i, i + CHUNK_SIZE));
  }
  const chunkCount = chunkSlices.length;

  let reqId = resumeContext?.requestId || '';
  const dispatchedChunks = new Set<number>();
  const chunkDispatchedAt = new Map<number, number>();
  const fetchedChunks = new Set<number>();
  const failedChunks = new Map<number, string>();
  const chunkResultsMap = new Map<number, any[]>();
  const PER_CHUNK_TIMEOUT_MS = 360_000; // 6 minutes per 100-email batch

  if (!resumeContext) {
    if (onProgress) {
      onProgress({
        progress: 2,
        emailsDone: 0,
        emailsTotal: total,
        chunksDone: 0,
        chunksTotal: chunkCount,
        etaSeconds: null,
        logMessage: `Initializing ${chunkCount} chunk(s) (${total} unique emails)...`
      });
    }

    const initRes = await fetch('/api/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'init_bulk', emails: emailsToVerify }),
      signal
    });

    if (!initRes.ok) {
      throw new Error(`Dispatch endpoint returned HTTP ${initRes.status}`);
    }

    const initData = await initRes.json();
    if (initData.status === 'failed' || initData.status === 'error' || !initData.requestId) {
      throw new Error(initData.ui_reason || initData.error || 'Failed to dispatch bulk verification');
    }

    reqId = initData.requestId;
    const initTime = Date.now();
    (initData.dispatchedChunks || [0]).forEach((idx: number) => {
      dispatchedChunks.add(idx);
      chunkDispatchedAt.set(idx, initTime);
    });

    saveScanState({
      requestId: reqId,
      fileName: uploadFileName || 'LeadPure_Upload.csv',
      startedAt: new Date().toISOString(),
      totalRows: total,
      emails: emailsToVerify,
      mappings,
      rules,
      rows: preProcessedData
    });
  } else {
    if (onProgress) {
      onProgress({
        progress: 5,
        emailsDone: 0,
        emailsTotal: total,
        chunksDone: 0,
        chunksTotal: chunkCount,
        etaSeconds: null,
        requestId: reqId,
        logMessage: `Resuming scan ${reqId} from manifest...`
      });
    }
  }

  // Helper to assemble current arrived rows without any timeout fallback
  const buildArrivedSnapshots = () => {
    const validSnap: ProcessedContact[] = [];
    const eliminatedSnap: any[] = [];
    let safeCount = 0;
    let riskyCount = 0;
    let invalidCount = 0;
    let unknownCount = 0;
    let catchAllMatch = 0;
    let disposableMatch = 0;
    let roleBasedMatch = 0;
    let arrivedCount = 0;

    for (let cIdx = 0; cIdx < chunkCount; cIdx++) {
      const chunkRes = chunkResultsMap.get(cIdx);
      if (!chunkRes) continue;
      const baseIndex = cIdx * CHUNK_SIZE;

      chunkRes.forEach((verificationResult: any, offset: number) => {
        const globalIdx = baseIndex + offset;
        const item = preProcessedData[globalIdx];
        if (!item) return;

        arrivedCount++;
        const verdict = String(verificationResult.status || 'UNKNOWN').toUpperCase() as ProcessedContact['status'];

        if (verdict === 'SAFE') safeCount++;
        else if (verdict === 'RISKY') riskyCount++;
        else if (verdict === 'INVALID') invalidCount++;
        else unknownCount++;

        if (verificationResult.isCatchAll) catchAllMatch++;
        if (verificationResult.isDisposable) disposableMatch++;
        if (verificationResult.isRoleBased) roleBasedMatch++;

        const updatedItem = { ...item };
        if (mappings.emailKey && verificationResult.email) {
          updatedItem[mappings.emailKey] = verificationResult.email;
        }
        if (mappings.firstNameKey) updatedItem[mappings.firstNameKey] = cleanText(item[mappings.firstNameKey], rules.strictTitleCase);
        if (mappings.lastNameKey) updatedItem[mappings.lastNameKey] = cleanText(item[mappings.lastNameKey], rules.strictTitleCase);
        if (mappings.nameKey) updatedItem[mappings.nameKey] = cleanText(item[mappings.nameKey], rules.strictTitleCase);
        if (mappings.cityKey) updatedItem[mappings.cityKey] = cleanText(item[mappings.cityKey], rules.strictTitleCase);
        if (mappings.countryKey) updatedItem[mappings.countryKey] = cleanText(item[mappings.countryKey], rules.strictTitleCase);
        if (mappings.phoneKey) {
          updatedItem[mappings.phoneKey] = formatPhone(String(item[mappings.phoneKey] || ''), item[mappings.countryKey], rules.forcePlusSign);
        }
        if (mappings.postalCodeKey) {
          updatedItem[mappings.postalCodeKey] = String(item[mappings.postalCodeKey] || '').trim().toUpperCase();
        }

        const mergedRow = {
          ...verificationResult,
          ...updatedItem,
          status: verdict,
          verificationStatus: verdict.toLowerCase(),
          reason: verificationResult.verificationReason,
          originalIndex: globalIdx,
          __originalData: updatedItem
        };

        if (verdict === 'SAFE') {
          validSnap.push(mergedRow as ProcessedContact);
        } else {
          eliminatedSnap.push(mergedRow);
        }
      });
    }

    return {
      validSnap,
      eliminatedSnap,
      arrivedCount,
      safeCount,
      riskyCount,
      invalidCount,
      unknownCount,
      catchAllMatch,
      disposableMatch,
      roleBasedMatch
    };
  };

  // Poll manifest with exponential backoff (5s -> 15s cap), max 20-minute ceiling
  const startTime = Date.now();
  const MAX_WAIT_MS = 1_200_000; // 20 minutes
  let pollIntervalMs = 5000;

  while (Date.now() - startTime < MAX_WAIT_MS && !signal?.aborted) {
    let madeProgress = false;

    try {
      const mRes = await fetch(`/api/check?requestId=${encodeURIComponent(reqId)}&mode=manifest`, { signal });
      if (mRes.ok) {
        const mData = await mRes.json();
        if (mData.status === 'failed' || mData.status === 'error') {
          throw new Error(mData.ui_reason || 'Manifest polling failed');
        }

        const serverFailedChunks = mData.manifest?.failedChunks || {};
        for (const [rawIdx, reason] of Object.entries(serverFailedChunks)) {
          const fIdx = Number(rawIdx);
          if (Number.isInteger(fIdx) && !fetchedChunks.has(fIdx) && !failedChunks.has(fIdx)) {
            failedChunks.set(
              fIdx,
              String(reason || "This check didn't complete - the verification runner couldn't be reached. Please try again.")
            );
            madeProgress = true;
          }
        }

        const completedChunks: number[] = mData.manifest?.completedChunks || [];

        // Fetch every newly landed chunk
        for (const cIdx of completedChunks) {
          if (signal?.aborted) break;
          if (!fetchedChunks.has(cIdx)) {
            dispatchedChunks.add(cIdx);
            failedChunks.delete(cIdx);
            const cRes = await fetch(`/api/check?requestId=${encodeURIComponent(reqId)}&chunk=${cIdx}`, { signal });
            if (cRes.ok) {
              const cData = await cRes.json();
              if (cData.status === 'completed' && Array.isArray(cData.results)) {
                chunkResultsMap.set(cIdx, cData.results);
                fetchedChunks.add(cIdx);
                madeProgress = true;
              } else if (cData.status === 'failed' || cData.status === 'error') {
                failedChunks.set(
                  cIdx,
                  cData.ui_reason || "This check didn't complete - the verification runner couldn't be reached. Please try again."
                );
                madeProgress = true;
              }
            }
          }
        }

        // Enforce per-chunk timeout so a stalled worker fails visibly instead of blocking remaining batches
        const nowMs = Date.now();
        for (const cIdx of dispatchedChunks) {
          if (fetchedChunks.has(cIdx) || failedChunks.has(cIdx)) continue;
          const dispatchedMs = chunkDispatchedAt.get(cIdx) ?? startTime;
          if (nowMs - dispatchedMs >= PER_CHUNK_TIMEOUT_MS) {
            failedChunks.set(
              cIdx,
              "Batch timed out after 6 minutes - the verification runner couldn't be reached. Please try again."
            );
            madeProgress = true;
          }
        }

        // Maintain sliding window: max 3 concurrent chunk runs in-flight
        let inFlight = [...dispatchedChunks].filter((c) => !fetchedChunks.has(c) && !failedChunks.has(c)).length;
        for (let nextChunk = 0; nextChunk < chunkCount && inFlight < 3 && !signal?.aborted; nextChunk++) {
          if (!dispatchedChunks.has(nextChunk) && !fetchedChunks.has(nextChunk) && !failedChunks.has(nextChunk)) {
            const dRes = await fetch('/api/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'dispatch_chunk',
                requestId: reqId,
                chunkIndex: nextChunk,
                emails: chunkSlices[nextChunk]
              }),
              signal
            });
            if (dRes.ok) {
              const dData = await dRes.json();
              if (dData.status === 'failed' || dData.status === 'error') {
                failedChunks.set(
                  nextChunk,
                  dData.ui_reason || `Batch ${nextChunk + 1} failed to dispatch`
                );
                madeProgress = true;
              } else {
                dispatchedChunks.add(nextChunk);
                chunkDispatchedAt.set(nextChunk, Date.now());
                inFlight++;
              }
            } else {
              failedChunks.set(nextChunk, `Batch ${nextChunk + 1} dispatch failed (HTTP ${dRes.status})`);
              madeProgress = true;
            }
          }
        }

        const snap = buildArrivedSnapshots();
        const elapsedSec = Math.round((Date.now() - startTime) / 1000);
        const chunksDone = fetchedChunks.size;
        const chunksSettled = fetchedChunks.size + failedChunks.size;
        const pct = Math.max(5, Math.min(100, Math.round((snap.arrivedCount / total) * 100)));

        let etaSeconds: number | null = null;
        if (chunksDone > 0 && chunksSettled < chunkCount) {
          const avgSecPerChunk = elapsedSec / chunksDone;
          etaSeconds = Math.max(5, Math.round((chunkCount - chunksSettled) * avgSecPerChunk));
        }

        if (onProgress) {
          onProgress({
            progress: pct,
            emailsDone: snap.arrivedCount,
            emailsTotal: total,
            chunksDone,
            chunksTotal: chunkCount,
            etaSeconds,
            requestId: reqId,
            validSnapshot: snap.validSnap,
            eliminatedSnapshot: snap.eliminatedSnap,
            logMessage: failedChunks.size > 0 && madeProgress
              ? `Batch alert: ${failedChunks.size} batch(es) failed or timed out (${chunksDone}/${chunkCount} finished)`
              : madeProgress
                ? `Chunk ${chunksDone}/${chunkCount} received: ${snap.arrivedCount}/${total} emails verified`
                : `Polling manifest (${chunksDone}/${chunkCount} chunks, ${snap.arrivedCount}/${total} emails, ${elapsedSec}s elapsed)...`
          });
        }

        if (chunksSettled >= chunkCount) {
          break;
        }
      }
    } catch (pollErr: any) {
      if (pollErr.name === 'AbortError' || signal?.aborted) {
        throw new Error('Pipeline Aborted');
      }
      if (
        typeof pollErr?.message === 'string' &&
        (pollErr.message.includes('Manifest') || pollErr.message.includes('failed'))
      ) {
        throw pollErr;
      }
      console.warn('[BULK_MANIFEST_POLL_ERR]', pollErr);
    }

    if (signal?.aborted) {
      throw new Error('Pipeline Aborted');
    }

    // Backoff from 5s to 15s when waiting, reset to 5s on progress
    pollIntervalMs = madeProgress ? 5000 : Math.min(15000, Math.round(pollIntervalMs * 1.35));
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  if (signal?.aborted) {
    throw new Error('Pipeline Aborted');
  }

  const finalSnap = buildArrivedSnapshots();
  const timedOut = fetchedChunks.size < chunkCount;
  const failedChunkCount = failedChunks.size;
  const firstFailureReason = failedChunks.values().next().value || null;

  // Build arrived stats ONLY from chunks that landed
  stats.arrivedCount = finalSnap.arrivedCount;
  stats.safeCount = finalSnap.safeCount;
  stats.riskyCount = finalSnap.riskyCount;
  stats.invalidCount = finalSnap.invalidCount;
  stats.unknownCount = finalSnap.unknownCount;
  stats.catchAllMatch = finalSnap.catchAllMatch;
  stats.disposableMatch = finalSnap.disposableMatch;
  stats.roleBasedMatch = finalSnap.roleBasedMatch;
  stats.verifiedLeads = finalSnap.safeCount;

  // Any chunks still missing after failure or per-chunk timeout MUST NOT be stamped fake UNKNOWN.
  // Display explicitly as timed out / failed and keep excluded from counts/export.
  if (timedOut) {
    for (let cIdx = 0; cIdx < chunkCount; cIdx++) {
      if (chunkResultsMap.has(cIdx)) continue;
      const chunkFailureMsg = failedChunks.get(cIdx) || 'STILL CHECKING / TIMED OUT - re-run to complete';
      const baseIndex = cIdx * CHUNK_SIZE;
      chunkSlices[cIdx].forEach((emailVal, offset) => {
        const globalIdx = baseIndex + offset;
        const item = preProcessedData[globalIdx];
        if (!item) return;
        stats.timedOutMissingCount++;
        finalSnap.eliminatedSnap.push({
          ...item,
          email: emailVal,
          status: 'STILL CHECKING / TIMED OUT - re-run to complete',
          verificationStatus: 'unknown',
          verificationReason: chunkFailureMsg,
          reason: chunkFailureMsg,
          isTimedOutMissing: true,
          originalIndex: globalIdx,
          __originalData: item
        });
      });
    }
  } else {
    clearSavedScanState();
  }

  const arrivedDefinitive = stats.safeCount + stats.riskyCount + stats.invalidCount;
  const definitiveRate = stats.arrivedCount > 0 ? Math.round((arrivedDefinitive / stats.arrivedCount) * 100) : 0;
  const failureMessage = timedOut
    ? (firstFailureReason || `${Math.max(failedChunkCount, chunkCount - fetchedChunks.size)} verification batch(es) timed out or failed`)
    : null;

  return {
    valid: finalSnap.validSnap,
    eliminated: finalSnap.eliminatedSnap,
    stats: {
      ...stats,
      definitiveRate,
      finalDeliverable: finalSnap.safeCount,
      finalFiltered: stats.riskyCount + stats.invalidCount + stats.unknownCount,
      failedChunkCount,
      failureMessage
    },
    timedOut,
    failedChunkCount,
    failureMessage,
    requestId: reqId
  };
};
