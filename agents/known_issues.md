# ⚠️ Known Issues & Forbidden Regressions

This document tracks historical bugs and environmental limitations to prevent regression.

## 🔴 Historical Regressions (Do Not Repeat)
- **Permissive Fallback**: Reverting to "Unknown = Valid" logic to artificially inflate lead counts. This is strictly forbidden.
- **Unstable Async**: Using `Promise.all` without chunking/throttling, leading to Vercel socket exhaustion.
- **Missing `cn` Imports**: Causing runtime UI crashes on individual email scans.

## 🟠 Environmental Limitations
- **Vercel SMTP Timeouts**: Serverless functions have a 10s hard limit. High-latency mail servers may trigger timeouts.
- **Inconsistent DNS Resolution**: Some ISP-level DNS caching can cause slight delays in MX resolution.
- **Concurrency Caps**: Excessive concurrent SMTP probes can trigger provider-level IP throttling.

## 🟡 Pending Improvements
- Implementation of a more granular `debug-results.csv`.
- Optimization of the greylisting retry window.
