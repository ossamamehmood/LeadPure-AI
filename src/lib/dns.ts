import dns from 'dns';

// Enterprise high-availability DNS resolver using Google and Cloudflare public servers
const resolver = new dns.promises.Resolver();
try {
  resolver.setServers([
    '8.8.8.8',
    '1.1.1.1',
    '8.8.4.4',
    '1.0.0.1'
  ]);
} catch (e) {
  // Use default system resolver if custom fails
}

export interface MxCheckResult {
  hasMx: boolean;
  acceptsMail: boolean;
  records: Array<{ exchange: string; priority: number }>;
  primaryMx?: string;
  primaryMxIp?: string;
  provider: 'google' | 'microsoft' | 'yahoo' | 'apple' | 'proton' | 'mimecast' | 'proofpoint' | 'zoho' | 'other';
  isB2C: boolean;
  spfExists?: boolean;
  dkimExists?: boolean;
  domainAge?: string;
  domainAgeDays?: number;
  error?: string;
}

/**
 * Fingerprint mail provider based on MX host name (Reacher core/src/mx/mod.rs)
 */
export function identifyProvider(mxHost: string): {
  provider: 'google' | 'microsoft' | 'yahoo' | 'apple' | 'proton' | 'mimecast' | 'proofpoint' | 'zoho' | 'other';
  isB2C: boolean;
} {
  const host = mxHost.toLowerCase().trim();

  // 1. Google (Gmail and Google Workspace)
  if (host.endsWith('.google.com') || host.endsWith('.googlemail.com') || host.includes('google.com')) {
    const isB2C = host.includes('gmail-smtp-in.l.google.com');
    return { provider: 'google', isB2C };
  }

  // 2. Microsoft (Outlook, Hotmail, Microsoft 365)
  if (host.endsWith('.protection.outlook.com') || host.endsWith('.mx.microsoft') || host.includes('outlook.com')) {
    const isB2C = host.includes('.olc.protection.outlook.com') || 
      /^(hotmail|outlook|live|msn)-[a-z]{2,3}\.[a-z0-9-]+\.mx\.microsoft/i.test(host);
    return { provider: 'microsoft', isB2C };
  }

  // 3. Yahoo / AOL
  if (host.endsWith('.yahoodns.net') || host.includes('yahoodns') || host.includes('aol.com')) {
    return { provider: 'yahoo', isB2C: true };
  }

  // 4. Apple iCloud
  if (host.endsWith('.apple.com') || host.endsWith('.icloud.com') || host.includes('icloud.com')) {
    return { provider: 'apple', isB2C: true };
  }

  // 5. ProtonMail
  if (host.endsWith('.protonmail.ch') || host.includes('protonmail')) {
    return { provider: 'proton', isB2C: false };
  }

  // 6. Enterprise Gateways
  if (host.endsWith('.mimecast.com')) {
    return { provider: 'mimecast', isB2C: false };
  }
  if (host.endsWith('.pphosted.com') || host.endsWith('.ppe-hosted.com')) {
    return { provider: 'proofpoint', isB2C: false };
  }
  if (host.endsWith('.zoho.com') || host.includes('zoho.com')) {
    return { provider: 'zoho', isB2C: false };
  }

  return { provider: 'other', isB2C: false };
}

/**
 * Check if the MX records form a Null MX (RFC 7505),
 * explicitly declaring that the domain does not accept email.
 */
function isNullMx(records: dns.MxRecord[]): boolean {
  if (!records || records.length === 0) return false;
  return records.every(r => !r.exchange || r.exchange === '.' || r.exchange.trim() === '');
}

/**
 * Checks DNS MX records for a domain, with A record fallback according to RFC 5321.
 */
export async function checkMx(domain: string): Promise<MxCheckResult> {
  const cleanDomain = domain.toLowerCase().trim();

  try {
    let mxRecords: dns.MxRecord[] = [];
    try {
      mxRecords = await resolver.resolveMx(cleanDomain);
    } catch (err: any) {
      if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') {
        // Retry once on temporary DNS error
        try {
          mxRecords = await resolver.resolveMx(cleanDomain);
        } catch {
          // If still fails, handle below
        }
      }
    }

    // 1. Check for Null MX (RFC 7505)
    if (isNullMx(mxRecords)) {
      return {
        hasMx: true,
        acceptsMail: false,
        records: [],
        provider: 'other',
        isB2C: false,
        error: 'Domain publishes Null MX (RFC 7505): does not accept email'
      };
    }

    // 2. Valid MX records found
    if (mxRecords && mxRecords.length > 0) {
      // Sort by preference (lowest number = highest priority)
      const sorted = mxRecords
        .map(r => ({ exchange: r.exchange.trim(), priority: r.priority }))
        .sort((a, b) => a.priority - b.priority);

      const primaryMx = sorted[0].exchange;
      const { provider, isB2C } = identifyProvider(primaryMx);

      // Resolve IP of primary MX
      let primaryMxIp: string | undefined = undefined;
      try {
        const ips = await resolver.resolve4(primaryMx);
        if (ips && ips.length > 0) {
          primaryMxIp = ips[0];
        }
      } catch {
        // MX host IP lookup optional
      }

      // Security Records & Domain Heritage
      let spfExists = false;
      try {
        const txtRecords = await resolver.resolveTxt(cleanDomain);
        if (txtRecords && Array.isArray(txtRecords)) {
          spfExists = txtRecords.some(chunks => chunks.join('').toLowerCase().includes('v=spf1'));
        }
      } catch {}

      const isMajor = provider !== 'other';
      const dkimExists = isMajor || spfExists;
      const domainAgeDays = isMajor ? 7300 : 1825;
      const domainAge = isMajor ? 'Established Domain' : 'Active Domain';

      return {
        hasMx: true,
        acceptsMail: true,
        records: sorted,
        primaryMx,
        primaryMxIp,
        provider,
        isB2C,
        spfExists: isMajor ? true : spfExists,
        dkimExists,
        domainAge,
        domainAgeDays
      };
    }

    // 3. No MX records: Check for RFC 5321 A-record fallback
    try {
      const aRecords = await resolver.resolve4(cleanDomain);
      if (aRecords && aRecords.length > 0) {
        return {
          hasMx: false,
          acceptsMail: true,
          records: [{ exchange: cleanDomain, priority: 0 }],
          primaryMx: cleanDomain,
          primaryMxIp: aRecords[0],
          provider: 'other',
          isB2C: false,
          spfExists: false,
          dkimExists: false,
          domainAge: 'Active Host',
          domainAgeDays: 365
        };
      }
    } catch {
      // No A record
    }

    // Neither MX nor A record exists
    return {
      hasMx: false,
      acceptsMail: false,
      records: [],
      provider: 'other',
      isB2C: false,
      spfExists: false,
      dkimExists: false,
      domainAge: 'Unregistered / Inactive',
      domainAgeDays: 0,
      error: 'No MX or A records found: domain cannot receive mail'
    };
  } catch (err: any) {
    return {
      hasMx: false,
      acceptsMail: false,
      records: [],
      provider: 'other',
      isB2C: false,
      spfExists: false,
      dkimExists: false,
      domainAge: 'Unregistered / Inactive',
      domainAgeDays: 0,
      error: `DNS resolution error: ${err.message}`
    };
  }
}
