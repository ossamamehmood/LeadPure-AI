# Master Engineering Objectives

> [!NOTE]
> LeadPure is engineered for honest, deterministic deliverability verification that protects outbound sender reputation without guessing.

---

## Core Principles

| Principle | Commitment |
| :--- | :--- |
| **Deterministic Classification** | Identical inputs under identical server states produce identical statuses, counts, and `.xlsx` exports across runs. |
| **Strict-by-Design Labeling** | Only confirmed non-catch-all active mailboxes become `SAFE`. Unconfirmed timeouts (`UNKNOWN`) or accept-all domains (`RISKY`) are never promoted to `SAFE`. |
| **Zero Synthetic Scores** | Never fabricate artificial percentages or promise unreachable *"0% bounce"* guarantees. Surface real counts and honest explanations. |
| **Browser-Local Privacy** | Contact names, phone numbers (E.164), and extra spreadsheet columns stay strictly on the user device during cleanup. |

---

## System Checklist

1. **Syntax & Normalization**: RFC 5321/5322 validation, whitespace cleanup, and safe domain typo suggestions.
2. **Domain & MX Verification**: Live DNS resolution, RFC 7505 null-MX detection, and provider identification.
3. **Mailbox & Catch-All Probing**: Direct Port-25 `RCPT TO` probe (zero email sent), 2-pass retry on dropped connections, 30s greylist wait retry, and randomized catch-all check.
4. **Spreadsheet Hygiene**: `Title Case` normalization, international phone formatting (`libphonenumber-js`), duplicate filtering, and `.xlsx` export.
5. **Production SEO & UX**: Fast LCP/INP route-split Vite bundle, WCAG 2.2 keyboard/contrast accessibility, and complete structured metadata.
