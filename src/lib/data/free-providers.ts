// Free and consumer email providers
export const freeEmailProviders = new Set<string>([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.fr', 'yahoo.co.uk', 'yahoo.es',
  'yahoo.de', 'yahoo.it', 'yahoo.ca', 'yahoo.in', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'hotmail.fr', 'hotmail.co.uk', 'hotmail.de', 'hotmail.it', 'hotmail.es',
  'outlook.com', 'outlook.fr', 'outlook.de', 'outlook.it', 'outlook.es', 'outlook.co.uk',
  'live.com', 'live.fr', 'live.co.uk', 'live.de', 'live.it', 'msn.com', 'windowslive.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'aim.com',
  'protonmail.com', 'proton.me', 'pm.me', 'zoho.com', 'mail.com', 'email.com',
  'gmx.com', 'gmx.de', 'gmx.net', 'yandex.com', 'yandex.ru', 'ya.ru', 'mail.ru',
  'inbox.ru', 'list.ru', 'bk.ru', 'tutanota.com', 'tuta.io', 'fastmail.com',
  'web.de', 'freenet.de', 'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr',
  'laposte.net', 'libero.it', 'virgilio.it', 'tiscali.it', 'alice.it',
  'bol.com.br', 'uol.com.br', 'terra.com.br', 'ig.com.br', 'rediffmail.com',
  'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com', 'naver.com', 'daum.net', 'hanmail.net'
]);

/**
 * LeadPure Optimization Rules: Major free providers that NEVER act as catch-all.
 * Probing catch-all against these domains will trigger spam filters and false flags.
 */
export const skipCatchAllDomains = new Set<string>([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.fr', 'yahoo.co.uk', 'yahoo.es', 'yahoo.de', 'yahoo.it', 'yahoo.ca', 'yahoo.in', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'hotmail.fr', 'hotmail.co.uk', 'hotmail.de', 'hotmail.it', 'hotmail.es',
  'outlook.com', 'outlook.fr', 'outlook.de', 'outlook.it', 'outlook.es', 'outlook.co.uk',
  'live.com', 'live.fr', 'live.co.uk', 'live.de', 'live.it', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'aim.com',
  'protonmail.com', 'proton.me', 'pm.me',
  'zoho.com', 'mail.com', 'gmx.com', 'gmx.de',
  'yandex.com', 'yandex.ru', 'mail.ru'
]);

export function isFreeEmailProvider(domain: string): boolean {
  if (!domain) return false;
  return freeEmailProviders.has(domain.toLowerCase().trim());
}

export function shouldSkipCatchAll(domain: string, mxHost?: string): boolean {
  if (!domain) return false;
  const d = domain.toLowerCase().trim();
  // Only public consumer mail domains (e.g. gmail.com, hotmail.com) never have catch-all.
  // Custom business domains using Google Workspace or Microsoft 365 CAN and frequently DO enable catch-all!
  if (skipCatchAllDomains.has(d)) return true;
  
  if (mxHost) {
    const mx = mxHost.toLowerCase();
    // Consumer-only MX gateways
    if (mx.includes('gmail-smtp-in.l.google.com') && d === 'gmail.com') return true;
    if (mx.includes('.olc.protection.outlook.com') && (d.includes('hotmail') || d.includes('outlook') || d.includes('live') || d.includes('msn'))) return true;
    if (mx.includes('.yahoodns.net') && (d.includes('yahoo') || d.includes('ymail') || d.includes('rocketmail') || d.includes('aol'))) return true;
    if (mx.includes('.apple.com') || mx.includes('.icloud.com')) {
      if (d === 'icloud.com' || d === 'me.com' || d === 'mac.com') return true;
    }
  }
  return false;
}
