# System Architecture Blueprint

> [!NOTE]
> LeadPure follows a unidirectional, stateless pipeline combining browser-local parsing with ephemeral Port-25 execution.

---

## Data Flow

```mermaid
graph TD
    A["Frontend UI (React 19 + Vite 8 + Tailwind v4)"] --> B["Local Upload & Web Worker (src/workers/xlsxWorker.ts)"]
    B --> C["Local Contact Formatter (Title Case + E.164 Phone)"]
    C --> D["Vercel Serverless Orchestrator (api/check.ts)"]

    subgraph "Verification Kernel (engine/probe.mjs)"
        D --> D1["RFC 5321/5322 Syntax & Typo Check"]
        D1 --> D2["DNS MX & RFC 7505 Null-MX Lookup"]
        D2 --> D3["Disposable & Role Filters"]
        D3 --> D4["Port-25 SMTP Handshake + 2-Pass Retry"]
        D4 --> D5["Catch-All & Forwarding Guard"]
    end

    D5 --> E["Manifest & Chunk Store (results branch)"]
    E --> F["GET /api/check Poller + useLeadProcessor"]
    F --> G["Results Dashboard + LeadPure_Results_<YYYY-MM-DD>.xlsx"]
```

---

## Core Modules

| Layer | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend Workspace** | React 19, Vite 8, Motion | Route-split SPA (`/` marketing, `/dashboard` workspace, `/deliverability`, `/pricing`, `/privacy`, `/terms`). |
| **Spreadsheet Worker** | `src/workers/xlsxWorker.ts` | Non-blocking `.xlsx` / `.csv` / `.xls` parsing up to **5,000 rows** locally in browser memory. |
| **API Orchestrator** | `api/check.ts` (Vercel Serverless) | Sanitizes payloads, chunks lists (`100` rows/chunk, max 3 concurrent runs), and reads `results` manifests. |
| **SMTP Probe Runner** | `engine/probe.mjs` on GitHub Actions | Pure Node.js Port-25 verifier with Azure/AWS Port-25 preflight gate and `results` commit publisher. |
