# Security Policy — LeadPure AI V17

## Data Flow & Privacy Architecture

LeadPure AI is designed as a stateless verification orchestrator with minimal data retention:

1. **Client-Side Spreadsheet Parsing:** Uploaded CSV and Excel (`.xlsx` / `.xls`) files are parsed locally inside the user's browser via `src/workers/parseLeads.worker.ts`. Unselected spreadsheet columns and phone numbers are never persisted on a backend database.
2. **Ephemeral SMTP Runners:** Live DNS/MX and Port-25 SMTP checks execute inside isolated, short-lived GitHub Actions Ubuntu containers (`engine/probe.mjs` v1.3.1) triggered via `.github/workflows/leadpure-check.yml`.
3. **Command-Injection Protection:** User-supplied email strings and request IDs are validated by `api/check.ts` before dispatch and passed into workflow scripts strictly through GitHub Actions `env:` variables—never interpolated directly into shell command strings.
4. **Automatic 7-Day Result Pruning:** Per-request manifest and chunk result files (`results/<requestId>/manifest.json` and `chunk-<n>.json`) on the `results` branch are automatically deleted once older than **7 days** by the weekly `.github/workflows/cleanup-results.yml` workflow.

---

## Secret & Token Hygiene

- Orchestration requires a GitHub Personal Access Token configured as a server-side environment variable (`LEADPURE_GH_TOKEN`, with `REACHER_GH_TOKEN` accepted as a legacy fallback).
- Secrets remain strictly within Vercel Serverless Functions (`/api/check`) and GitHub Actions encrypted secrets; they are never bundled into `dist/` or exposed to browser code.
- If rotating tokens, revoke old tokens in GitHub Developer Settings first, then update `LEADPURE_GH_TOKEN` in Vercel Environment Variables and redeploy.

---

## Supported Versions

| Version | Status | Notes |
| :--- | :--- | :--- |
| **17.x** | Active Support | Own SMTP Engine `1.3.1`, chunked `/api/check`, 7-day auto-cleanup |
| **&lt;= 16.x** | End of Life | Upgrade to `17.x`; `/api/validate-batch` is retired (`HTTP 410`) |

---

## Reporting a Vulnerability

If you discover a security vulnerability in LeadPure AI (such as input-handling issues, accidental secret exposure, or API validation bypasses):

1. **Do not** open a public issue with exploit steps or live credentials.
2. Report privately via [GitHub Security Advisories](https://github.com/ossamamehmood/LeadPure-AI/security/advisories/new) on `ossamamehmood/LeadPure-AI`.
3. Include reproduction steps, affected files or endpoints, and potential impact. Valid reports are acknowledged promptly and patched on `main`.
