# 🧪 Debugging Protocol

Follow these exact steps when investigating processing inconsistencies or validation failures.

## 1. Stabilization
- Disable concurrency (set `MAX_CONCURRENT` to 1) to identify sequential failure points.
- Enable verbose logging in both the `processor.ts` and the `api/validate-batch.ts`.

## 2. Forensic Analysis
- Generate a `debug-results.csv` to map row numbers to specific rejection reasons.
- Compare the `debug-results.csv` from Localhost against Vercel Production.

## 3. Divergence Identification
- Identify the first row where the classification drifts between environments.
- Trace the specific validation layer (DNS, SMTP, etc.) that triggered the difference.

## 4. Root Cause Fix
- Fix only the specific logic causing the drift.
- Avoid "blind patching" or broad architectural changes during a debug cycle.

## 5. Verification
- Re-run the same test file 10 times.
- Confirm identical outputs and lead counts across every run.
