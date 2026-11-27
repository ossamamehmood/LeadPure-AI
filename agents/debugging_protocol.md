# Debugging Protocol

> [!TIP]
> Follow this ordered sequence when diagnosing verdict discrepancies, stalled chunks, or environment parity regressions.

---

## Step-by-Step Investigation

1. **Isolate Single Address vs Chunk Batch**
   - Reproduce using the single-check endpoint (`POST /api/check` with `{"email": "..."}`) before inspecting 100-email batch chunk manifests.
   - Verify syntax and DNS probe outputs directly via `npm test` and `node --check engine/probe.mjs`.

2. **Inspect Runner & Manifest State**
   - Check the `.github/workflows/leadpure-check.yml` run logs (`Port 25 egress` check + `probe.mjs` output) and confirm whether `results/<requestId>/manifest.json` and `chunk-<n>.json` landed cleanly.
   - Verify server environment variables (`LEADPURE_GH_TOKEN`, `LEADPURE_REPO_OWNER`, `LEADPURE_REPO_NAME`) are present on Vercel (`api/check.ts`).

3. **Trace Divergence Deterministically**
   - Identify the exact email and layer (`Syntax`, `DNS/MX`, `Disposable`, `Role`, `SMTP 250/550`, `Catch-All`) where local and production outputs differ.
   - Distinguish true mailbox rejection (`550`) from transient blocks/greylisting (`421`/`451` or Microsoft/Yahoo rate limits), which MUST remain `UNKNOWN` or `RISKY` rather than `SAFE`.

4. **Verify With Repeated Runs**
   - Fix the targeted defect without altering unrelated UI state or retry guarantees.
   - Confirm passing status across `npm run lint`, `npm test`, `npm run test-engine` (10 iterations), and `npm run build`.
