# e-Maap Verify: Security Architecture & Threat Mitigation Framework
**Smart India Hackathon (SIH) — Problem Statement ID: 26036**  
**Department of Consumer Affairs (DoCA), Ministry of Consumer Affairs, Food & Public Distribution**  
**System Security Specification & Compliance Manual**

---

## 1. Security Philosophy & Principles

The **e-Maap Verify** platform governs statutory legal metrology data across India, including commercial trade certifications, legal stamping records, and officer enforcement decisions. Consequently, the application operates under a **Zero-Trust Security Model** characterized by:
1. **Never Trust, Always Verify:** Every inbound request is verified for authentication, authorized role, request structure, input hygiene, and tenant ownership.
2. **Defense-in-Depth:** Multiple overlapping security controls ensure that the failure of any single layer does not expose sensitive data.
3. **Least Privilege Principle:** Users, officers, and administrators are granted the absolute minimum permissions required for their official duties.
4. **Tamper-Evident Records:** Statutory certifications and audit trails incorporate cryptographic digests that expose any post-facto modification.

---

## 2. Multi-Layered Security Middleware Stack

The platform implements a seven-layer middleware pipeline before request handling:

```
[ Inbound HTTP Request ]
          │
          ▼
1. Helmet 8.3 Security Headers
          │
          ▼
2. CORS Origin Verification
          │
          ▼
3. Rate Limiting (express-rate-limit)
          │
          ▼
4. HTTP Parameter Pollution Guard (hpp)
          │
          ▼
5. Request Security Guard (NoSQL & Prototype Defense)
          │
          ▼
6. Deep XSS & Script Tag Sanitizer
          │
          ▼
7. JWT Authentication & RBAC Authorization
          │
          ▼
[ Express Business Controller ]
```

### 2.1 Layer 1: Helmet 8.3 & HTTP Security Headers
Configured in `backend/app.js`:
- **Content-Security-Policy (CSP):** Restricts the origins from which scripts, styles, fonts, and images may load. In container and development environments, frameguards allow required embedding for AI Studio preview while maintaining strict production directives.
- **X-Content-Type-Options (`nosniff`):** Mandates that browsers adhere to declared MIME types, preventing MIME-confusion attacks.
- **X-XSS-Protection (`1; mode=block`):** Activates native browser XSS filters.
- **X-Download-Options (`noopen`):** Prevents Internet Explorer from executing downloads in the site's context.

### 2.2 Layer 2: CORS (Cross-Origin Resource Sharing)
- Enforces strict origin matching against configured `CLIENT_URL` and `APP_URL`.
- Permitted methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`.
- Permitted headers: `Content-Type`, `Authorization`, `X-Requested-With`, `Accept`.
- Credentials support enabled for authenticated cross-origin API calls.

### 2.3 Layer 3: Dynamic Rate Limiting (`backend/middleware/rateLimitMiddleware.js`)
Protects against brute-force password cracking, credential stuffing, and Denial-of-Service (DoS) attacks.
- **Authentication Limiter (`authRateLimiter`):**
  - Targets: `/api/auth/login`, `/api/auth/register`, password resets.
  - Window: 15 minutes (`15 * 60 * 1000` ms).
  - Maximum Requests: **25 attempts per IP**.
  - Response on breach: HTTP 429 Too Many Requests with explicit `Retry-After` header.
- **General API Limiter (`apiRateLimiter`):**
  - Targets: All application routes.
  - Window: 1 minute (`60 * 1000` ms).
  - Maximum Requests: **150 requests per IP**.
- **Client IP Resolution:** Utilizes a secure proxy-aware IP extractor reading the leading entry in `X-Forwarded-For` to prevent IP spoofing behind reverse proxies.

### 2.4 Layer 4: HTTP Parameter Pollution (`hpp`)
Mounted globally in `backend/app.js` to protect query strings and request bodies from parameter duplication attacks (e.g. `?role=user&role=admin`).

---

## 3. Injection Prevention & Input Sanitization

### 3.1 NoSQL Operator Injection Defense (`backend/middleware/securityMiddleware.js`)
MongoDB queries can be vulnerable to operator injection when unvetted user input contains `$`-prefixed operators (such as `{"$ne": ""}` or `{"$gt": ""}`).
- The `requestSecurityMiddleware` inspects `req.query`, `req.body`, and `req.params`.
- Any key matching `/^\$/` or containing dot notation paths designed to manipulate internal Mongoose query operators is intercepted.
- Violation outcome: **HTTP 400 Bad Request** with a security violation log:
  ```json
  {
    "success": false,
    "message": "Security Violation: MongoDB query operators ($) and nested dot properties are strictly prohibited in user inputs."
  }
  ```

### 3.2 Prototype Pollution Defense
- Inspects URLs, query strings, and payloads for `__proto__`, `constructor[prototype]`, `constructor.prototype`, and encoded variants (`%5Bprototype%5D`).
- Prevents object prototype poisoning that could lead to remote code execution or authorization bypass.

### 3.3 Cross-Site Scripting (XSS) Prevention
- Inbound parameters are screened for `<script>` tags, inline event handlers (`onload=`, `onerror=`), and `javascript:` pseudo-protocols.
- Strings entering `req.body` undergo recursive cleaning using the `xss` library (`deepSanitize`), stripping unapproved HTML before storage.

---

## 4. File Upload & Storage Security

File handling is governed by `backend/middleware/uploadMiddleware.js` and `backend/controllers/fileController.js`:

```
Uploaded File ──► [ Multer Engine ] ──► [ MIME Filter ] ──► [ Ext Filter ] ──► [ Random Hex Name ] ──► [ Isolated Subfolder ]
```

### 4.1 In-Flight Upload Protections (`uploadMiddleware.js`)
1. **MIME-Type Strict Whitelist:**
   Only the following MIME types are accepted:
   - `application/pdf`
   - `image/jpeg`
   - `image/png`
   - `image/webp`
2. **Extension Sanitization & Dangerous Extension Blocking:**
   - Explicitly rejects executable, script, or binary extensions: `.exe`, `.bat`, `.cmd`, `.sh`, `.php`, `.js`, `.mjs`, `.py`, `.vbs`, `.pl`, `.cgi`, `.jar`, `.jsp`, `.asp`, `.aspx`, `.svg`, `.html`, `.htm`.
   - Prevents double-extension attacks (e.g., `document.php.pdf`).
3. **Filename Randomization:**
   Original filenames are discarded. Files are stored using cryptographic random tokens:
   $$\text{Stored Filename} = \text{fieldPrefix} - \text{timestamp} - \text{crypto.randomBytes(12).toString('hex')} + \text{safeExt}$$
4. **Upload Size Cap:** Max 5 MB per file.
5. **Null Byte & Control Character Detection:** Filenames with null bytes (`\0`) or control characters are rejected immediately.

### 4.2 Tenant-Isolated File Retrieval (`fileController.js`)
Files are stored outside the public document root in `/uploads`. Files can **only** be accessed via the authenticated API route:
`GET /api/files/:folder/:filename`

- **Path Traversal Shield:** Rejects filenames containing `..`, `/`, `\`, `%2e`, `%2f`, `%5c`, or null bytes.
- **Root Enclosure Check:** Ensures the resolved target path begins strictly with the canonical upload root directory (`path.resolve(ENV.UPLOAD_DIR, folder)`).
- **Ownership Verification:**
  - `BUSINESS_USER`: Verifies via MongoDB `$or` queries that the requested file belongs to a KYC document, instrument photo, application document, inspection photo, or certificate owned by their `Stakeholder` ID.
  - `FIELD_VERIFICATION_OFFICER`: Restricts access to evidence photos belonging to an inspection explicitly assigned to that officer.
  - `LEGAL_METROLOGY_OFFICER`: Restricts photo downloads to inspections within their assigned district.
  - Unmatched access attempts are rejected with **HTTP 403 Forbidden**.
- **Download Headers:** Responses include `Content-Type: <mime>`, `X-Content-Type-Options: nosniff`, and `Cache-Control: private, no-cache, no-store`.

---

## 5. Cryptographic Integrity & Anti-Counterfeiting

Physical verification certificates and stamping slips are historically vulnerable to unauthorized reproduction. **e-Maap Verify** implements dual cryptographic protections:

### 5.1 High-Entropy QR Verification Tokens
- Certificates do not rely on guessable database IDs or sequential numbers for verification.
- Upon certificate generation, the system creates a 64-hexadecimal-character token using Node.js cryptographically secure random bytes:
  ```javascript
  const qrToken = crypto.randomBytes(32).toString('hex');
  ```
- Entropy: $256 \text{ bits}$, making brute-force guessing statistically impossible ($1.15 \times 10^{77}$ combinations).

### 5.2 Tamper-Evident SHA-256 Digest
To detect any unauthorized modification of database records after certificate issuance, a SHA-256 cryptographic digest is calculated over core certificate metadata:
$$\text{Payload} = \text{certNo} \parallel \text{appNo} \parallel \text{instrumentSerial} \parallel \text{tradeLicenseNo} \parallel \text{validFrom} \parallel \text{validUntil} \parallel \text{officerId}$$
$$\text{Tamper-Evident Hash} = \text{SHA-256}(\text{Payload})$$

- This hash is embedded into the vector PDF generated by `PDFKit`.
- During automated integrity diagnostics (`/api/admin/diagnostics/integrity`), the system recalculates this hash against the live database record. Any disparity immediately flags the certificate as potentially compromised.

---

## 6. Audit Trail & Non-Repudiation

Compliance under the Legal Metrology Act requires an immutable record of all official actions.
- **Schema:** `AuditLog` (`backend/models/AuditLog.js`).
- **Characteristics:**
  - `timestamps: false`, `versionKey: false`: Minimizes overhead and prevents arbitrary versioning.
  - **No Update/Delete Endpoints:** The API provides no routes to edit or delete audit logs.
- **Tracked Parameters:**
  - `user`: Authenticated user ID.
  - `userRole`: Role at the moment of execution.
  - `userEmail`: Email address.
  - `action`: Statutory action key (e.g. `USER_LOGIN`, `CERTIFICATE_GENERATED`, `CERTIFICATE_REVOKED`, `INSTRUMENT_EXPIRED`, `INSPECTION_COMPLETED`).
  - `entity` & `entityId`: Impacted database entity.
  - `ipAddress`: Client IP.
  - `userAgent`: Client browser/device identification string.
  - `metadata`: JSON context (e.g. before/after status, reason for revocation).
  - `timestamp`: UTC timestamp.

---

## 7. Vulnerability Mitigation Checklist

| Vulnerability Category | OWASP Top 10 Reference | Mitigation Mechanism in e-Maap Verify |
| :--- | :--- | :--- |
| **Broken Access Control** | A01:2021 | Strict RBAC middleware (`authorize`), tenant-isolated file controller, database-level stakeholder scoping. |
| **Cryptographic Failures** | A02:2021 | Salted bcrypt password hashing (10 rounds), 256-bit crypto QR tokens, SHA-256 certificate hashing, TLS HTTPS communication. |
| **Injection** | A03:2021 | NoSQL operator blocking, strict Mongoose schemas, prototype pollution defense, deep XSS HTML sanitization. |
| **Insecure Design** | A04:2021 | State machine lifecycle, automated expiry engine, dual-key certificate verification. |
| **Security Misconfiguration** | A05:2021 | Helmet 8.3 headers, disabled X-Powered-By, private cache headers on downloads, strict CORS. |
| **Vulnerable Components** | A06:2021 | Modern dependency tree (Express 4.21, Mongoose 9.9, Helmet 8.3), zero known high/critical CVEs. |
| **Identification & Auth Failures** | A07:2021 | JWT signature verification, account deactivation kill-switch, 25-req/15m authentication rate limiter. |
| **Software & Data Integrity** | A08:2021 | Tamper-evident certificate hashes, database transactional commits via `runInTransaction`. |
| **Security Logging & Monitoring** | A09:2021 | Full-stack `AuditLog` recording every status change, inspection verdict, certificate issuance, and user login. |
| **Server-Side Request Forgery**| A10:2021 | No open SSRF proxies; file fetch operations restricted to local `UPLOAD_DIR`. |

---

## 8. Incident Response & Certificate Revocation Protocol

If a physical instrument is found tampered, broken, or fraudulently stamped:
1. **Immediate Revocation:** An authorized Administrator calls `POST /api/certificates/:id/revoke`.
2. **Statutory Justification:** A mandatory explanation (minimum 5 characters) must be recorded.
3. **Automated Status Update:**
   - Certificate status transitions to `REVOKED`.
   - Associated instrument status transitions to `REJECTED`.
4. **Public Invalidation:** Any subsequent public QR scan displays a prominent red **"REVOKED"** alert along with the revocation timestamp and official reasoning.
5. **Auditing & Notification:** The event is immutably logged in `AuditLog` and a critical alert is dispatched to the instrument owner.
