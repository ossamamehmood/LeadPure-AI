# Testing & Quality Gate Requirements

Every change to `main` must clear all static guards, verification assertions, deterministic tests, and production bundle checks (`ci.yml`).

---

## Required Checks

| Check | Command | Acceptance Criteria |
| :--- | :--- | :--- |
| **Engine Syntax & CI Guards** | `node --check engine/probe.mjs` | Zero syntax errors, zero `\u2013` / `\u2014` dashes, zero banned release strings (`ci.yml`). |
| **TypeScript Verification** | `npm run lint` | Zero `tsc --noEmit` compilation or type errors. |
| **Verification Suite** | `npm test` | **27/27** syntax, disposable, role, DNS MX, and end-to-end probe assertions pass. |
| **Determinism Check** | `npm run test-engine` | **10/10** consecutive iterations return identical deterministic validation states. |
| **Production Build** | `npm run build` | Clean Vite 8 production bundle with split chunks and zero asset errors. |
| **Live Browser QA** | `https://leadpureai.vercel.app/` | Zero console errors, zero horizontal overflow across `1440px` desktop & `360px` mobile, verified Dark/Light contrast & interactive workspace flow. |
