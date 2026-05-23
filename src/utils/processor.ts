import { parsePhoneNumberWithError, CountryCode } from 'libphonenumber-js';
import { ProcessedContact } from '../types';

// Forensic telemetry CSV writing engine (active only in Node environments)
let fs: any = null;
const csvPath = 'C:/Users/ossamamehmood/.gemini/antigravity/scratch/LeadPure-AI/debug-results.csv';

if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  import('fs').then(mod => {
    fs = mod.default || mod;
    try {
      if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, 'email,status,failure_code,smtp_code,mx_ip,trace\n', 'utf-8');
      }
    } catch (e) {
      console.warn('[TELEMETRY] Failed to initialize debug-results.csv:', e);
    }
  }).catch(() => {});
}

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
    
    const parts = cleaned.split('@');
    if (parts.length > 1) {
      const domain = parts[parts.length - 1];
      if (domainTypos[domain]) {
        cleaned = parts.slice(0, -1).join('@') + '@' + domainTypos[domain];
      }
    }
  }

  // 3. Missing dot before com
  if (cleaned.endsWith('gmailcom')) cleaned = cleaned.replace('gmailcom', 'gmail.com');
  if (cleaned.endsWith('yahoocom')) cleaned = cleaned.replace('yahoocom', 'yahoo.com');
  if (cleaned.endsWith('hotmailcom')) cleaned = cleaned.replace('hotmailcom', 'hotmail.com');
  if (cleaned.endsWith('outlookcom')) cleaned = cleaned.replace('outlookcom', 'outlook.com');
  if (cleaned.endsWith('aolcom')) cleaned = cleaned.replace('aolcom', 'aol.com');
  if (cleaned.endsWith('icloudcom')) cleaned = cleaned.replace('icloudcom', 'icloud.com');

  // 4. Missing @ sign for major providers
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
  onProgress?: (progress: number, logMessage?: string) => void,
  signal?: AbortSignal
): Promise<{ valid: any[]; eliminated: any[]; stats: any }> => {
  const valid: any[] = [];
  const eliminated: any[] = [];
  
  console.log(`[PROCESSOR_V12.0.0] ENTERPRISE_INIT: Ingesting ${data.length} identities.`);
  
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
  const seenPhones = new Set<string>();
  
  const preProcessedData = data.filter((item, index) => {
    if (!item || typeof item !== 'object') {
      stats.sanitizedRows++;
      eliminated.push({
        email: '',
        status: 'INVALID',
        sub_status: 'sanitized_row',
        failure_code: 'ERR_001',
        verificationReason: 'Null or non-object row sanitized',
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
        originalIndex: index,
        __originalData: item,
        trace: 'Sanitization -> Eliminated null row (ERR_001)'
      });
      
      if (fs) {
        try {
          fs.appendFileSync(csvPath, ',INVALID,ERR_001,,,"Sanitization -> Eliminated null row (ERR_001)"\n', 'utf-8');
        } catch (e) {}
      }
      return false;
    }

    const emailKey = mappings.emailKey;
    let rawEmail = String(item[emailKey] || '').toLowerCase().trim();
    rawEmail = autoCorrectEmail(rawEmail);

    if (!rawEmail) {
      stats.emptyIdentities++;
      eliminated.push({
        ...item,
        email: '',
        status: 'INVALID',
        sub_status: 'empty_email',
        failure_code: 'ERR_001',
        verificationReason: 'Empty email identity suppressed',
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
        originalIndex: index,
        __originalData: item,
        trace: 'Pre-process -> Empty Email Identity Suppressed (ERR_001)'
      });
      
      if (fs) {
        try {
          fs.appendFileSync(csvPath, ',INVALID,ERR_001,,,"Pre-process -> Empty Email Identity Suppressed (ERR_001)"\n', 'utf-8');
        } catch (e) {}
      }
      return false;
    }

    if (seenEmails.has(rawEmail)) {
      stats.duplicateEntries++;
      eliminated.push({
        ...item,
        email: rawEmail,
        status: 'INVALID',
        sub_status: 'duplicate',
        failure_code: 'ERR_001',
        verificationReason: 'Deterministic Protocol: Duplicate Email Suppressed',
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
        originalIndex: index,
        __originalData: item,
        trace: `Pre-process -> Duplicate Email Identity Suppressed (${rawEmail}) (ERR_001)`
      });

      if (fs) {
        try {
          const escapeCsv = (str: string) => `"${String(str || '').replace(/"/g, '""')}"`;
          fs.appendFileSync(csvPath, `${escapeCsv(rawEmail)},INVALID,ERR_001,,,"Pre-process -> Duplicate Email Identity Suppressed (ERR_001)"\n`, 'utf-8');
        } catch (e) {}
      }
      return false;
    }

    const phoneKey = mappings.phoneKey;
    if (phoneKey) {
      const rawPhone = String(item[phoneKey] || '').trim();
      if (rawPhone) {
        const normalizedPhone = formatPhone(rawPhone, item[mappings.countryKey], rules.forcePlusSign);
        if (normalizedPhone && seenPhones.has(normalizedPhone)) {
          stats.duplicateEntries++;
          eliminated.push({
            ...item,
            email: rawEmail,
            status: 'INVALID',
            sub_status: 'duplicate_phone',
            failure_code: 'ERR_001',
            verificationReason: 'Deterministic Protocol: Duplicate Phone Suppressed',
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
            originalIndex: index,
            __originalData: item,
            trace: `Pre-process -> Duplicate Phone Identity Suppressed (${normalizedPhone}) (ERR_001)`
          });

          if (fs) {
            try {
              const escapeCsv = (str: string) => `"${String(str || '').replace(/"/g, '""')}"`;
              fs.appendFileSync(csvPath, `${escapeCsv(rawEmail)},INVALID,ERR_001,,,"Pre-process -> Duplicate Phone Suppressed (${normalizedPhone})"\n`, 'utf-8');
            } catch (e) {}
          }
          return false;
        }
        if (normalizedPhone) seenPhones.add(normalizedPhone);
      }
    }
    
    seenEmails.add(rawEmail);
    return true;
  });

  console.log(`[PROCESSOR] STAGE_1_CLEAN: ${preProcessedData.length} unique identities. (${stats.duplicateEntries} duplicates suppressed)`);

  // Stage 2: Sequential Batch processing (enforcing 40 leads per batch)
  const total = preProcessedData.length;
  const BATCH_SIZE = 40; 
  const CONCURRENT_BATCHES = 1; // Pure sequential execution: Batch-after-batch throttling
  
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
        
        // High-precision Promise.race wrapper: set to 8000ms safety timeout limit
        const fetchPromise = fetch('/api/validate-batch', {
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

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            controller.abort();
            reject(new Error('Gateway Timeout Limit Reached (8000ms)'));
          }, 8000);
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);

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
          const status = verificationResult.status;
          const isSafe = status === 'SAFE';

          if (!isSafe) {
            const subStatus = verificationResult.sub_status || '';
            if (subStatus === 'invalid_syntax') stats.invalidSyntax++;
            else if (subStatus === 'domain_not_found') stats.dnsFailure++;
            else if (subStatus === 'disposable') stats.disposableMatch++;
            else if (subStatus === 'role_based') stats.roleBasedMatch++;
            else if (subStatus === 'catch_all') stats.catchAllMatch++;
            else if (subStatus === 'toxic') stats.toxicPatternMatch++;
            else if (subStatus === 'greylisted') stats.greylistedMatch++;
            else if (verificationResult.bounceRisk === 'High' || verificationResult.bounceRisk === 'Dangerous') stats.highBounceRisk++;

            const eliminatedRow = { 
              ...item, 
              ...verificationResult,
              reason: verificationResult.verificationReason,
              score: verificationResult.confidenceScore,
              bounceRisk: verificationResult.bounceRisk,
              reputationImpact: verificationResult.reputationImpact,
              subStatus: verificationResult.sub_status,
              status: status,
              originalIndex: startIndex + idx,
              __originalData: item
            };
            eliminated.push(eliminatedRow);
            
            // Telemetry logging to CSV
            if (fs) {
              try {
                const escapeCsv = (str: string) => `"${String(str || '').replace(/"/g, '""')}"`;
                const csvRow = `${escapeCsv(verificationResult.email)},${escapeCsv(status)},${escapeCsv(verificationResult.failure_code || '')},${verificationResult.smtp_code ?? ''},${escapeCsv(verificationResult.mx_ip || '')},${escapeCsv(verificationResult.trace || '')}\n`;
                fs.appendFileSync(csvPath, csvRow, 'utf-8');
              } catch (e) {}
            }
            
            if (onProgress) {
               onProgress(Math.min(100, Math.round(((completedBatches * BATCH_SIZE) + idx) / total * 100)), `[SYS] FILTERED: ${item[mappings.emailKey]} -> ${status} (${verificationResult.verificationReason})`);
            }
          } else {
            stats.verifiedLeads++;
            
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

            const validRow = {
              ...verificationResult,
              ...updatedItem,
              originalIndex: startIndex + idx,
              __originalData: updatedItem
            } as ProcessedContact;
            valid.push(validRow);

            // Telemetry logging to CSV
            if (fs) {
              try {
                const escapeCsv = (str: string) => `"${String(str || '').replace(/"/g, '""')}"`;
                const csvRow = `${escapeCsv(verificationResult.email)},${escapeCsv(status)},${escapeCsv(verificationResult.failure_code || '')},${verificationResult.smtp_code ?? ''},${escapeCsv(verificationResult.mx_ip || '')},${escapeCsv(verificationResult.trace || '')}\n`;
                fs.appendFileSync(csvPath, csvRow, 'utf-8');
              } catch (e) {}
            }

            if (onProgress) {
               onProgress(Math.min(100, Math.round(((completedBatches * BATCH_SIZE) + idx) / total * 100)), `[SYS] SECURED: ${updatedItem[mappings.emailKey]} -> ${status} (${verificationResult.verificationReason})`);
            }
          }
        });

      } catch (err: any) {
        if (err.name === 'AbortError' && signal?.aborted) {
          retries = -1;
          break;
        }
        
        retries--;
        if (retries < 0) {
          console.error(`[BATCH_ERROR] Batch starting at ${startIndex} failed permanently:`, err);
          
          // Complete data row conservation: Map timed-out or failed batch rows safely to ELIMINATED (UNKNOWN/ERR_009)
          items.forEach((item, idx) => {
            const emailVal = String(item[mappings.emailKey] || '').toLowerCase().trim();
            const verificationResult = {
              email: emailVal,
              status: 'UNKNOWN' as const,
              sub_status: 'timeout',
              failure_code: 'ERR_009' as const,
              smtp_code: null,
              mx_ip: null,
              timestamp: new Date().toISOString(),
              is_catchall: false,
              verificationStatus: 'unknown' as const,
              verificationReason: `Safety Timeout (8000ms) or Gateway Crash: ${err.message}`,
              confidenceScore: 50,
              bounceRisk: 'Unknown' as const,
              reputationImpact: 'Unknown' as const,
              mxRecordFound: false,
              isDisposable: false,
              isRoleBased: false,
              isFreeEmail: false,
              isSpamTrap: false,
              provider: 'Unknown',
              smtpValid: false,
              syntaxValid: false,
              didyouseeme: false,
              trace: `Safety Timeout -> Deflected to UNKNOWN (ERR_009)`
            };

            eliminated.push({
              ...item,
              ...verificationResult,
              reason: verificationResult.verificationReason,
              originalIndex: startIndex + idx,
              __originalData: item
            });

            // Write timed-out trace to telemetry CSV
            if (fs) {
              try {
                const escapeCsv = (str: string) => `"${String(str || '').replace(/"/g, '""')}"`;
                const csvRow = `${escapeCsv(emailVal)},UNKNOWN,ERR_009,,,"Safety Timeout -> Deflected to UNKNOWN (ERR_009)"\n`;
                fs.appendFileSync(csvPath, csvRow, 'utf-8');
              } catch (e) {}
            }
          });
        } else {
          console.warn(`[BATCH_RETRY] Batch ${startIndex} failed, retrying... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, 1500)); 
        }
      }
    }

    completedBatches++;
    if (onProgress) {
      onProgress(Math.min(100, Math.round((completedBatches / batches.length) * 100)));
    }
  };

  // Run sequential throttling chunk-by-chunk to prevent socket crashes
  for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
    if (signal?.aborted) {
      console.log(`[PROCESSOR] PIPELINE_ABORTED by user.`);
      throw new Error('Pipeline Aborted');
    }
    const concurrentChunk = batches.slice(i, i + CONCURRENT_BATCHES);
    await Promise.all(concurrentChunk.map(b => processBatch(b)));
    
    // Controlled adaptive jitter between sequential blocks
    await new Promise(resolve => setTimeout(resolve, 150));
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
  const timestamp = new Date().toISOString();
  
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
      email: clean,
      status: 'INVALID',
      sub_status: 'invalid_syntax',
      failure_code: 'ERR_001',
      smtp_code: null,
      mx_ip: null,
      timestamp,
      is_catchall: false,
      trace: 'Syntax check failed: empty localPart'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7500);

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
      email: clean,
      status: 'UNKNOWN',
      sub_status: 'timeout',
      failure_code: 'ERR_009',
      smtp_code: null,
      mx_ip: null,
      timestamp,
      is_catchall: false,
      trace: `Safety Timeout -> Deflected to UNKNOWN (ERR_009) via wrapper: ${err.message}`
    };
  }
};