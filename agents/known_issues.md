# Historical Issues & Regression Guardrails

> [!IMPORTANT]
> Prevent reintroducing previously resolved engine, security, or UI regressions.

---

## Forbidden Patterns

| Anti-Pattern | Risk | Required Guardrail |
| :--- | :--- | :--- |
| **Optimistic `UNKNOWN -> SAFE` fallback** | Inflates deliverable count with unverified or blocked addresses that hard-bounce in production. | Keep stalled/timeout hosts cleanly as `UNKNOWN` and catch-all/greylist hosts as `RISKY`. |
| **Unbounded `Promise.all` or unchunked dispatch** | Exceeds GitHub `workflow_dispatch` 65,535-char cap and causes socket/runner stalls. | Enforce `<= 5,000` email cap and **100-email chunks** (max 3 concurrent workflows). |
| **Shell interpolation of inputs** | Creates command-injection vectors inside GitHub Actions bash steps. | Pass `REQUEST_ID`, `CHUNK_INDEX`, and `EMAILS_INPUT` strictly via `env:` variables with regex validation. |
| **`transition-all` / wrapper-blocked spacing** | Causes sticky/jittery animations and broken card padding/gaps (`LiquidSpotlightCard`). | Use explicit CSS transition properties and `contentClassName` on spotlight/glass wrappers. |
| **Unicode em/en-dashes & stale release strings** | Breaks CI static repo guards (`ci.yml`) or leaks dead version labels into public UI. | Keep copy plain and run static CI guards before committing. |

---

## Environmental Realities

- **Serverless Port-25 Egress Blocking**: Vercel Serverless Functions cannot open direct TCP Port-25 sockets; orchestration dispatches to ephemeral GitHub Actions Ubuntu Port-25 runners (`leadpure-check.yml`) with Azure/AWS node preflight checks.
- **Accept-All & Temporary Greylisting**: Target corporate firewalls frequently return ambiguous signals; 2-pass confirmation and 30s greylist retries recover strict temporary blocks while labeling persistent accept-all hosts honestly as `RISKY`.
