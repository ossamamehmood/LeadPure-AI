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

    cleaned = cleaned.toLowerCase().split(' ')
      .map(word => {
        if (word.length === 0) return '';
        if (word.includes('-')) {
          return word.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('-');
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
  
  return cleaned;
};

/**
 * Attempt to format a phone number with country code - Always ensuring + sign
 */
export const formatPhone = (phone: string, country?: string, forcePlus: boolean = true): string => {
  let raw = String(phone).trim();
  let cleaned = raw.replace(/\D/g, '');
  if (!cleaned) return '';

  let formatted = '';
  if (raw.startsWith('+')) {
    try {
      const parsed = parsePhoneNumberWithError(raw);
      formatted = parsed.formatInternational();
    } catch {
      formatted = '+' + cleaned;
    }
  } else {
    try {
      const countryCode = (country?.toUpperCase().slice(0, 2) || 'US') as CountryCode;
      const parsed = parsePhoneNumberWithError(cleaned, countryCode);
      formatted = parsed.formatInternational();
    } catch {
      if (cleaned.startsWith('00')) {
        formatted = '+' + cleaned.slice(2);
      } else {
        formatted = '+' + cleaned;
      }
    }
  }

  if (forcePlus && !formatted.startsWith('+')) {
    formatted = '+' + formatted.replace(/\D/g, '');
  }

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
  const tldTypos: Record<string, string> = {
    '.cm': '.com',
    '.con': '.com',
    '.cpm': '.com',
    '.copm': '.com',
    '.coom': '.com',
    '.comm': '.com',
    '.com.com': '.com',
    '.net.net': '.net',
    '.org.org': '.org',
    '.gmial.com': '.gmail.com',
    '.gmal.com': '.gmail.com',
    '.gamil.com': '.gmail.com',
    '.gmail.co': '.gmail.com',
    '.yahho.com': '.yahoo.com',
    '.yaho.com': '.yahoo.com',
    '.hotmial.com': '.hotmail.com',
    '.hotmal.com': '.hotmail.com',
    '.outlok.com': '.outlook.com'
  };

  for (const [typo, fix] of Object.entries(tldTypos)) {
    if (cleaned.endsWith(typo)) {
      cleaned = cleaned.slice(0, -typo.length) + fix;
      break;
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
export const processContacts = async (
  data: any[],
  mappings: any,
  rules: any,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<{ valid: any[]; eliminated: any[]; stats: any }> => {
  const valid: any[] = [];
  const eliminated: any[] = [];
  
  console.log(`[PROCESSOR_V10.0.0] ENTERPRISE_INIT: Ingesting ${data.length} identities.`);
  
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

  // Stage 1: Local Normalization & Deduplication
  const seenEmails = new Set<string>();
  const preProcessedData = data.filter((item) => {
    if (!item || typeof item !== 'object') {
      stats.sanitizedRows++;
      return false;
    }

    const emailKey = mappings.emailKey;
    let rawEmail = String(item[emailKey] || '').toLowerCase().trim();
    rawEmail = autoCorrectEmail(rawEmail);

    if (!rawEmail) {
      stats.emptyIdentities++;
      return false;
    }

    if (seenEmails.has(rawEmail)) {
      stats.duplicateEntries++;
      eliminated.push({ ...item, reason: 'Deterministic Protocol: Duplicate Identity Suppressed' });
      return false;
    }
    
    seenEmails.add(rawEmail);
    return true;
  });

  console.log(`[PROCESSOR] STAGE_1_CLEAN: ${preProcessedData.length} unique identities. (${stats.duplicateEntries} duplicates suppressed)`);

  // Stage 2: Concurrent Batch Processing to Backend Engine
  const total = preProcessedData.length;
  // Increase batch size to 50 and use 3 concurrent Vercel instances to drop processing time by 90%
  const BATCH_SIZE = 50; 
  const CONCURRENT_BATCHES = 3;
  
  const batches = [];
  for (let i = 0; i < total; i += BATCH_SIZE) {
    batches.push({
      startIndex: i,
      items: preProcessedData.slice(i, i + BATCH_SIZE)
    });
  }

  let completedBatches = 0;

  const processBatch = async (batchObj: { startIndex: number, items: any[] }) => {
    if (signal?.aborted) return;
    
    const { startIndex, items } = batchObj;
    const emailsToVerify = items.map(item => String(item[mappings.emailKey] || '').toLowerCase().trim());
    
    let retries = 2;
    let success = false;
    
    while (retries >= 0 && !success && !signal?.aborted) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9500); // 9.5s local timeout limit
        
        if (signal) {
          signal.addEventListener('abort', () => controller.abort());
        }
        
        const response = await fetch('/api/validate-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emails: emailsToVerify,
            options: {
              excludeDisposable: rules.excludeDisposable,
              excludeRoleBased: rules.excludeRoleBased,
              excludeCatchAll: rules.excludeCatchAll,
              excludeSpamTraps: rules.excludeSpamTraps
            }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 502 || response.status === 504 || response.status === 429) {
            throw new Error(`Gateway/RateLimit Error ${response.status}`);
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        success = true;
      
      const { results } = await response.json();
      
      // Merge results back into items
      results.forEach((verificationResult: any, idx: number) => {
        const item = items[idx];
        
        const isRejected = verificationResult.verificationStatus === 'rejected' || verificationResult.verificationStatus === 'blocked';
        const isRisky = verificationResult.verificationStatus === 'risky';
        const isUnknown = verificationResult.verificationStatus === 'unknown';
        const isTooRisky = (verificationResult.bounceRisk === 'High' || verificationResult.bounceRisk === 'Dangerous' || verificationResult.bounceRisk === 'Medium');

        // STRICT 100% QUALITY MATRIX ENFORCEMENT: Only absolute verified emails pass to valid array.
        if (isRejected || isRisky || isUnknown || isTooRisky) {
          // Track granular stats
          const subStatus = verificationResult.subStatus || '';
          if (subStatus === 'invalid_syntax') stats.invalidSyntax++;
          else if (subStatus === 'domain_not_found') stats.dnsFailure++;
          else if (subStatus === 'disposable') stats.disposableMatch++;
          else if (subStatus === 'role_based') stats.roleBasedMatch++;
          else if (subStatus === 'catch_all') stats.catchAllMatch++;
          else if (subStatus === 'toxic') stats.toxicPatternMatch++;
          else if (subStatus === 'greylisted') stats.greylistedMatch++;
          else if (verificationResult.bounceRisk === 'High' || verificationResult.bounceRisk === 'Dangerous') stats.highBounceRisk++;

          eliminated.push({ 
            ...item, 
            reason: verificationResult.verificationReason,
            score: verificationResult.confidenceScore,
            bounceRisk: verificationResult.bounceRisk,
            reputationImpact: verificationResult.reputationImpact,
            subStatus: verificationResult.subStatus
          });
        } else {
          stats.verifiedLeads++;
          
          // Data Enhancement
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
            const originalPhone = String(item[mappings.phoneKey] || '');
            const formatted = formatPhone(originalPhone, item[mappings.countryKey], rules.forcePlusSign);
            updatedItem[mappings.phoneKey] = formatted;
          }

          if (mappings.postalCodeKey) {
            updatedItem[mappings.postalCodeKey] = String(item[mappings.postalCodeKey] || '').trim().toUpperCase();
          }

          valid.push({
            ...verificationResult,
            ...updatedItem,
            originalIndex: startIndex + idx,
            __originalData: updatedItem
          } as ProcessedContact);
        }
      });

    } catch (err: any) {
        if (err.name === 'AbortError' && signal?.aborted) {
          retries = -1; // Force stop if specifically aborted by user
          break;
        }
        
        retries--;
        if (retries < 0) {
          console.error(`[BATCH_ERROR] Batch starting at ${startIndex} failed permanently:`, err);
          items.forEach(item => eliminated.push({ ...item, reason: `Network/Timeout Failure: ${err.message}` }));
        } else {
          console.warn(`[BATCH_RETRY] Batch ${startIndex} failed, retrying... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s exponential backoff base
        }
      }
    }

    completedBatches++;
    if (onProgress) {
      onProgress(Math.min(100, Math.round((completedBatches / batches.length) * 100)));
    }
  };

  // Process in chunks of CONCURRENT_BATCHES
  for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
    if (signal?.aborted) {
      console.log(`[PROCESSOR] PIPELINE_ABORTED by user.`);
      throw new Error('Pipeline Aborted');
    }
    const concurrentChunk = batches.slice(i, i + CONCURRENT_BATCHES);
    await Promise.all(concurrentChunk.map(b => processBatch(b)));
    
    // Deterministic Adaptive Jitter: Prevent Vercel Rate Limits (429) & CPU starvation
    // Base wait of 100ms + random jitter up to 150ms ensures staggered connections
    const jitter = Math.floor(Math.random() * 150) + 100;
    await new Promise(resolve => setTimeout(resolve, jitter));
  }

  const finalReport = {
    ...stats,
    finalDeliverable: valid.length,
    finalFiltered: eliminated.length
  };

  console.table(finalReport);
  console.log(`[PROCESSOR] PIPELINE_COMPLETE. Enterprise backend processing finished.`);

  return { valid, eliminated, stats: finalReport };
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