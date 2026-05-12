import { parsePhoneNumberWithError, CountryCode } from 'libphonenumber-js';
import { ProcessedContact } from '../types';

/**
 * Clean text: trim, remove extra spaces, and enforce Proper Title Case
 */
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
      // Handle double-barreled names and special suffixes
      if (txt.includes('-')) {
        return txt.replace(/(?:^|-)[a-z]/g, match => match.toUpperCase());
      }
      // Handle Irish/Scottish names (O', Mc, Mac)
      if (/^(O'|Mc|Mac)/i.test(txt)) {
        if (txt.toLowerCase().startsWith("mc")) return "Mc" + txt.charAt(2).toUpperCase() + txt.slice(3);
        if (txt.toLowerCase().startsWith("mac")) return "Mac" + txt.charAt(3).toUpperCase() + txt.slice(4);
        if (txt.toLowerCase().startsWith("o'")) return "O'" + txt.charAt(2).toUpperCase() + txt.slice(3);
      }
      return txt.charAt(0).toUpperCase() + txt.slice(1);
    });
  }
  
  return cleaned;
};

/**
 * Attempt to format a phone number with country code - Always ensuring + sign
 */
const phoneCache = new Map<string, string>();

export const formatPhone = (phone: string, country?: string, forcePlus: boolean = true): string => {
  let raw = String(phone).trim();
  let cleaned = raw.replace(/\D/g, '');
  if (!cleaned) return '';

  const cacheKey = `${raw}-${country || ''}-${forcePlus}`;
  if (phoneCache.has(cacheKey)) return phoneCache.get(cacheKey)!;

  let formatted = '';
  if (raw.startsWith('+')) {
    try {
      const parsed = parsePhoneNumberWithError(raw);
      formatted = parsed.format('E164');
    } catch {
      formatted = '+' + cleaned;
    }
  } else {
    try {
      const countryCode = (country?.toUpperCase().slice(0, 2) || 'US') as CountryCode;
      const parsed = parsePhoneNumberWithError(cleaned, countryCode);
      formatted = parsed.format('E164');
    } catch {
      if (cleaned.startsWith('00')) {
        formatted = '+' + cleaned.slice(2);
      } else {
        formatted = '+' + cleaned;
      }
    }
  }

  // Final cleanup to ensure absolutely NO spaces or special characters in the identity string
  formatted = formatted.replace(/[\s\(\)\-\.]/g, '');

  if (forcePlus && !formatted.startsWith('+')) {
    formatted = '+' + formatted.replace(/\D/g, '');
  }

  phoneCache.set(cacheKey, formatted);
  if (phoneCache.size > 10000) phoneCache.clear();

  return formatted;
};

/**
 * Advanced Email Auto-Correction (v10.0 Engine)
 * Strips spaces, fixes missing @ signs, and corrects common TLD typos.
 */
export const autoCorrectEmail = (email: string): string => {
  let cleaned = String(email || '').toLowerCase().trim();
  
  // 1. Strip all hidden spaces/characters
  cleaned = cleaned.normalize("NFC").replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF\s]/g, "");
  
  if (!cleaned) return '';

  // 2. TLD Typo Corrections
  // 2. TLD Typo Corrections via fast Regex match
  const typoRegex = /\.(cm|con|cpm|copm|coom|comm|com\.com)$/;
  if (typoRegex.test(cleaned)) {
    cleaned = cleaned.replace(typoRegex, '.com');
  } else if (cleaned.endsWith('.net.net')) {
    cleaned = cleaned.replace('.net.net', '.net');
  } else if (cleaned.endsWith('.org.org')) {
    cleaned = cleaned.replace('.org.org', '.org');
  } else {
    // Specific domain typos
    const domainTypos: Record<string, string> = {
      'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.co': 'gmail.com',
      'yahho.com': 'yahoo.com', 'yaho.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com',
      'outlok.com': 'outlook.com'
    };
    
    // Instead of iterating through all entries, extract domain and check directly if possible
    const parts = cleaned.split('@');
    if (parts.length > 1) {
      const domain = parts[parts.length - 1];
      if (domainTypos[domain]) {
        cleaned = parts.slice(0, -1).join('@') + '@' + domainTypos[domain];
      }
    }
  }

  // 3. Missing dot before com (e.g. @gmailcom -> @gmail.com)
  if (cleaned.endsWith('gmailcom')) cleaned = cleaned.replace('gmailcom', 'gmail.com');
  if (cleaned.endsWith('yahoocom')) cleaned = cleaned.replace('yahoocom', 'yahoo.com');
  if (cleaned.endsWith('hotmailcom')) cleaned = cleaned.replace('hotmailcom', 'hotmail.com');
  if (cleaned.endsWith('outlookcom')) cleaned = cleaned.replace('outlookcom', 'outlook.com');
  if (cleaned.endsWith('aolcom')) cleaned = cleaned.replace('aolcom', 'aol.com');
  if (cleaned.endsWith('icloudcom')) cleaned = cleaned.replace('icloudcom', 'icloud.com');

  // 5. Missing @ sign for major providers (if it just says johndoegmail.com without @)
  const majorProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
  if (!cleaned.includes('@')) {
    for (const provider of majorProviders) {
      if (cleaned.endsWith(provider) && cleaned.length > provider.length) {
        cleaned = cleaned.slice(0, -provider.length) + '@' + provider;
        break;
      }
    }
  }

  return cleaned;
};

/**
 * Process the entire list with strict filtration via the Backend Enterprise Engine
 */
/**
 * Persistent Client-Side Verification Cache (v12.5 Elite Stability)
 * Stores definitive results to ensure 100% consistency across runs.
 */
const PERSISTENT_CACHE_KEY = 'LP_VERIFICATION_CACHE_V2.5';

const getPersistentCache = (): Record<string, any> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PERSISTENT_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveToPersistentCache = (email: string, result: any) => {
  if (typeof window === 'undefined') return;
  try {
    // Only cache definitive results (Safe or Rejected)
    if (result.verificationStatus === 'unknown' || result.subStatus === 'timeout') return;
    
    const cache = getPersistentCache();
    cache[email.toLowerCase()] = {
      ...result,
      cachedAt: Date.now()
    };
    
    // Prune old entries if cache is too large
    const keys = Object.keys(cache);
    if (keys.length > 20000) {
      delete cache[keys[0]];
    }
    
    localStorage.setItem(PERSISTENT_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('[CACHE] Persistence failed:', err);
  }
};

export const processContacts = async (
  data: any[],
  mappings: any,
  rules: any,
  onProgress?: (progress: number, logMessage?: string) => void,
  signal?: AbortSignal
): Promise<{ valid: any[]; eliminated: any[]; stats: any }> => {
  const persistentCache = getPersistentCache();
  
  // Create a deep-freeze reference map to prevent ANY data mixing
  const originalRowsMap = new Map<number, any>();
  const workItems: { id: number, email: string, isDuplicate: boolean, cachedResult?: any }[] = [];
  const seenEmails = new Map<string, number>();

  const stats = {
    totalInput: data.length,
    sanitizedRows: 0,
    emptyIdentities: 0,
    duplicateEntries: 0,
    invalidSyntax: 0,
    dnsFailure: 0,
    disposableMatch: 0,
    roleBasedMatch: 0,
    catchAllMatch: 0,
    toxicPatternMatch: 0,
    greylistedMatch: 0,
    highBounceRisk: 0,
    verifiedLeads: 0
  };

  // Stage 1: Immutable Identity Mapping
  data.forEach((row, index) => {
    if (!row || typeof row !== 'object') {
      stats.sanitizedRows++;
      return;
    }

    const emailKey = mappings.emailKey;
    let rawEmail = String(row[emailKey] || '').toLowerCase().trim();
    rawEmail = autoCorrectEmail(rawEmail);

    if (!rawEmail) {
      stats.emptyIdentities++;
      return;
    }

    // Store original row in the immutable map
    originalRowsMap.set(index, row);

    if (seenEmails.has(rawEmail)) {
      stats.duplicateEntries++;
      workItems.push({ id: index, email: rawEmail, isDuplicate: true });
      return;
    }

    seenEmails.set(rawEmail, index);
    
    // Check Cache
    const cached = persistentCache[rawEmail];
    workItems.push({ id: index, email: rawEmail, isDuplicate: false, cachedResult: cached });
  });

  const uniqueItemsToVerify = workItems.filter(item => !item.isDuplicate && !item.cachedResult);
  const total = uniqueItemsToVerify.length;
  
  const validResults = new Map<number, any>();
  const eliminatedResults = new Map<number, any>();

  // Process Cached Items
  workItems.forEach(item => {
    if (item.cachedResult) {
      const res = item.cachedResult;
      const isSafe = res.verificationStatus === 'safe' || res.verificationStatus === 'verified';
      if (isSafe) {
        stats.verifiedLeads++;
        validResults.set(item.id, res);
      } else {
        eliminatedResults.set(item.id, { ...res, reason: res.verificationReason });
      }
    } else if (item.isDuplicate) {
      eliminatedResults.set(item.id, { verificationStatus: 'rejected', reason: 'Deterministic Protocol: Duplicate Identity Suppressed' });
    }
  });

  // Stage 2: Batch Processing
  const BATCH_SIZE = 40;
  const CONCURRENT_BATCHES = 2;
  const batches = [];
  for (let i = 0; i < uniqueItemsToVerify.length; i += BATCH_SIZE) {
    batches.push(uniqueItemsToVerify.slice(i, i + BATCH_SIZE));
  }

  const processBatch = async (chunk: typeof workItems) => {
    if (signal?.aborted) return;
    const emails = chunk.map(item => item.email);
    
    try {
      const response = await fetch('/api/validate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, options: rules }),
        signal
      });

      if (response.ok) {
        const { results } = await response.json();
        results.forEach((res: any, idx: number) => {
          const item = chunk[idx];
          const isSafe = res.verificationStatus === 'safe' || res.verificationStatus === 'verified';
          
          if (res.verificationStatus === 'unknown' || res.subStatus === 'timeout') {
            item.__needsRetry = true;
            return;
          }

          saveToPersistentCache(item.email, res);
          if (isSafe) {
            stats.verifiedLeads++;
            validResults.set(item.id, res);
          } else {
            eliminatedResults.set(item.id, { ...res, reason: res.verificationReason });
          }
        });
      }
    } catch (err) {
      chunk.forEach(item => { item.__needsRetry = true; });
    }
  };

  for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
    if (signal?.aborted) break;
    const concurrentChunk = batches.slice(i, i + CONCURRENT_BATCHES);
    await Promise.all(concurrentChunk.map(b => processBatch(b)));
    if (onProgress) onProgress(Math.min(95, Math.round(((i + CONCURRENT_BATCHES) / batches.length) * 100)));
  }

  // Stage 3: Final Elite Recovery
  const retryLeads = uniqueItemsToVerify.filter(item => item.__needsRetry);
  if (retryLeads.length > 0 && !signal?.aborted) {
    const RETRY_BATCH_SIZE = 10;
    for (let i = 0; i < retryLeads.length; i += RETRY_BATCH_SIZE) {
      if (signal?.aborted) break;
      const chunk = retryLeads.slice(i, i + RETRY_BATCH_SIZE);
      await processBatch(chunk);
    }
  }

  // Final Elimination for anything still missing
  uniqueItemsToVerify.forEach(item => {
    if (!validResults.has(item.id) && !eliminatedResults.has(item.id)) {
      eliminatedResults.set(item.id, { verificationStatus: 'rejected', reason: 'Permanent Uncertainty' });
    }
  });

  // Reconstruct Final Arrays - GUARANTEED NO DATA MIXING
  const finalValid: any[] = [];
  const finalEliminated: any[] = [];

  // Sort by original index to preserve Excel order perfectly
  const allIndices = Array.from(originalRowsMap.keys()).sort((a, b) => a - b);
  
  allIndices.forEach(idx => {
    const originalRow = originalRowsMap.get(idx);
    if (validResults.has(idx)) {
      const res = validResults.get(idx);
      // Data Enhancement: ONLY update the specific mapped fields, leave everything else untouched
      const enhancedRow = { ...originalRow };
      if (mappings.firstNameKey) enhancedRow[mappings.firstNameKey] = cleanText(originalRow[mappings.firstNameKey], rules.strictTitleCase);
      if (mappings.lastNameKey) enhancedRow[mappings.lastNameKey] = cleanText(originalRow[mappings.lastNameKey], rules.strictTitleCase);
      if (mappings.nameKey) enhancedRow[mappings.nameKey] = cleanText(originalRow[mappings.nameKey], rules.strictTitleCase);
      if (mappings.phoneKey) enhancedRow[mappings.phoneKey] = formatPhone(originalRow[mappings.phoneKey], originalRow[mappings.countryKey], rules.forcePlusSign);

      finalValid.push({
        ...res,
        ...enhancedRow,
        __originalData: originalRow,
        __enhancedData: enhancedRow
      });
    } else {
      const res = eliminatedResults.get(idx) || { reason: 'Unknown Filter' };
      finalEliminated.push({
        ...originalRow,
        ...res,
        status: res.verificationStatus || 'rejected',
        __originalData: originalRow
      });
    }
  });

  return {
    valid: finalValid,
    eliminated: finalEliminated,
    stats: { ...stats, totalProcessed: data.length, timestamp: new Date().toISOString() }
  };
};

/**
 * Single Email Verification Wrapper (for SingleValidation.tsx UI component)
 * Preserves the exact original signature but routes through the new enterprise backend.
 */
export const verifyEmail = async (
  email: string,
  options: {
    excludeDisposable: boolean;
    excludeRoleBased: boolean;
    excludeCatchAll: boolean;
    excludeSpamTraps: boolean;
  }
): Promise<Partial<ProcessedContact>> => {
  const clean = String(email || '').toLowerCase().trim();
  
  if (!clean) {
    return {
      verificationStatus: 'blocked',
      verificationReason: 'Fatal Syntax: Impossible Identity Structure',
      subStatus: 'invalid_syntax',
      confidenceScore: 0,
      bounceRisk: 'Dangerous',
      reputationImpact: 'Critical',
      mxRecordFound: false,
      isCatchAll: false,
      isDisposable: false,
      isRoleBased: false,
      isFreeEmail: false,
      provider: 'Unknown',
      smtpValid: false,
      syntaxValid: false,
      email: clean
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9500);

    const response = await fetch('/api/validate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emails: [clean],
        options
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const { results } = await response.json();
    return results[0] as Partial<ProcessedContact>;
  } catch (err: any) {
    console.error('[SINGLE_VALIDATION_ERROR]', err);
    return {
      verificationStatus: 'risky',
      verificationReason: `Network/Timeout Failure: ${err.message}`,
      subStatus: 'timeout',
      confidenceScore: 50,
      bounceRisk: 'Medium',
      reputationImpact: 'Neutral',
      mxRecordFound: false,
      isCatchAll: false,
      isDisposable: false,
      isRoleBased: false,
      isFreeEmail: false,
      provider: 'Unknown',
      smtpValid: false,
      syntaxValid: false,
      email: clean
    };
  }
};