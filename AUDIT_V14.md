# Engineering Audit & Resolution Ledger

> [!NOTE]
> Historical Phase-1 audit tracking bugs, legacy wrapper cleanup, security hardening, and responsive layout fixes discovered prior to production hardening. All items below have been verified resolved across `main`.

---

## 1. Core Engine & Batching Fixes

| Area | Original Defect | Resolution Applied |
| :--- | :--- | :--- |
| `api/check.ts` | Single invalid syntax check returned an inconsistent shape without `verificationStatus` / `results[]`. | Unified canonical JSON response across syntax rejections, single checks, and chunked batches. |
| `api/check.ts` | Single large `workflow_dispatch` payload failed above ~2,500 rows (`65,535` char cap). | Implemented automatic 100-email chunking (up to 5,000 leads), `manifest.json` tracking, and concurrent runner control. |
| `api/check.ts` | Heuristic fallback scores misclassified `INVALID` addresses with misleading percentages. | Replaced synthetic guesswork with honest verdicts (`SAFE`, `RISKY`, `INVALID`, `UNKNOWN`) and exact counts. |
| `engine/probe.mjs` | Sequential single-email probing caused high-latency batch stalls. | Added controlled async worker concurrency, 2-pass strict firewall retry, 30s greylist wait, and forwarding-domain safeguards. |
| `src/workers/xlsxWorker.ts` | Large spreadsheets blocked worker execution without hard cap safeguards. | Added chunked yielding and clean 5,000-row validation boundary enforcement. |
| `src/components/ResultsDashboard.tsx` | Missing status defaulted dangerously to `SAFE`; dead provider labels failed to map. | Enforced safe `UNKNOWN` fallback when pending, color-matched taxonomy (`Green / Amber / Rose / Slate`), and exact `LeadPure_Results_<YYYY-MM-DD>.xlsx` exports. |
| `src/utils/processor.ts` | Duplicate/empty rows counted toward dangerous bounces; no browser resume recovery. | Classified duplicates cleanly without bounce false positives and added `localStorage` resumable scan state. |

---

## 2. Security & Infrastructure Hardening

- **Shell Injection Prevention:** `.github/workflows/leadpure-check.yml` and `engine/run-ci-probe.sh` bind `REQUEST_ID`, `CHUNK_INDEX`, and `EMAILS_INPUT` exclusively through GitHub Actions `env:` variables with strict regex checks.
- **Legacy Stub Cleanup:** `/api/validate-batch` cleanly returns `HTTP 410 Gone`; primary configuration standardizes on `LEADPURE_GH_TOKEN`, `LEADPURE_REPO_OWNER`, and `LEADPURE_REPO_NAME`.
- **7-Day Auto-Pruning:** `.github/workflows/cleanup-results.yml` deletes `results/<requestId>/` artifacts older than **7 days** on schedule.
- **Transport & Security Headers:** `vercel.json` enforces HSTS preload, `nosniff`, `SAMEORIGIN`, `Referrer-Policy`, and `Permissions-Policy`.

---

## 3. UI Craft, SEO & Responsive Verification

- **Honest Copy Alignment:** Removed artificial `"0% bounce"` / hype phrasing in favor of transparent benchmarks and live-check explanations.
- **Mobile & Desktop Polish:** Verified cleanly at `1440x900` (Dark & Light) and `360x800` mobile with `0` horizontal overflow, accessible focus rings, skip links, and unified `.liquid-glass` / `LiquidSpotlightCard` spacing.
- **Production SEO & Build Splitting:** Added Schema.org `@graph` JSON-LD, dynamic route canonicals/OG metadata, `og-image.png` / touch icons, `robots.txt`, `sitemap.xml`, `llms.txt`, and route-split Vite lazy chunks.
