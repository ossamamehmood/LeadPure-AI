# LeadPure-AI: Enterprise Email Validation System

## 1. PROJECT OVERVIEW
LeadPure-AI Private is an AI-powered email verification, validation, and lead cleaning system designed to reduce email bounce rates to near zero for email campaigns and outreach systems. The system processes Excel/CSV lead files and classifies emails based on deliverability risk.

## 2. CORE GOAL
The primary objective of this system is to achieve a **0% bounce rate** in real email campaigns, ensuring maximum possible accuracy in email validation and domain verification, and guaranteeing **100% deterministic output** across all environments.

Every email is accurately classified as:
- **VALID** (Safe to send)
- **INVALID** (Must be removed)
- **UNKNOWN** (Uncertain or failed verification, do NOT delete blindly)

## 3. VALIDATION LOGIC REQUIREMENTS
Each email must be validated using strict backend rules. **We do not rely on AI-based guessing.** Validation is strictly rule-based and deterministic:
1. Domain extraction from email
2. DNS + MX record verification (domain must exist and be active)
3. SMTP handshake validation (real mailbox check via Port 25)
4. Catch-all domain detection
5. Disposable email detection
6. Role-based email detection (optional)
7. Bounce-risk scoring system

## 4. CRITICAL SYSTEM PROBLEM
The system was previously non-deterministic—the same Excel file produced different results across environments (Google AI Studio, Localhost, GitHub deployment, Vercel production). This resulted in inconsistent lead counts and incorrect filtering. This is unacceptable, and the current architecture has been rebuilt to ensure absolute determinism.

## 5. COMPETITORS (REFERENCE BENCHMARK)
The system must match or exceed the accuracy, consistency, speed, and reliability of industry leaders:
- ZeroBounce
- NeverBounce
- MillionVerifier

## 6. SYSTEM REQUIREMENTS
### A. Deterministic Behavior
The same input file MUST always produce the exact same output count, the exact same valid/invalid classification, and the exact same processing result across all environments.

### B. Backend Only Changes (STRICT RULE)
- 🚫 DO NOT change UI
- 🚫 DO NOT redesign frontend
- 🚫 DO NOT modify UI logic or layout
- Only the backend, validation engine, and processing pipeline can be modified.

### C. Environment Independence
The system behaves identically everywhere. We have removed all dependencies on Google AI Studio runtime behavior, Vercel serverless quirks, local caching differences, and hidden memory/state behavior.

## 7. ARCHITECTURE EXPECTATION
The system follows this exact pipeline:
1. Upload Excel/CSV
2. Normalize data (clean emails, remove duplicates)
3. Extract domain
4. DNS/MX validation
5. SMTP verification (if applicable)
6. Disposable email check
7. Catch-all detection
8. Risk scoring
9. Final classification (VALID / INVALID / UNKNOWN)

## 8. PERFORMANCE REQUIREMENTS
- Fast batch processing
- Optimized API calls
- No unnecessary repeated DNS/SMTP checks
- Proper async handling (no race conditions)
- Consistent results under load

## 9. AGENTS DEFINITION
The rebuilding and maintenance of this system coordinates the following internal roles:
1. **System Architect Agent:** Defines correct architecture, ensures deterministic flow.
2. **Backend Engineer Agent:** Rewrites validation logic, fixes async issues, optimizes performance.
3. **Email Validation Specialist Agent:** Handles DNS, MX, SMTP logic, improves accuracy rules.
4. **QA / Testing Agent:** Tests the same file multiple times, ensures identical output across environments.

## 10. FINAL EXPECTATION
- Same Excel file = identical results everywhere
- No missing or randomly skipped rows
- No environment-based differences
- No silent failures
- No UI changes
- Fully production-ready backend system
