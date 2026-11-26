# LeadPure V17: Line-by-Line Code Audit (Phase 1)

**Scope audited**: `api/check.ts`, `api/validate-batch.ts`, `src/components/*`, `src/lib/*`, `src/utils/processor.ts`, `src/hooks/*`, `src/workers/*`, `src/App.tsx`, `engine/probe.mjs`, `.github/workflows/*`, `vercel.json`, `package.json`, `test-engine.ts`.

---

## 1. Bugs & Logic Flaws
1. **`api/check.ts`: Inconsistent POST syntax-fail response shape (Lines 204-217)**:
   - When `isValidSyntax(targetEmail)` fails on `POST`, it returns a raw single-item shape without `verificationStatus`, `results[]`, or batch-wide syntax filtering, and only checks `rawList[0]`.
2. **`api/check.ts`: Scale Failure on Large Lists (Lines 232-249)**:
   - Joins all emails into one `workflow_dispatch` string (`rawList.join('\n')`). GitHub Actions caps `workflow_dispatch` inputs at 65,535 characters (~2,500 emails), causing `422` failures for 1,000-5,000 email lists, and hitting single-runner limits.
   - No chunking (`100` emails/chunk), no `results/<requestId>/chunk-<n>.json` + `manifest.json` architecture.
3. **`api/check.ts`: Hardcoded / Heuristic Confidence Scores (`calculatePhase2Score`, Lines 5-26)**:
   - Computes an arbitrary `20 + 10 + 10 + 5 + 45 - 25` heuristic score (`45` on `unknown`/`invalid`, capped at `95`). Lookups check `misc.is_b2c` (absent in probe v1.2, which sets `debug.freemail`), causing false `INVALID -> 45/100` scores.
4. **`src/components/ResultsDashboard.tsx`: Dangerous Verdict Fallback (Line 71)**:
   - `{contact.verificationStatus || 'SAFE'}` defaults any contact with a missing status to **SAFE** in the UI badge.
5. **`src/components/ResultsDashboard.tsx`: Dead Provider Display Branches (Lines 87-89)**:
   - Checks `contact.provider === 'google' | 'microsoft' | 'enterprise_gateway'`, which never match `'Consumer Node'` / `'Enterprise Node'` returned by `api/check.ts`.
6. **`src/utils/processor.ts`: Incorrect Bounce Classification on Duplicates/Empty Rows (Lines 200-345)**:
   - Pre-processing marks empty/duplicate rows as `INVALID`, `confidenceScore: 0`, `bounceRisk: 'Dangerous'`, `reputationImpact: 'Critical'`. Duplicates are skipped rows, not dangerous bounces.
7. **`src/workers/xlsxWorker.ts`: Synchronous Large-File Processing**:
   - Processes the entire workbook synchronously without chunked yielding, risking UI/worker stalls on 5,000-row spreadsheets, and lacks a 5,000-email validation cap.
8. **`src/App.tsx` & `src/hooks/useLeadProcessor.ts`: No Bulk Resume or Live Row Updates**:
   - Cannot resume a bulk scan if the user closes/reopens the browser (`localStorage` does not track active `requestId`).
   - Export filename is `${baseName}_Cleaned.xlsx` instead of `LeadPure_Results_<date>.xlsx`.
9. **`engine/probe.mjs`: Sequential Execution Bottleneck**:
   - Processes `for (const e of emails)` sequentially; 100 emails with 20s-45s timeouts cannot finish fast enough without parallel workers inside the runner. Note also unused `CONNECT_TIMEOUT_MS` constant (line 18).

---

## 2. Leftover Reacher Wrapper Naming & Dead Code
1. **`api/check.ts`**:
   - Parameter named `reacherResult` (line 5).
   - Reads `REACHER_GH_TOKEN`, `REACHER_REPO_OWNER`, `REACHER_REPO_NAME` instead of primary `LEADPURE_GH_TOKEN`, `LEADPURE_REPO_OWNER`, `LEADPURE_REPO_NAME` (keeping `REACHER_*` only as backwards-compatible fallback).
   - Error message leaks internal `REACHER_GH_TOKEN` name (line 226).
2. **`api/validate-batch.ts`**:
   - Dead HTTP 410 deprecated stub. Needs V17 cleanup or removal of stale V15 comments/headers (retaining 410 safety guard cleanly without any SMTP code).
3. **`src/lib/smtp.ts`**:
   - Leftover external wrapper `queryExternalSmtpBackend` referencing `REACHER_API_URL`, `REACHER_API_KEY`, `SMTP_BACKEND_URL` (lines 374-436).
   - Legacy `executeSmtpSocketHandshake` and `verifySmtpDeliverability` with `confidenceScore: 40` in `src/lib/validator.ts` lines 261, 298 (kept offline for `test-engine.ts` unit suite, never called in production Vercel API or UI).
   - Legacy unused directories/files: `backend/` (old VPS wrapper prototype) and `server.ts`.

---

## 3. Security Issues
1. **Command/Shell Injection in `.github/workflows/leadpure-check.yml` (Line 42)**:
   - `printf '%s\n' "${{ inputs.emails }}" > emails.txt` directly interpolates untrusted user input inside double-quoted bash. Must bind via `env:` variable.
2. **Path Traversal in `.github/workflows/leadpure-check.yml` & `api/check.ts`**:
   - `request_id` / `requestId` is interpolated into git paths (`results/${REQUEST_ID}.json`) and GitHub REST URLs without strict regex validation (`/^[a-zA-Z0-9_-]+$/`).
3. **Unbounded Array / Payload Injection in `POST /api/check`**:
   - No email count limit (`<= 5000`) or per-email sanitization against newlines/control chars.
4. **No Retention / Cleanup Policy**:
   - `results` branch accumulates files forever with no automated 7-day cleanup workflow.

---

## 4. Stale Versions, Inconsistent Labels & Hype Claims
1. **Stale Version Labels**:
   - `package.json` line 4: `"version": "15.0.0"`
   - `api/check.ts` line 39: `X-LeadPure-Version: 'v16.0.0'`
   - `api/validate-batch.ts` lines 1, 5: `LeadPure V15`, `X-LeadPure-Version: 'v15.0.0'`
   - `.github/workflows/ci.yml` line 34: `Run LeadPure AI v13 Test Suite`
   - `src/components/Header.tsx` line 32: `V16 ENTERPRISE RELEASE (OWN SMTP ENGINE 1.2)`
   - `src/components/LeadUpload.tsx` line 87: `LeadPure Neural Verification Pipeline (v15.0)`
   - `src/components/LoadingOverlay.tsx` line 83: `LeadPure v15 Verification Engine`
   - `src/components/ResultsDashboard.tsx` line 240: `v15 Engine`
   - `src/utils/processor.ts` line 176: `[PROCESSOR_V14.0.0]`, line 104: `(v10.0 Engine)`
2. **Unfounded Hype / Misleading Copy**:
   - `src/App.tsx` line 184: `'0% BOUNCE VERIFICATION COMPLETE'` (false 0% bounce claim).
   - `src/components/RulesSection.tsx` line 26: `'Zero-Bounce Neutralization ACTIVE'`, line 91: `'Military-Grade Encryption Loop Active'`, lines 92-93 claim sandboxing without persistence (misleading since probes dispatch via Actions).
   - `src/components/LeadUpload.tsx` line 40: `"Synthetically generated addresses and commercial bots are automatically stripped"`.
   - `src/components/ResultsDashboard.tsx` line 42: `{contact.confidenceScore}% Accuracy`, line 222: `Global Accuracy Grade`, line 174: `Deliverability Locked`: unexplained percentages.
   - `src/components/Footer.tsx`: `Deliverability Guard: Active`, `neural engine`.
3. **Inconsistent Verdict Taxonomy & Colors**:
   - Mixes `SAFE`/`VERIFIED`/`safe`/`verified`, `INVALID`/`blocked`/`BLOCKED`/`rejected`/`dangerous`.
   - Colors in `ResultsDashboard.tsx` use blue/purple for `SAFE` and pink for `INVALID` instead of standard **Green (SAFE)**, **Amber (RISKY)**, **Red (INVALID/BLOCKED)**, **Grey (UNKNOWN)**.
4. **360px Mobile Layout Issues**:
   - Excessive fixed padding (`px-10`, `p-12`), large non-responsive radii (`rounded-[48px]`), and wide text tracking cause horizontal cramping on 360px mobile screens.
