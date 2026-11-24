// LeadPure V15: Local SMTP engine removed from Vercel serverless.
// Bulk verification now delegates to /api/check running on GitHub Actions.

export default async function handler(req: any, res: any) {
  res.setHeader('X-LeadPure-Version', 'v15.0.0');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(410).json({
    error: 'Deprecated: Local SMTP verification has been removed from Vercel serverless. Use POST /api/check with { emails: [...] } and poll /api/check?requestId=... instead.'
  });
}
