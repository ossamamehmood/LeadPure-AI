// Reacher-derived syntax verification, normalization, and typo suggestion engine

export interface SyntaxResult {
  isValid: boolean;
  username: string;
  domain: string;
  normalizedEmail?: string;
  suggestion?: string;
  errorReason?: string;
}

// Strict RFC 5322 compliant regex for practical email addresses
const rfc5322Regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const MAJOR_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'zoho.com',
  'mail.com',
  'gmx.com'
];

/**
 * Standard Levenshtein distance computation
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Normalizes email according to provider-specific standards (e.g. Gmail dots and aliases)
 */
export function normalizeEmailAddress(username: string, domain: string): string {
  const cleanDomain = domain.toLowerCase().trim();
  const cleanUsername = username.toLowerCase().trim();

  if (cleanDomain === 'gmail.com' || cleanDomain === 'googlemail.com') {
    const baseUser = cleanUsername.split('+')[0].replace(/\./g, '');
    return `${baseUser}@gmail.com`;
  }

  return `${cleanUsername}@${cleanDomain}`;
}

/**
 * Validates the email address syntax, checks RFC boundaries, normalizes,
 * and checks for domain typos with suggestions.
 */
export function validateSyntax(rawEmail: string): SyntaxResult {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      isValid: false,
      username: '',
      domain: '',
      errorReason: 'Empty or invalid email input'
    };
  }

  const clean = rawEmail.trim().toLowerCase();

  // Basic length constraints per RFC 5321 (max 254 total)
  if (clean.length > 254) {
    return {
      isValid: false,
      username: '',
      domain: '',
      errorReason: 'Email exceeds maximum allowed length of 254 characters'
    };
  }

  const atIndex = clean.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === clean.length - 1) {
    return {
      isValid: false,
      username: '',
      domain: '',
      errorReason: 'Missing or misplaced @ delimiter'
    };
  }

  const username = clean.substring(0, atIndex);
  const domain = clean.substring(atIndex + 1);

  // Local part length max 64, domain max 255
  if (username.length > 64) {
    return {
      isValid: false,
      username,
      domain,
      errorReason: 'Username exceeds maximum allowed length of 64 characters'
    };
  }

  if (domain.length > 255 || !domain.includes('.')) {
    return {
      isValid: false,
      username,
      domain,
      errorReason: 'Invalid domain structure (missing top-level domain)'
    };
  }

  // Check for consecutive dots, leading/trailing dots in username or domain
  if (
    username.startsWith('.') ||
    username.endsWith('.') ||
    username.includes('..') ||
    domain.startsWith('.') ||
    domain.endsWith('.') ||
    domain.includes('..')
  ) {
    return {
      isValid: false,
      username,
      domain,
      errorReason: 'Consecutive or invalid dot placement in email'
    };
  }

  // Strict regex check
  if (!rfc5322Regex.test(clean)) {
    return {
      isValid: false,
      username,
      domain,
      errorReason: 'Malformed email syntax format'
    };
  }

  // Check TLD length (at least 2 letters, no numbers in TLD)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || !/^[a-z]{2,24}$/.test(tld)) {
    return {
      isValid: false,
      username,
      domain,
      errorReason: 'Invalid Top-Level Domain (TLD)'
    };
  }

  // Generate typo suggestion if domain is slightly off (only if not already a major provider)
  let suggestion: string | undefined = undefined;
  if (!MAJOR_PROVIDERS.includes(domain)) {
    for (const provider of MAJOR_PROVIDERS) {
      const dist = levenshteinDistance(domain, provider);
      if (dist === 1 || dist === 2) {
        suggestion = `${username}@${provider}`;
        break;
      }
    }
  }

  const normalizedEmail = normalizeEmailAddress(username, domain);

  return {
    isValid: true,
    username,
    domain,
    normalizedEmail,
    suggestion
  };
}
