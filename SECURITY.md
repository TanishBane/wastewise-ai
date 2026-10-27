# Security Policy

The **WasteWise AI** maintainers take software security, kitchen operational safety, and tenant data confidentiality seriously.

---

## Supported Versions

Security updates and vulnerability remediation are actively applied to the following release branches:

| Version / Branch | Supported | Notes |
| :--- | :--- | :--- |
| `main` | :white_check_mark: | Primary active release branch |
| Prior release tags | :x: | Upgrade to `main` for latest patches |

---

## Reporting a Vulnerability

If you discover a security vulnerability or sensitive data exposure in WasteWise AI, please **do not open a public issue or discussion**.

Instead, report it responsibly via one of the following methods:

1. **GitHub Security Advisory**: Navigate to the [Security Advisories tab](https://github.com/TanishBane/wastewise-ai/security/advisories) and select **Report a vulnerability**.
2. **Direct Maintainer Contact**: Contact the repository owner directly via the GitHub profile contact link: [Tanish Bane (@TanishBane)](https://github.com/TanishBane).

### Information to Include
- Detailed description of the vulnerability.
- Steps to reproduce (proof-of-concept script, curl commands, or request payloads).
- Potential impact and threat model.
- Suggested remediation, if identified.

### Response Timeline
- **Initial Acknowledgment**: Within 48 hours of report receipt.
- **Triage & Status Assessment**: Within 5 business days.
- **Fix & Disclosure Coordination**: We work with reporters on coordinated disclosure after fixes are released.

---

## Architectural Security Invariants

WasteWise AI is engineered with defensive security patterns across all operational layers:

### 1. Zero-Friction Public Demo Isolation
- In public demonstration mode (`WASTEWISE_DEMO_MODE=true`), all requests are pinned strictly to `DEFAULT_ORG_ID` (`guest`).
- Any unauthenticated attempt to supply a non-guest `X-Organization-Id` header is rejected immediately with HTTP 401 Unauthorized (`OrgMismatchError`).
- In-memory tenant isolation is enforced by the `OrgStateRegistry` service, preventing state bleeding across mock tenants.

### 2. SQL Injection Prevention
- All database queries are executed through SQLAlchemy 2.0 ORM query builders and parameterized bindings. Raw string interpolation and unsanitized queries are strictly prohibited.

### 3. Secret Hygiene & Environment Isolation
- Frontend build artifacts never embed backend secrets, database passwords, or administrative tokens. Only public endpoints (`VITE_API_BASE_URL`) may be exposed to the client bundle.
- `.env` and `.env.local` files are included in `.gitignore` and `.vercelignore` to prevent accidental credential leakage into version control.

### 4. Input Validation & Schema Enforcement
- All incoming HTTP payloads are validated against Pydantic v2 schemas with explicit type enforcement, regex bounds, and boundary checks.
- Uploaded CSV files undergo strict BOM stripping, required column validation, date range verification, and row-count bounding before processing.

---

## License & Attribution

WasteWise AI is licensed under the [MIT License](LICENSE). Copyright (c) 2026 Tanish Bane.
