# Optional SMTP Verification Daemon (`backend/`)

> [!NOTE]
> **Production LeadPure runs verification out of the box** via `engine/probe.mjs` on ephemeral GitHub Actions Port-25 runners with zero VPS required. Use this standalone `backend/` daemon only if you want to self-host a dedicated TCP Port-25 node.

---

## Overview

Cloud serverless hosts (such as Vercel Serverless Functions and AWS Lambda) block outbound TCP Port 25 by default. This lightweight Node.js / Express daemon exposes a direct Port-25 verification endpoint designed for VPS hosts with open Port-25 egress.

### Capabilities

| Feature | Behavior |
| :--- | :--- |
| **RFC 5321 Socket Probe** | Resolves MX via DNS (`8.8.8.8` / `1.1.1.1`) and runs `EHLO leadpure.ai` -> `MAIL FROM:<verify@leadpure.ai>` -> `RCPT TO:<target>` without delivering messages. |
| **Catch-All Detection** | Tests a randomized 16-character local part on the target domain and caps accept-all domains honestly at `RISKY`. |
| **Provider Block Awareness** | Maps policy blocks cleanly to `UNKNOWN` rather than falsely promoting blocked connections to `SAFE`. |
| **Standard JSON Schema** | Implements `POST /v0/check_email` compatible with standalone SMTP worker deployments. |

---

## Deployment Options

<details>
<summary><strong>Option 1: Docker (Recommended)</strong></summary>

```bash
cd backend
docker build -t leadpure-smtp-backend .
docker run -d \
  -p 8080:8080 \
  --name leadpure-smtp-verifier \
  --restart always \
  -e SMTP_BACKEND_API_KEY="your-secret-api-token" \
  leadpure-smtp-backend
```

</details>

<details>
<summary><strong>Option 2: Node.js Directly</strong></summary>

```bash
cd backend
npm install
npm start
```

</details>

---

## Configuration

| Variable | Required | Description |
| :--- | :---: | :--- |
| `PORT` | Optional | Listener port (defaults to `8080`). |
| `SMTP_BACKEND_API_KEY` | Recommended | Bearer / API secret token to protect the daemon (`AUTH_TOKEN` also supported). |
