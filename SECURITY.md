# Security Policy

## Supported Versions

Only the latest version of LeadPure AI (currently v10.0 Enterprise) is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 10.0.x  | :white_check_mark: |
| < 10.0  | :x:                |

## Reporting a Vulnerability

We take the security of LeadPure AI seriously. If you believe you have found a security vulnerability, please report it to us immediately.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to hello@ossamamehmood.com with the following details:
-   Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
-   Full paths of source file(s) related to the manifestation of the issue
-   The location of the affected source code (tag/branch/commit or direct URL)
-   Any special configuration required to reproduce the issue
-   Step-by-step instructions to reproduce the issue
-   Proof-of-concept or exploit code (if possible)
-   Impact of the issue, including how an attacker might exploit the issue

We prefer all communications to be in English.

## Our Response

After we receive your report:
-   We will acknowledge receipt of your report within 48 hours.
-   We will send a status update every 7 days until the issue is resolved.
-   We will provide an estimated timeframe for a fix.
-   We will notify you once the vulnerability has been patched.

## Third-Party Dependencies

LeadPure AI relies on several third-party libraries. We monitor these dependencies for known vulnerabilities using tools like `npm audit` and `Snyk`. 

**Note on SheetJS (xlsx):** As of v10.0, we have moved to the official SheetJS CDN distribution to ensure protection against known Prototype Pollution and ReDoS vulnerabilities found in the legacy npm versions.
