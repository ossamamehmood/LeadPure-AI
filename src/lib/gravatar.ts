import crypto from 'crypto';

const GRAVATAR_BASE_URL = 'https://www.gravatar.com/avatar/';

/**
 * Checks whether an email address has an active Gravatar profile (Reacher misc/gravatar.rs).
 * Performs a lightweight HEAD request over HTTPS. Returns avatar URL if found.
 */
export async function checkGravatar(email: string): Promise<string | null> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const hash = crypto.createHash('md5').update(cleanEmail).digest('hex');
    const url = `${GRAVATAR_BASE_URL}${hash}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${url}?d=404`, {
      method: 'HEAD',
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.status === 200) {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}
