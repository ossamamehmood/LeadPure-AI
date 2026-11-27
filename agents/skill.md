# Deliverability Intelligence Specification

> [!NOTE]
> Layered verification blueprint pairing strict client-side hygiene with real-time network & SMTP verification in `engine/probe.mjs`.

---

## Verification Stages

| Layer | Stage | Purpose |
| :---: | :--- | :--- |
| **1** | **RFC Syntax & Typo Check** | Validates email formatting (`RFC 5321/5322`) and suggests domain typo fixes without network cost. |
| **2** | **DNS MX & Null-MX Check** | Confirms active MX records and rejects RFC 7505 null-MX hosts immediately (`ERR_002`). |
| **3** | **Disposable Provider Filter** | Blocks throwaway burner domains (`mailchecker` & blocklists) prior to SMTP handshakes. |
| **4** | **Role Account Classification** | Identifies shared aliases (`info@`, `admin@`, `support@`, `billing@`) for safer segmentation. |
| **5** | **Direct Port-25 SMTP Probe** | Executes `EHLO` -> `MAIL FROM` -> `RCPT TO` without sending an actual email message. |
| **6** | **2-Pass Rejection Recovery** | Retries dropped/blocked first replies from a secondary sender path (`IDENTITY_A -> IDENTITY_B`) plus 30s greylist wait retries. |
| **7** | **Catch-All & Forwarding Guard** | Tests randomized local parts for accept-all domains and handles ImprovMX / ForwardEmail / Cloudflare forwarding safely. |
| **8** | **Browser-Local List Hygiene** | Formats contact names (`Title Case`), standardizes E.164 phone numbers (`libphonenumber-js`), and suppresses duplicates locally. |

---

## Honest Classification Philosophy

LeadPure prioritizes **deliverability protection over inflated Safe counts**:

- **SAFE**: Confirmed live inbox on a non-catch-all, non-disposable domain.
- **RISKY**: Accept-all, forwarding, or temporary soft-fail domains held cleanly out of the Safe list.
- **INVALID**: Hard syntax, missing MX, disposable, or confirmed `550` user-unknown rejections.
- **UNKNOWN**: Unconfirmed due to temporary network blocks or carrier rate limits.
