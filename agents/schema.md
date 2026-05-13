# 📊 Data Schema & Validation Enums

This document defines the standardized data structures for the LeadPure AI validation engine to ensure consistency across the Network, Processor, and UI layers.

---

## 🏗 Standardized Validation Object
Every validation result MUST adhere to this structure.

| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | `string` | The normalized email identity. |
| `status` | `enum` | The top-level classification (SAFE, RISKY, INVALID, UNKNOWN). |
| `sub_status` | `string` | Human-readable specific reason for the result. |
| `failure_code` | `string` | Standardized error code (ERR_XXX) for programmatic handling. |
| `smtp_code` | `number \| null` | The last recorded SMTP response code (e.g., 250, 550). |
| `mx_ip` | `string \| null` | The resolved IP address of the primary MX server. |
| `is_catchall` | `boolean` | Whether the domain accepts all incoming identities. |
| `timestamp` | `string` | ISO 8601 timestamp of the validation event. |

---

## 🏷 Status Enum (The Four Pillars)
These are the only permitted top-level classifications.

- **`SAFE`**: 100% verified deliverable mailbox. Zero detected bounce risk.
- **`RISKY`**: Greylisted, timeout, or uncertain infrastructure signals. High probability of soft-bounce.
- **`INVALID`**: Confirmed non-deliverable mailbox or infrastructure. Guaranteed hard bounce.
- **`UNKNOWN`**: Processing failure or external API timeout prevents definitive classification.

---

## 🚫 Failure Code Mapping
Used to track the exact point of failure within the 10-layer protocol.

| Code | Layer | Description |
| :--- | :--- | :--- |
| **`ERR_001`** | **Syntax** | RFC 5321/5322 Malformation. |
| **`ERR_002`** | **DNS/MX** | No valid MX records or DNS resolution failure. |
| **`ERR_003`** | **SMTP** | Socket handshake failure (e.g., 550 Mailbox Not Found). |
| **`ERR_004`** | **DEA** | Disposable/Temporary email provider detected. |
| **`ERR_005`** | **Catch-All** | Domain accepts all addresses (Policy Suppression). |
| **`ERR_006`** | **Role** | Role-based identity suppression (`info@`, `admin@`). |
| **`ERR_007`** | **Greylist** | Target server is delaying acceptance (Temporary Fail). |
| **`ERR_008`** | **Throttle** | Validation stopped to prevent provider-level IP ban. |
| **`ERR_009`** | **Timeout** | Internal engine timeout reached before completion. |

---

## 🧪 Integration Law
The **QA Agent** must verify that all export files (`Cleaned` and `Filtered`) map their internal `verificationStatus` correctly to these enums. Any drift in naming conventions (e.g., using `rejected` instead of `INVALID`) must be corrected at the processing layer.
