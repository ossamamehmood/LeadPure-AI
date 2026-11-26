// LeadPure V14: Local SMTP execution removed from Vercel serverless.
// All single and bulk checks use /api/check dispatched to GitHub Actions runners.

export default async function handler(req: any, res: any) {
  res.setHeader('X-LeadPure-Version', 'v14.0.0');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(410).json({
    error: 'Deprecated endpoint. Use POST /api/check and poll GET /api/check?requestId=...'
  });
}
