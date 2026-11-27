# Security Policy

> [!NOTE]
> LeadPure is engineered as a stateless verification orchestrator with browser-local spreadsheet parsing and minimal retention. No uploaded contact lists, names, or phone numbers are ever stored in a persistent database.

---

## Data Flow & Isolation Architecture

| Boundary | Security Guarantee | Implementation |
| :--- | :--- | :--- |
| **Local Spreadsheet Parsing** | Excel and CSV files parse strictly in the browser Web Worker (`src/workers/xlsxWorker.ts`). Extra columns (names, phones, notes, companies) never leave the browser. | Client Web Worker + `localStorage` scan recovery |
| **Input & Path Validation** | User emails and `requestId` values are validated server-side in `api/check.ts` (`/^[a-zA-Z0-9_-]+$/` + `<= 5,000` item cap) and injected cleanly via `env:` bindings in `.github/workflows/leadpure-check.yml`. | Zero shell string interpolation |
| **Ephemeral SMTP Execution** | Live DNS/MX lookups and Port-25 checks run via `engine/probe.mjs` inside isolated, short-lived GitHub Actions Ubuntu containers and never deliver mail. | Stateless container execution |
| **Automatic 7-Day Pruning** | Temporary verification output files on the isolated `results` branch (`results/<requestId>/`) are purged automatically once older than **7 days**. | `.github/workflows/cleanup-results.yml` |
| **HTTP & Transport Headers** | Enforces HSTS preload (`max-age=31536000`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, and strict `Permissions-Policy`. | `vercel.json` |

---

## Credential & Token Hygiene

- Backend workflow orchestration reads `LEADPURE_GH_TOKEN` (with `REACHER_GH_TOKEN` as legacy fallback) strictly inside Vercel Serverless Functions (`api/check.ts`).
- Secrets are never bundled into `dist/`, exposed to browser bundles, or committed to Git history.
- When rotating credentials: revoke old tokens in GitHub Developer Settings, update `LEADPURE_GH_TOKEN` in Vercel Environment Variables, and redeploy.

---

## Supported Scope

| Release Track | Security Status | Notes |
| :--- | :---: | :--- |
| **Current Production (`main`)** | Active | Zero-dependency `engine/probe.mjs`, chunked `/api/check`, security headers, weekly 7-day result pruning |
| **Legacy Endpoints (`/api/validate-batch`)** | Retired (`410`) | Permanently returns `HTTP 410 Gone` |

---

## Reporting a Vulnerability

If you discover a potential vulnerability in LeadPure (input handling, workflow dispatch safety, SSRF/path edge cases, or credential exposure):

1. **Do not** open a public GitHub issue containing reproduction payloads or sensitive data.
2. Submit a private report via [GitHub Security Advisories](https://github.com/ossamamehmood/LeadPure-AI/security/advisories/new).
3. Include clear reproduction steps, affected file paths or endpoints, and estimated impact. Confirmed issues are patched promptly on `main`.
