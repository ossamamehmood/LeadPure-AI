# Engineering Constitution (`rules.md`)

> [!IMPORTANT]
> Non-negotiable verification and quality constraints enforced across all LeadPure code changes.

---

## Verification Rules

- **Never** classify `UNKNOWN` or transient timeouts as `SAFE`.
- **Never** fabricate heuristic scores or mislead users with *"0% bounce"* promises.
- **Never** silently drop spreadsheet rows without a visible bucket count or reconciliation reason.
- **Never** interpolate raw user inputs (`requestId`, `emails`) directly into shell commands or file paths without strict validation.
- **Always** treat catch-all domains honestly as `RISKY` (and exclude/segment them from primary `SAFE` exports).
- **Always** validate RFC syntax and disposable/role status before dispatching network Port-25 probes.

## Engineering & UI Discipline

- Keep extra contact columns (names, phone numbers, companies, notes) strictly in the browser Web Worker and memory (`src/workers/xlsxWorker.ts`).
- Respect `prefers-reduced-motion`, visible keyboard focus rings, color contrast (`>= 4.5:1`), and clean `360px` mobile responsiveness.
- Maintain zero em/en-dashes (`\u2013` / `\u2014`) across repository text files per CI rules.
