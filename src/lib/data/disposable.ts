import mailchecker from 'mailchecker';
import customDisposableDomains from '../disposable-domains.json';

// Initialize in-memory set from bundled JSON list
const customSet = new Set<string>();
if (Array.isArray(customDisposableDomains)) {
  for (const d of customDisposableDomains) {
    if (typeof d === 'string') {
      customSet.add(d.toLowerCase().trim());
    }
  }
}

// Well-known high-frequency disposable domains
const extraHighFrequency = [
  'tempmail.com', 'temp-mail.org', 'tempmail.net', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'dispostable.com', 'getnada.com', 'throwawaymail.com', 'maildrop.cc',
  'yopmail.com', 'trashmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'guerrillamail.net',
  'guerrillamail.biz', 'guerrillamail.org', 'grr.la', 'spam4.me', 'boun.cr', 'temp-mail.io',
  'dropmail.me', 'yopmail.fr', 'yopmail.net', 'mytemp.email', 'tempemail.co', 'minuteinbox.com',
  'mohmal.com', 'crazymailing.com', 'armyspy.com', 'cuvox.de', 'dayrep.com', 'fleckens.hu',
  'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us', 'einrot.com'
];
for (const d of extraHighFrequency) {
  customSet.add(d);
}

/**
 * Checks if a given domain or email address belongs to a disposable/throwaway provider.
 * Uses both mailchecker (standard cross-language database) and our 9,200+ domain dataset.
 */
export function isDisposableDomain(domain: string, email?: string): boolean {
  if (!domain) return false;
  const cleanDomain = domain.toLowerCase().trim();

  // 1. In-memory Set check (O(1))
  if (customSet.has(cleanDomain)) {
    return true;
  }

  // 2. Check parent domain if subdomain (e.g. mail.temp-mail.org -> temp-mail.org)
  const parts = cleanDomain.split('.');
  if (parts.length > 2) {
    const rootDomain = parts.slice(-2).join('.');
    if (customSet.has(rootDomain)) {
      return true;
    }
  }

  // 3. Mailchecker check (returns false if disposable)
  const probeEmail = email || `test@${cleanDomain}`;
  try {
    if (!mailchecker.isValid(probeEmail)) {
      return true;
    }
  } catch {
    // If mailchecker throws on malformed input, fallback to false
  }

  return false;
}
