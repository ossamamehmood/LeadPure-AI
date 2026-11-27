# Internal Engineering Roles

> [!NOTE]
> LeadPure engineering responsibilities follow strict separation between client hygiene, stateless API orchestration, SMTP probing, and UI reliability.

---

| Role | Scope | Core Responsibilities |
| :--- | :--- | :--- |
| **System Architect** | `api/check.ts`, `vercel.json` | Enforce deterministic state transitions, chunked job manifests, and local/Vercel deployment parity. |
| **Backend & Engine Engineer** | `engine/probe.mjs`, `engine/run-ci-probe.sh` | Maintain zero-dependency DNS/MX/Port-25 probes, 2-pass retry logic, 30s greylist waits, and forwarding safeguards. |
| **QA & Reliability Agent** | `test-engine.ts`, `test-determinism.ts` | Verify 27/27 regression assertions, 10-iteration deterministic parity, and exact `.xlsx` row reconciliation. |
| **Deliverability Specialist** | `src/lib/smtp.ts`, `DeliverabilityPage.tsx` | Calibrate provider classification, catch-all detection, null-MX rules (RFC 7505), and honest taxonomy labels. |
| **UI & Accessibility Lead** | `src/components/*`, `src/index.css` | Maintain unified `.liquid-glass` optics, Dark/Light contrast, accessible keyboard controls, and `360px`+ responsiveness. |
| **Security Auditor** | `SECURITY.md`, `.github/workflows/*` | Enforce regex-validated inputs, env-only workflow secrets, HSTS/CSP-safe headers, and 7-day `results` cleanup. |
