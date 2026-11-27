# Verification Result Schema

Standardized verdict structure shared across `engine/probe.mjs`, `api/check.ts`, UI dashboards, and `.xlsx` exports.

---

## Result Fields

| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | `string` | Normalized contact address (`trimmed`, lowercase domain). |
| `status` | `'SAFE' \| 'RISKY' \| 'INVALID' \| 'UNKNOWN'` | Honest top-level deliverability bucket. |
| `sub_status` | `string` | Machine-readable cause (`mailbox_not_found`, `catch_all`, `disposable`, `greylisted`, etc.). |
| `failure_code` | `string` | Standardized diagnostic identifier (`ERR_001` through `ERR_009`). |
| `smtp_code` | `number \| null` | Final SMTP server reply code (e.g., `250`, `451`, `550`). |
| `mx_ip` | `string \| null` | Resolved primary Mail Exchange host or IP address. |
| `is_catchall` | `boolean` | Whether the domain accepts randomized nonexistent local parts. |
| `timestamp` | `string` | ISO-8601 completion timestamp. |

---

## Failure Code Reference

| Code | Layer | Meaning |
| :--- | :--- | :--- |
| **`ERR_001`** | Syntax | Malformed RFC 5321/5322 email structure. |
| **`ERR_002`** | DNS / MX | Missing domain or null-MX / dead DNS resolution. |
| **`ERR_003`** | SMTP | Mailbox rejected cleanly during SMTP probe (`550`). |
| **`ERR_004`** | Disposable | Known temporary/burner email service domain. |
| **`ERR_005`** | Catch-All | Accept-all configuration flagged honestly as `RISKY`. |
| **`ERR_006`** | Role | Generic alias (`support@`, `billing@`, `info@`) excluded when role filter enabled. |
| **`ERR_007`** | Greylist | Server asked to pause/retry temporarily (`4xx`). |
| **`ERR_008`** | Throttle | Provider rate guard triggered to preserve clean probe reputation. |
| **`ERR_009`** | Timeout | Connection or Port-25 egress blocked across retry attempts (`UNKNOWN`). |
