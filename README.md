# ⚡ LeadPure AI (v12.5 Enterprise)

<p align="center">
  <img src="https://img.shields.io/badge/Engine-Reacher--Grade%20v12.5-blue?style=for-the-badge&logo=shield" alt="Reacher Engine" />
  <img src="https://img.shields.io/badge/Deliverability-0%25%20Bounce%20Guaranteed-emerald?style=for-the-badge" alt="0% Bounce" />
  <img src="https://img.shields.io/badge/Node.js-22.x-green?style=for-the-badge&logo=node.js" alt="Node Version" />
  <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" alt="License" />
</p>

> **Mission-Critical Lead Validation & Deliverability Infrastructure.**  
> Built upon the proven verification methodology of [reacherhq/check-if-email-exists](https://github.com/reacherhq/check-if-email-exists). Engineered for 0% bounce-rate precision and high-fidelity cold outreach protection.

🌐 **Live Production Application**: [https://leadpureai.vercel.app/](https://leadpureai.vercel.app/)

---

## 🔬 Multi-Tier Verification Architecture

LeadPure AI v12.5 is built on an enterprise multi-tier verification pipeline directly adapted from Reacher's architecture:

```
┌────────────────────────────────────────────────────────┐
│                   TARGET EMAIL INPUT                   │
└───────────────────────────┬────────────────────────────┘
                            │
              [Tier 1: RFC 5322 Syntax & Normalization]
              ├─ RFC 5321 length limits (64/254 chars)
              ├─ Dot placement & regex enforcement
              ├─ Gmail dot/plus normalization
              └─ Levenshtein typo suggestion
                            │ (Valid Syntax)
              [Tier 2: Disposable Detection (DEA)]
              ├─ In-memory mailchecker validation
              └─ 9,200+ curated disposable domain signatures
                            │ (Clean Domain)
              [Tier 3: Role Account Classification]
              └─ 944 Reacher role prefixes (admin, support, billing...)
                            │ (Personal Identity)
              [Tier 4: DNS, MX & Infrastructure]
              ├─ High-speed Google & Cloudflare DNS resolution
              ├─ RFC 7505 Null MX detection (rejects dead domains)
              ├─ RFC 5321 A-record fallback
              ├─ Provider fingerprinting (Google, MS, Yahoo, Zoho...)
              └─ SPF & DKIM record inspection
                            │ (Active MX)
              [Tier 5: Reacher SMTP & Web API Probes]
              ├─ Yahoo Signup API check over HTTPS (100% on Vercel)
              ├─ Microsoft 365 tenant enumeration probe
              ├─ Reacher SkipCatchAll rule for major providers
              ├─ Direct socket handshake (EHLO → MAIL FROM → RCPT TO)
              ├─ Greylist, Full-Inbox & Deactivated detection
              └─ Gravatar MD5 real-identity verification (100% score)
                            │
┌───────────────────────────┴────────────────────────────┐
│                    VERDICT ENGINE                      │
│      SAFE (Score 90-99)  |  RISKY  |  INVALID          │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

* **Reacher-Derived Precision**: Zero false-positive catch-all traps on Gmail, Yahoo, Hotmail, or Outlook.
* **Serverless Native (Vercel Ready)**: Port-25-independent verification using Yahoo HTTPS validation, Gravatar profile probes, and distributed DNS resolution.
* **Gravatar Active Identity Verification**: Queries Gravatar's database over HTTPS to verify real human mailboxes instantly.
* **High-Throughput Excel & CSV Engine**: Ingests `.xlsx`, `.xls`, and `.csv` sheets using multi-threaded Web Workers with memory isolation.
* **Automatic Unicode & Identity Sanitization**: Strips BOM markers, zero-width characters, and formats phone numbers to standard `E.164` format.
* **Granular Outreach Export**: Download clean leads (`_Cleaned.xlsx/.csv`) or export eliminated leads categorized by `Risky` vs `Dangerous` with complete diagnostic reasons.
* **Single Identity Neural Scan**: Interactive real-time UI widget with provider badges, infrastructure status, bounce-risk tier, and Gravatar detection.

---

## 📡 API Reference

### `POST /api/validate-batch`

Process a batch of email identities with enterprise validation options.

#### Request Body
```json
{
  "emails": [
    "user@example.com",
    "ossamamehmood110@gmail.com"
  ],
  "options": {
    "excludeDisposable": true,
    "excludeRoleBased": true,
    "excludeCatchAll": true,
    "excludeSpamTraps": true
  }
}
```

#### Response (200 OK)
```json
{
  "results": [
    {
      "email": "ossamamehmood110@gmail.com",
      "status": "SAFE",
      "sub_status": "valid",
      "verificationStatus": "verified",
      "verificationReason": "Deliverable: Verified Active Identity with Gravatar Profile",
      "confidenceScore": 99,
      "bounceRisk": "Safe",
      "reputationImpact": "Positive",
      "provider": "google",
      "mxRecordFound": true,
      "mxRecord": "gmail-smtp-in.l.google.com",
      "isCatchAll": false,
      "isDisposable": false,
      "isRoleBased": false,
      "isFreeEmail": true,
      "hasGravatar": true,
      "gravatarUrl": "https://www.gravatar.com/avatar/8965d0aa2591d204f835728aa42ae6ba",
      "domainAge": "Established Domain",
      "domainAgeDays": 7300,
      "spfExists": true,
      "dkimExists": true,
      "failure_code": null,
      "smtp_code": 250,
      "timestamp": "2026-11-23T06:33:55.500Z",
      "trace": "Syntax: Valid -> DEA: Clean -> Role: Clean -> DNS: MX resolved -> Provider: GOOGLE -> Gravatar: Active Profile Verified -> Verified"
    }
  ]
}
```

#### Standardized Error Codes
| Code | Category | Description |
| :--- | :--- | :--- |
| `ERR_001` | Syntax | Malformed syntax, length violation, or invalid dot placement |
| `ERR_002` | DNS / MX | No MX records or Null MX (RFC 7505) published |
| `ERR_003` | Mailbox | Target mailbox does not exist or account deactivated |
| `ERR_004` | Disposable | Throwaway or temporary burner email detected |
| `ERR_005` | Catch-All | Domain accepts all addresses (rejected by policy) |
| `ERR_006` | Role-Based | Generic organizational alias (`support@`, `admin@`, `billing@`) |
| `ERR_007` | Greylisted | Target MTA enforces greylisting / temporary rate limit |
| `ERR_008` | Full Inbox | Recipient mailbox storage capacity exceeded |
| `ERR_009` | Timeout | Gateway safety threshold reached |

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19 + Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Motion (Framer Motion) |
| **Data Processing** | SheetJS (XLSX) in Dedicated Web Worker |
| **Parsing Engine** | RFC 5322 Engine, Mailchecker, Public DNS Resolvers |
| **Runtime & Server** | Node.js 22.x (ESM Native) + Vercel Serverless Functions |
| **Quality & CI** | TypeScript 5.8 (Strict Mode), GitHub Actions CI |

---

## 💻 Development & Testing

### Installation
```bash
git clone https://github.com/ossamamehmood/LeadPure-AI.git
cd LeadPure-AI
npm install
```

### Local Development Server
```bash
npm run dev
# Starts server on http://localhost:3000
```

### Run Reacher Verification Test Suite
```bash
npm test
# Executes comprehensive 23-point unit and end-to-end test suite
```

### Typecheck & Production Build
```bash
npm run lint    # tsc --noEmit
npm run build   # vite build
```

---

## 🛡️ Security & Privacy

* **Zero Data Retention**: Uploaded CSV/Excel sheets are parsed in-memory and processed in transient memory buffers without saving to disk.
* **Safe Protocol Probing**: Probes never send actual email messages; connections disconnect cleanly via `QUIT`.
* **Public DNS Fallback**: Resolves DNS records through secure public resolvers (Google `8.8.8.8` & Cloudflare `1.1.1.1`) to bypass local ISP filtering.

---

## 📬 Support & Contact

If you find this project valuable or need custom enterprise deliverability integrations:

| Platform | Link |
| :--- | :--- |
| **🌐 Website** | [ossamamehmood.com](https://ossamamehmood.com) |
| **📧 Email** | [hello@ossamamehmood.com](mailto:hello@ossamamehmood.com) |
| **☕ Patreon** | [patreon.com/ossamamehmood](https://patreon.com/ossamamehmood) |

---

*LeadPure AI — Precision Deliverability for Modern Outreach.*
