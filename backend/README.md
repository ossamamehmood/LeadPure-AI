# LeadPure SMTP Verification Backend Service

This backend service provides dedicated **outbound TCP Port 25** SMTP mailbox probing and catch-all detection for **LeadPure AI**.

Because serverless platforms (e.g., Vercel, AWS Lambda) strictly block outbound TCP connections on Port 25, this service runs on any host with Port 25 enabled (such as a small VPS, DigitalOcean Droplet, Hetzner Cloud, AWS EC2 with unthrottled port 25, or Fly.io).

---

## Capabilities

1. **RFC 5321 SMTP Handshake**: Connects to the domain's primary MX server, issues `EHLO leadpure.ai`, `MAIL FROM:<verify@leadpure.ai>`, and `RCPT TO:<target>`.
2. **Catch-All Detection**: For every domain, probes a randomized 16-character nonexistent local part (`leadpure_catchall_<hex>@<domain>`). If the server accepts it (250 OK), the domain is flagged as **Catch-All** and capped at `RISKY`.
3. **Provider Anti-Spam Protection Parsing**: Accurately recognizes provider blocks (e.g., Microsoft Hotmail/Outlook S3150 / 550 5.7.1) and returns `UNKNOWN`, never upgrading inconclusive or blocked probes to `SAFE`.
4. **Reacher API Compatibility**: Implements `POST /v0/check_email` matching the open-source Reacher (`reacherhq/check-if-email-exists`) JSON schema.

---

## Quick Start (Deploying on a VPS)

### Option 1: Docker (Recommended)

```bash
cd backend
docker build -t leadpure-smtp-backend .
docker run -d -p 8080:8080 --name leadpure-smtp-verifier --restart always leadpure-smtp-backend
```

### Option 2: Node.js Directly

```bash
cd backend
npm install
npm start
```

---

## Connecting to LeadPure AI (Vercel Frontend)

Once your backend service is running at `http://<YOUR_VPS_IP>:8080`:

1. In your Vercel project settings (or local `.env`), add:
   ```env
   SMTP_BACKEND_URL="http://<YOUR_VPS_IP>:8080"
   ```
2. (Optional) Set an API key if you want to restrict access:
   ```env
   SMTP_BACKEND_API_KEY="your-secret-api-token"
   ```

LeadPure AI will automatically route mailbox deliverability checks to this service!

---

## Alternative: Self-Hosting Reacher Backend

Because LeadPure AI supports the standard Reacher API format, you can also run the official Reacher Docker container:

```bash
docker run -d -p 8080:8080 --name reacher reacherhq/backend:latest
```

And set:
```env
SMTP_BACKEND_URL="http://<YOUR_VPS_IP>:8080"
```
