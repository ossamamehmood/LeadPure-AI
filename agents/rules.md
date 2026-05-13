# ⚖️ System Rules (The Constitution)

These are the non-negotiable engineering laws of LeadPure AI. All modifications must adhere to these constraints.

## 🔴 Hard Prohibitions
- **Never** classify `UNKNOWN` as `VALID`.
- **Never** silently skip rows or identities.
- **Never** use probabilistic "AI guessing" to determine deliverability.
- **Never** fallback to permissive validation logic.
- **Never** modify the Frontend UI without explicit authorization.

## 🟢 Deterministic Mandates
- **Law of Identity**: The same input MUST generate the same output across all environments.
- **Law of Completion**: All async operations must fully resolve before an export is generated.
- **Law of Visibility**: Every validation failure must produce a specific log and reason.

## 🔬 Validation Logic Constraints
- **SMTP Timeout Policy**: An SMTP timeout is NOT a success; it must be treated as `RISKY/INVALID`.
- **Catch-All Policy**: Catch-all domains are `INVALID` in strict mode. No exceptions.
- **Syntax Priority**: RFC syntax errors must trigger immediate rejection before network costs are incurred.
