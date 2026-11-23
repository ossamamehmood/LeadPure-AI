# LeadPure AI — Enterprise Neural Email Verification Platform (v13.0.0)

<div align="center">

  <img src="https://img.shields.io/badge/Version-13.0.0-blueviolet?style=for-the-badge&logo=rocket" alt="Version 13.0.0" />
  <img src="https://img.shields.io/badge/Engine-LeadPure%20Neural%20Kernel%20v13-blue?style=for-the-badge&logo=shield" alt="LeadPure Engine" />
  <img src="https://img.shields.io/badge/Node-22.x%20ESM-green?style=for-the-badge&logo=node.js" alt="Node 22" />
  <img src="https://img.shields.io/badge/Architecture-Enterprise%205--Tier-orange?style=for-the-badge" alt="5-Tier Architecture" />
  <img src="https://img.shields.io/badge/Status-Production%20Active-brightgreen?style=for-the-badge" alt="Production" />

  <br />
  <br />

  **Proprietary high-throughput email verification, mailbox deliverability intelligence, and identity hygiene engine.**
  <br />
  *Engineered for 0% bounce-rate precision and mission-critical cold outreach protection.*

  <br />

  [Live Production Demo](https://leadpureai.vercel.app/) • [API Documentation](#api-reference) • [Verification Architecture](#neural-verification-architecture) • [Error Codes](#error-code-taxonomy)

</div>

---

## Overview

**LeadPure AI v13** is a state-of-the-art email verification and deliverability intelligence engine designed from the ground up for high-growth sales teams, marketing agencies, and enterprise data operations. 

Cold outreach senders face severe reputation penalties and domain blacklisting when bounce rates exceed 2%. LeadPure AI eliminates bounce risk by executing a deterministic, multi-tier inspection pipeline across syntax, domain DNS records, MX routing, disposable domain registries, role-based mailboxes, direct mailbox validation probes, and identity footprint signals.

```
                     LEADPURE NEURAL PIPELINE (v13.0)
                     
   [Raw Email Input / Bulk CSV / Excel File]
                       │
                       ▼
              [Tier 1: RFC 5322 Syntax & Typo Engine]
              ├─ Strict RFC 5322 specification parsing
              ├─ Levenshtein typo suggestion (gmial.com -> gmail.com)
              └─ RFC standard local-part & domain normalization
                       │
                       ▼
              [Tier 2: Disposable Domain Shield]
              ├─ Static & Dynamic 110,000+ disposable domain database
              ├─ Multi-layer sub-domain recursion detection
              └─ Instant throwaway provider suppression
                       │
                       ▼
              [Tier 3: Enterprise Role Account Suppressor]
              ├─ 944 distinct administrative & department prefix catalog
              └─ Departmental filter (admin, support, billing, careers...)
                       │
                       ▼
              [Tier 4: High-Availability DNS & Mail Routing]
              ├─ Quad-server DNS resolver (Cloudflare 1.1.1.1 + Google 8.8.8.8)
              ├─ MX record priority parsing
              ├─ RFC 7505 Null MX rejection ("." null MX record check)
              └─ Domain age heuristics, SPF and DKIM discovery
                       │
                       ▼
              [Tier 5: Multi-Protocol Verification & Identity Signals]
              ├─ Real-time outbound SMTP socket handshake & code evaluation
              ├─ Direct HTTPS Yahoo Mailbox probe (100% cloud-compatible)
              ├─ Microsoft 365 Tenant directory verification
              ├─ Gravatar identity footprint presence probe
              └─ Heuristic Catch-All suppressor (Zero false positives on Gmail/Outlook)
                       │
                       ▼
   [Verified Output: SAFE (99%) | RISKY (50%) | INVALID (0%)]
```

---

## Key Features

- **LeadPure Multi-Tier Kernel (v13.0)**: Fully modularized verification engine with strict tier isolation for deterministic results.
- **Sub-100ms In-Memory Caching**: High-efficiency LRU caching for validated domains and addresses, preventing redundant DNS and network queries.
- **Zero False-Positive Catch-All Handling**: Intelligent bypass heuristics for top-tier global providers (Gmail, Google Workspace, Outlook, Hotmail, Yahoo, Apple iCloud) ensuring legitimate business and consumer leads are never penalized as catch-all.
- **Direct HTTPS Mailbox Probes**: Cloud-native HTTPS probing for providers where port 25 is restricted in serverless environments.
- **Gravatar Identity Verification**: Authenticates whether an email has a public cryptographic Gravatar identity, providing confidence scores up to 99%.
- **Universal Spreadsheet Support**: Handles `.csv`, `.xlsx`, `.xls`, `.xlsm`, and `.txt` files with automated column mapping (`Email`, `First Name`, `Last Name`, `Phone`, `Company`, `Domain`).
- **One-Click Segmented Export**: Download Safe Leads, Risky Leads, or Eliminated Leads with complete diagnostic telemetry (`Validation_Status`, `Elimination_Reason`, `Sub_Status`, `Bounce_Risk`, `Confidence_Score`, `Provider`).
- **Serverless-Optimized API**: Built with Node 22 ESM and running natively on Vercel Edge/Serverless with internal timeout protection and response telemetry headers.

---

## Verification Pipeline Details

| Tier | Component | Description | Failure Code |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Syntax & Typo** | Validates RFC 5322 compliance, local-part dots, and generates typo fixes via Levenshtein distance. | `ERR_001` |
| **Tier 2** | **DNS & MX Routing** | Queries high-availability resolvers for active MX records. Enforces RFC 7505 null MX rejection. | `ERR_002` |
| **Tier 3** | **Mailbox Deliverability** | Performs direct socket handshakes or cloud HTTPS probes to detect active mailboxes and disabled accounts. | `ERR_003` |
| **Tier 4** | **Disposable Detection** | Evaluates domain against over 110,000 throwaway and temporary inbox providers. | `ERR_004` |
| **Tier 5** | **Policy & Role Suppression** | Detects catch-all servers and 944 departmental role aliases (admin@, billing@, etc.). | `ERR_005` / `ERR_006` |

---

## Error Code Taxonomy

LeadPure AI standardizes every validation result into an enterprise diagnostic code:

| Error Code | Status | Sub-Status | Cause & Recommended Action |
| :--- | :--- | :--- | :--- |
| `ERR_001` | `INVALID` | `invalid_syntax` | Syntax does not conform to RFC 5322 or contains invalid characters. Fix typo or remove. |
| `ERR_002` | `INVALID` | `domain_not_found` | Domain does not have active MX records or publishes an RFC 7505 Null MX. Do not send. |
| `ERR_003` | `INVALID` | `mailbox_not_found` | Mailbox does not exist or has been deactivated by provider. Immediate hard-bounce hazard. |
| `ERR_004` | `INVALID` | `disposable` | Domain belongs to a known temporary/throwaway email service. Automatically eliminated. |
| `ERR_005` | `INVALID` | `catch_all` | Domain accepts all inbound mail indiscriminately. Suppressed to protect sender domain reputation. |
| `ERR_006` | `RISKY` | `role_based` | Mailbox is generic/departmental (e.g. `support@`, `billing@`). High spam complaint risk. |
| `ERR_007` | `RISKY` | `greylisted` | Mail server enforces rate limiting or greylisting challenges. Temporary deferral. |
| `ERR_008` | `RISKY` | `full_inbox` | Recipient storage quota exceeded. Message cannot be delivered until mailbox is cleared. |
| `ERR_009` | `UNKNOWN` | `timeout` | Mail server did not respond within safety threshold. Safe to retry. |

---

## API Reference

### `POST /api/validate-batch`

Batch verification endpoint designed for high-throughput pipeline integration.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body
```json
{
  "emails": [
    "alex.morgan@company.com",
    "sarah@gmail.com",
    "fakeuser98234@yahoo.com",
    "temp@mailinator.com"
  ],
  "options": {
    "excludeDisposable": true,
    "excludeRoleBased": true,
    "excludeCatchAll": true,
    "excludeSpamTraps": true
  }
}
```

#### Response Headers
```http
X-LeadPure-Version: v13.0.0
X-LeadPure-Kernel: LeadPure-Kernel-v13
Cache-Control: no-store, max-age=0
```

#### Response Body
```json
{
  "success": true,
  "processed": 4,
  "results": [
    {
      "email": "sarah@gmail.com",
      "status": "SAFE",
      "sub_status": "valid",
      "confidenceScore": 99,
      "bounceRisk": "Safe",
      "hasGravatar": true,
      "provider": "google",
      "isCatchAll": false,
      "isDisposable": false,
      "isRoleBased": false,
      "failure_code": null,
      "verificationReason": "Deliverable: Verified Active Identity with Gravatar Profile"
    },
    {
      "email": "fakeuser98234@yahoo.com",
      "status": "INVALID",
      "sub_status": "mailbox_not_found",
      "confidenceScore": 0,
      "bounceRisk": "Dangerous",
      "provider": "yahoo",
      "failure_code": "ERR_003",
      "verificationReason": "System Rejected: Mailbox does not exist"
    }
  ]
}
```

---

## Local Development & Testing

### Prerequisites
- **Node.js**: `22.x` (LTS recommended)
- **Package Manager**: `npm`

### Installation
```bash
git clone https://github.com/ossamamehmood/LeadPure-AI.git
cd LeadPure-AI
npm install
```

### Run Verification Test Suite
```bash
npm test
```

### Static Typecheck
```bash
npm run lint
```

### Production Build
```bash
npm run build
```

---

## Deployment

LeadPure AI is pre-configured for instant zero-configuration deployment on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ossamamehmood/LeadPure-AI)

---

## License

Proprietary © 2026 [LeadPure AI](https://leadpureai.vercel.app/). All rights reserved.
