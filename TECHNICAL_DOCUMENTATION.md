# e-Maap Verify: Comprehensive Technical Documentation
**Smart India Hackathon (SIH) — Problem Statement ID: 26036**  
**Nodal Authority:** Department of Consumer Affairs (DoCA), Ministry of Consumer Affairs, Food & Public Distribution, Government of India  
**System Title:** Legal Metrology Online Verification, Stamping, Enforcement & Anti-Counterfeiting Platform  
**Document Version:** 1.0.0 (Production Architecture & Implementation Reference)  
**System Status:** Fully Implemented Core Platform (Phase 1–Phase 12 Production Readiness Verified)

---

## Executive Summary & System Metadata

| Attribute | Specification |
| :--- | :--- |
| **System Name** | **e-Maap Verify** (Legal Metrology Verification & Stamping System) |
| **Problem Statement** | **SIH PS 26036** (Automation, Digitization, and Tracking of Weighing & Measuring Instruments Verification) |
| **Regulatory Framework** | The Legal Metrology Act, 2009 & Legal Metrology (General) Rules, 2011 |
| **Frontend Technology** | React 19, TypeScript, Vite 6, Tailwind CSS 4, Motion, Lucide React, Recharts |
| **Backend Technology** | Node.js (ES Modules), Express 4.21, Mongoose 9.9, Multer, PDFKit, QRCode |
| **Primary Database** | MongoDB Atlas (Mongoose ODM with strict schemas, compound indexes, transactions) |
| **Mobile Architecture** | Capacitor 8.5 (Cross-platform Android / iOS shell with native camera & barcode scanner plugins) |
| **Deployment Targets** | Vercel (Frontend SPA / Static Hosting), Render / Cloud Run (Node.js API Container), MongoDB Atlas (Clustered DB) |
| **Core Capabilities** | Multi-tenant RBAC, Verification Lifecycle Engine, GPS Field Inspection, Digital Certificate Generation with Tamper-Evident SHA-256 Digest, Public QR Anti-Counterfeiting Verification, Automated Expiry & Escalation Engine, Full-Stack Audit Trail |

---

## 1. Project Overview

### 1.1 Problem Statement (SIH PS 26036)
Weighing and measuring instruments used in commercial trade, healthcare, logistics, manufacturing, and legal custody across India are legally mandated under the Legal Metrology Act, 2009 to undergo periodical statutory verification, inspection, and official stamping by Legal Metrology Officers (LMOs) or Government Approved Test Centres (GATCs).

Historically, the verification landscape has suffered from:
1. **Paper-Based Vulnerabilities:** Physical stamping slips and paper certificates are susceptible to forgery, unauthorized duplicates, and physical degradation.
2. **Untracked Due Dates & Revenue Leakage:** Commercial establishments fail to submit periodic re-verification applications on time due to absent automated alert mechanisms, leading to non-compliant commercial usage.
3. **Absence of Real-Time Field Verification:** Lack of geo-tagged inspection records, standardized MPE (Maximum Permissible Error) calculations, and photo evidence collection during on-site inspections.
4. **Consumer Distrust:** Consumers, field inspectors, and enforcement flying squads cannot immediately verify the authenticity of an instrument's calibration certificate on-site.

### 1.2 Project Objective
**e-Maap Verify** addresses these systemic challenges by delivering an enterprise-grade, end-to-end digital ecosystem providing:
- **Unified Stakeholder Onboarding:** Self-service registration for commercial establishments, manufacturers, dealers, repairers, and users of weights and measures.
- **Instrument Digital Twin:** Central registry of instruments with make, model, accuracy class, verification interval, calibration history, and unique serial tracking.
- **Transparent Verification Workflow:** Multi-stage state machine covering application filing, statutory fee tracking, scheduling, multi-officer assignment, and inspection recording.
- **Scientific On-Site Inspection:** Digital recording of intrinsic errors, standard references used, tolerance margins, photographic evidence, and statutory seal affixation.
- **Cryptographic Anti-Counterfeiting:** Instant digital certificate generation bearing high-entropy QR verification tokens and SHA-256 tamper-evident integrity digests.
- **Zero-Trust Public Verification:** Instant mobile QR scanning allowing consumers and enforcement squads to inspect calibration legitimacy without needing login credentials.
- **Automated Expiry & Enforcement Escalation:** Proactive 90-day, 30-day, 7-day, and on-expiry reminder engine with automatic status transitions to `EXPIRED` and officer escalation.

### 1.3 Target Stakeholders

| Stakeholder Persona | Role Key in RBAC | Primary Responsibilities & Permissions |
| :--- | :--- | :--- |
| **Commercial Business / Trader / User** | `BUSINESS_USER` | Enrolls business entity; registers weighing/measuring instruments; files verification and re-verification applications; tracks inspection schedules; views and downloads authentic PDF certificates; configures notification preferences. |
| **Legal Metrology Officer (Inspector)** | `LEGAL_METROLOGY_OFFICER` | Reviews district applications; approves or rejects documentation; schedules verification visits; executes or oversees on-site calibration inspections; records MPE readings; affixes statutory seals; digitally issues official certificates. |
| **Field Verification Officer** | `FIELD_VERIFICATION_OFFICER` | Receives assigned field inspection schedules; performs physical on-site verification; captures GPS coordinates and photographic evidence; records standard test readings; submits inspection checklists to LMO. |
| **GATC Officer** | `GATC_OFFICER` | Manages verification at accredited Government Approved Test Centres; verifies authorized categories of instruments within licensed scope; enters calibration measurements and test reports. |
| **Departmental Administrator** | `ADMIN` | Oversees district and state operations; manages verification centers and GATC accreditations; reassigns officers; revokes fraudulent or damaged certificates; monitors compliance analytics. |
| **Super Administrator (DoCA Head)** | `SUPER_ADMIN` | Global governance; administrative user onboarding; system-wide audit trail inspection; platform security and integrity diagnostics; database maintenance and scheduler controls. |
| **Public Consumer / Enforcement Flying Squad** | *Unauthenticated Public* | Scans physical QR codes affixed to commercial instruments or certificates; queries public verification portal to inspect calibration validity, owner identity, issuing officer, and expiry date. |

---

## 2. System Architecture & End-to-End Data Flow

### 2.1 System Architecture Overview

```
+-----------------------------------------------------------------------------------------+
|                                    PRESENTATION TIER                                    |
|                                                                                         |
|   +------------------------------------+    +---------------------------------------+   |
|   |   React 19 SPA (Web Portal)        |    |   Capacitor Mobile App (Android/iOS)  |   |
|   |   - Responsive Tailwind CSS 4      |    |   - Native Barcode Scanning (MLKit)   |   |
|   |   - Role-Based Dynamic Dashboards  |    |   - Native Camera & Geolocation       |   |
|   |   - Lucide Icons & Recharts Visuals|    |   - Offline Shell & Local Caching     |   |
|   +-----------------+------------------+    +-------------------+-------------------+   |
+---------------------|-------------------------------------------|-----------------------+
                      | HTTPS / REST APIs                         | HTTPS / REST APIs
                      +---------------------+---------------------+
                                            |
+-------------------------------------------v---------------------------------------------+
|                               API GATEWAY & MIDDLEWARE LAYER                            |
|                                                                                         |
|   - Helmet Security Headers (CSP, Anti-Sniff, XSS-Protection)                           |
|   - CORS Origin Guard (Whitelisted Origins & Credential Support)                        |
|   - Rate Limiting (Auth: 25 req/15m; General API: 150 req/1m)                            |
|   - HTTP Parameter Pollution (HPP) Defense                                              |
|   - Request Security Filter (NoSQL Injection & Prototype Pollution Blocker)             |
|   - Deep Input Sanitizer (XSS & Residual Script Tag Stripping)                          |
|   - JWT Authentication Filter (`protect` injects active `req.user`)                     |
|   - Role-Based Authorization Guard (`authorize` / `restrictTo`)                         |
+-------------------------------------------+---------------------------------------------+
                                            |
+-------------------------------------------v---------------------------------------------+
|                                BUSINESS LOGIC & SERVICES                                |
|                                                                                         |
|   +---------------------------+ +----------------------------+ +--------------------+   |
|   | AuthService               | | ApplicationWorkflowService | | ScheduleService    |   |
|   | - bcryptjs hashing        | | - State Transition Rules   | | - Center Allocation|   |
|   | - JWT signing & verify    | | - Document Tracking        | | - Conflict Checks  |   |
|   +---------------------------+ +----------------------------+ +--------------------+   |
|   +---------------------------+ +----------------------------+ +--------------------+   |
|   | InspectionService         | | CertificateService         | | ExpiryService      |   |
|   | - MPE Validation (kg/g)   | | - SHA-256 Digest Engine    | | - 90d/30d/7d Window|   |
|   | - GPS & Photo Evidence    | | - 64-char QR Token Gen     | | - Auto-Expiry Job  |   |
|   +---------------------------+ +----------------------------+ +--------------------+   |
|   +---------------------------+ +----------------------------+ +--------------------+   |
|   | QRService (qrcode)        | | PDFService (PDFKit)        | | NotificationService|   |
|   | - Public URL Data URIs    | | - Official DoCA Format     | | - In-App & Email   |   |
|   +---------------------------+ +----------------------------+ +--------------------+   |
|   +---------------------------+ +----------------------------+ +--------------------+   |
|   | AuditService              | | IntegrityDiagnosticService | | ExpiryScheduler    |   |
|   | - Tamper-evident logging  | | - Orphan & DB consistency  | | - 24-Hour Worker   |   |
|   +---------------------------+ +----------------------------+ +--------------------+   |
+-------------------------------------------+---------------------------------------------+
                                            | Mongoose ODM / Transactions
+-------------------------------------------v---------------------------------------------+
|                                PERSISTENCE & STORAGE TIER                               |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |   MongoDB Atlas (Clustered Replica Set)                                         |   |
|   |   - Users, Stakeholders, Instruments, VerificationApplications, Schedules       |   |
|   |   - Inspections, Certificates, Notifications, NotificationPreferences, AuditLogs|   |
|   |   - Compound Indexing, Partial Filters, Schema-Level Validators                 |   |
|   +---------------------------------------------------------------------------------+   |
|   +---------------------------------------------------------------------------------+   |
|   |   Secure Local Storage Engine (`/uploads`)                                      |   |
|   |   - Controlled Subfolders: `documents/`, `certificates/`, `instrument-photos/`  |   |
|   |   - Tenant-Isolated Access Controller (Path Traversal & RBAC Guarded)           |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

### 2.2 End-to-End Functional Data Flow
1. **Enrollment & Instrument Onboarding:**
   - The commercial entity registers an account (`BUSINESS_USER`) and completes KYC details in the `Stakeholder` schema.
   - The user records physical instruments with type, serial number, accuracy class, capacity, verification interval, and physical premise address.
2. **Verification Application Submission:**
   - Business submits a `VerificationApplication` linked to registered instruments.
   - The system validates initial document uploads and generates a tracking number `VA-YYYY-XXXXX`.
   - Initial status: `SUBMITTED`.
3. **Application Review & Scheduling:**
   - An assigned `LEGAL_METROLOGY_OFFICER` verifies application documents (`UNDER_REVIEW` -> `APPROVED`).
   - A `VerificationSchedule` is established specifying the appointment date, time slot, location type (`ON_SITE_PREMISES`, `DISTRICT_LABORATORY`, or `GATC_FACILITY`), and assigns a `FIELD_VERIFICATION_OFFICER`.
   - Application status updates to `SCHEDULED`.
4. **Field Inspection & Calibration Verification:**
   - The assigned officer visits the premises, captures real-time GPS coordinates, verifies instrument condition, and records measurement readings against calibrated standards.
   - MPE compliant readings, photographic evidence, and physical lead seal/hologram numbers are recorded in a `VerificationInspection`.
   - Application transitions to `INSPECTION_COMPLETED`.
5. **Verdict & Certificate Generation:**
   - LMO finalizes the inspection as `PASSED`.
   - `CertificateService` initiates a multi-model transaction:
     - Generates a unique certificate number `LM-CERT-YYYY-XXXXX-XXXX`.
     - Generates a 64-hex-character cryptographic token (`qrToken`).
     - Calculates a tamper-evident SHA-256 checksum over certificate metadata.
     - Creates the vector QR code encoding the public verification URL.
     - Renders the official PDF document via `PDFKit` and archives it in secure storage.
     - Updates application status to `CERTIFICATE_GENERATED` and instrument status to `ACTIVE_VERIFIED`.
     - Calculates `nextVerificationDueDate` based on statutory verification intervals.
     - Dispatches an automated notification to the stakeholder.
6. **Public & Enforcement QR Verification:**
   - Anyone scanning the QR code or visiting `/verify-certificate?token=<qrToken>` triggers an unauthenticated public lookup.
   - The system retrieves non-confidential verification details, validates current validity against statutory dates, checks revocation flags, and displays the authentic verification status badge.
7. **Statutory Expiry & Re-Verification Cycle:**
   - The background scheduler runs every 24 hours, scanning instruments against their `nextVerificationDueDate`.
   - Issues warnings at 90 days, 30 days, and 7 days.
   - Upon passage of due date, automatically updates instrument status to `EXPIRED`, flags the certificate, and notifies both the business owner and the jurisdiction LMO for enforcement action.

---

## 3. Database Architecture & Data Models

The system employs MongoDB Atlas managed via Mongoose 9.9. All schemas enforce strict typing, validations, compound indexes for fast query resolution, and virtual aliases for backwards compatibility.

### 3.1 Entity Relationship Summary

```
                      +-------------------+
                      |       User        |
                      +---------+---------+
                                | 1
                                |
                                | 1
                      +---------v---------+
                      |    Stakeholder    |
                      +----+---------+----+
                           | 1       | 1
                           |         |
                  +--------+         +--------+
                  | *                         | *
        +---------v---------+       +---------v------------------+
        |    Instrument     |       |  VerificationApplication   |
        +---------+---------+       +----+-----------------+-----+
                  | 1                    | 1               | 1
                  |                      |                 |
                  |        +-------------+                 |
                  | *      | 1                             | 1
        +---------v--------v---------+            +--------v---------------+
        |   VerificationSchedule     |            |      Certificate       |
        +--------------+-------------+            +------------------------+
                       | 1                                     ^
                       |                                       |
                       | 1                                     | 1
        +--------------v-------------+                         |
        |   VerificationInspection   +-------------------------+
        +--------------+-------------+
                       | 1
                       |
                       | 1
        +--------------v-------------+
        |    VerificationResult      |
        +----------------------------+
```

### 3.2 Detailed Model Schemas

#### 3.2.1 `User` (`backend/models/User.js`)
- **Fields:**
  - `name` (String, required, trim)
  - `email` (String, required, unique, lowercase, trim)
  - `password` (String, required, select: false, bcrypt hashed)
  - `role` (String, enum: `SUPER_ADMIN`, `ADMIN`, `LEGAL_METROLOGY_OFFICER`, `FIELD_VERIFICATION_OFFICER`, `GATC_OFFICER`, `BUSINESS_USER`, default: `BUSINESS_USER`)
  - `phone` (String, trim)
  - `designation` (String, trim)
  - `jurisdiction` (`{ state: String, district: String, zone: String }`)
  - `isActive` (Boolean, default: true)
  - `lastLogin` (Date)
- **Indexes:** `{ email: 1 }` (unique), `{ role: 1 }`, `{ 'jurisdiction.district': 1 }`.

#### 3.2.2 `Stakeholder` (`backend/models/Stakeholder.js`)
- **Fields:**
  - `user` (ObjectId -> `User`, required, unique)
  - `businessName` (String, required, trim)
  - `tradeLicenseNumber` (String, required, unique, uppercase)
  - `gstNumber` (String, uppercase)
  - `panNumber` (String, uppercase)
  - `businessType` (String, enum: `TRADER`, `MANUFACTURER`, `DEALER`, `REPAIRER`, `COMMERCIAL_USER`, `IMPORTER`)
  - `registeredAddress` (`{ street, city, state, district, pincode }`)
  - `operationalAddress` (`{ street, city, state, district, pincode }`)
  - `contactPerson` (`{ name, phone, email, designation }`)
  - `kycDocuments` (`[{ documentType, documentNumber, fileUrl, verifiedStatus }]`)
  - `isKycVerified` (Boolean, default: false)
- **Indexes:** `{ user: 1 }` (unique), `{ tradeLicenseNumber: 1 }` (unique), `{ 'registeredAddress.district': 1 }`.

#### 3.2.3 `Instrument` (`backend/models/Instrument.js`)
- **Fields:**
  - `stakeholder` (ObjectId -> `Stakeholder`, required)
  - `instrumentId` (String, required, unique, e.g. `INST-YYYY-XXXXXX`)
  - `category` (String, enum: `WEIGHING_INSTRUMENTS`, `MEASURING_INSTRUMENTS`, `AUTOMATIC_WEIGHING_SYSTEMS`, `SPECIAL_PURPOSE_DEVICES`)
  - `instrumentType` (String, required, e.g. `ELECTRONIC_NON_AUTOMATIC`, `WEIGHBRIDGE`, `FUEL_DISPENSER`)
  - `manufacturer` (String, required)
  - `modelNumber` (String, required)
  - `serialNumber` (String, required)
  - `capacity` (`{ value: Number, unit: String }`)
  - `accuracyClass` (String, enum: `CLASS_I`, `CLASS_II`, `CLASS_III`, `CLASS_IIII`, `CLASS_A`, `CLASS_B`, `UNSPECIFIED`)
  - `verificationScaleInterval_e` (`{ value: Number, unit: String }`)
  - `numberOfScaleIntervals_n` (Number)
  - `installationAddress` (`{ premiseName, street, district, state, pincode, coordinates: { lat, lng } }`)
  - `status` (String, enum: `DRAFT`, `SUBMITTED`, `UNDER_VERIFICATION`, `ACTIVE_VERIFIED`, `EXPIRED`, `REJECTED`, `OUT_OF_SERVICE`, default: `DRAFT`)
  - `verificationIntervalMonths` (Number, default: 12)
  - `lastVerificationDate` (Date)
  - `nextVerificationDueDate` (Date)
  - `photographs` (`[{ caption, fileUrl, uploadedAt }]`)
  - `documents` (`[{ title, fileUrl, uploadedAt }]`)
- **Instance Methods:** `getDueStatus(reminderThresholdDays, referenceDate)` -> returns `OVERDUE`, `DUE_SOON`, or `UP_TO_DATE`.
- **Indexes:** `{ stakeholder: 1, status: 1 }`, `{ nextVerificationDueDate: 1, status: 1 }`, `{ instrumentId: 1 }` (unique), `{ serialNumber: 1, manufacturer: 1 }`.

#### 3.2.4 `VerificationApplication` (`backend/models/VerificationApplication.js`)
- **Fields:**
  - `applicationNumber` (String, required, unique, e.g. `VA-YYYY-XXXXX`)
  - `stakeholder` (ObjectId -> `Stakeholder`, required)
  - `instrument` (ObjectId -> `Instrument`, required)
  - `applicationType` (String, enum: `INITIAL_VERIFICATION`, `PERIODICAL_RE_VERIFICATION`, `AFTER_REPAIR_VERIFICATION`, `SURPRISE_INSPECTION`)
  - `currentStatus` (String, enum: `DRAFT`, `SUBMITTED`, `PAYMENT_PENDING`, `PAYMENT_CONFIRMED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `SCHEDULED`, `INSPECTION_IN_PROGRESS`, `INSPECTION_COMPLETED`, `VERIFIED`, `REJECTED_AFTER_INSPECTION`, `CERTIFICATE_GENERATED`, `CANCELLED`)
  - `assignedLMO` (ObjectId -> `User`, ref: Legal Metrology Officer)
  - `documents` (`[{ documentType, fileUrl, uploadedAt }]`)
  - `feeDetails` (`{ amount: Number, paymentStatus: 'PENDING'|'PAID'|'EXEMPTED', transactionRef: String, paidAt: Date }`)
  - `statusHistory` (`[{ fromStatus, toStatus, changedBy: ObjectId, remarks: String, timestamp: Date }]`)
- **Virtual Aliases:** `applicationStatus` (maps to `currentStatus`), `uploadedDocuments` (maps to `documents`).
- **Indexes:** `{ stakeholder: 1, currentStatus: 1 }`, `{ instrument: 1, currentStatus: 1 }`, `{ assignedLMO: 1, currentStatus: 1 }`, `{ createdAt: -1 }`.

#### 3.2.5 `VerificationSchedule` (`backend/models/VerificationSchedule.js`)
- **Fields:**
  - `application` (ObjectId -> `VerificationApplication`, required)
  - `instrument` (ObjectId -> `Instrument`, required)
  - `stakeholder` (ObjectId -> `Stakeholder`, required)
  - `assignedOfficer` (ObjectId -> `User`, required)
  - `assignedFieldOfficer` (ObjectId -> `User`)
  - `assignedGATC` (ObjectId -> `GATC`)
  - `verificationCenter` (ObjectId -> `VerificationCenter`)
  - `scheduledDate` (Date, required)
  - `timeSlot` (String, default: `'09:00 - 12:00'`)
  - `locationType` (String, enum: `'ON_SITE_PREMISES'`, `'DISTRICT_LABORATORY'`, `'GATC_FACILITY'`)
  - `locationAddress` (String, required)
  - `status` (String, enum: `SCHEDULED`, `RESCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `MISSED`)
  - `rescheduleHistory` (`[{ previousDate, newDate, reason, rescheduledBy, rescheduledAt }]`)
- **Indexes:** `{ assignedOfficer: 1, scheduledDate: 1, status: 1 }`, `{ assignedFieldOfficer: 1, scheduledDate: 1, status: 1 }`, `{ instrument: 1, scheduledDate: 1 }`.

#### 3.2.6 `VerificationInspection` (`backend/models/VerificationInspection.js`)
- **Fields:**
  - `inspectionNumber` (String, required, unique, e.g. `INSP-YYYY-XXXXX`)
  - `application` (ObjectId -> `VerificationApplication`, required)
  - `schedule` (ObjectId -> `VerificationSchedule`)
  - `instrument` (ObjectId -> `Instrument`, required)
  - `stakeholder` (ObjectId -> `Stakeholder`)
  - `assignedOfficer` / `officer` (ObjectId -> `User`)
  - `inspectionStatus` (String, enum: `DRAFT`, `IN_PROGRESS`, `SUBMITTED`, `UNDER_REVIEW`, `PASSED`, `FAILED`, `ABANDONED`)
  - `latitude` & `longitude` (Numbers with [-90,90] and [-180,180] boundary validators)
  - `gpsCoordinates` (`{ latitude, longitude, accuracyMeters, address }`)
  - `instrumentCondition` (`{ visualCheckPassed, levelingBubbleCentered, modelApprovalPlateIntact, zeroTrackingOperational }`)
  - `standardsUsed` (`[{ standardId, denomination, calibrationValidUntil }]`)
  - `measurementReadings` (`[{ testType, appliedLoad, indicatedReading, intrinsicError, maximumPermissibleError, isCompliant }]`)
  - `stampingAndSealing` (`{ leadSealsApplied: Number, hologramStickerNumber: String, stampingYearMark: String, sealingPlugsIntact: Boolean }`)
  - `photographs` / `photos` (`[{ caption, fileUrl, uploadedAt }]`)
  - `result` (String, enum: `PENDING`, `PASSED`, `FAILED`, `RE_INSPECTION_REQUIRED`, `VERIFIED`, `REJECTED`)
  - `verifiedBy` (ObjectId -> `User`), `verifiedAt` (Date)
- **Indexes:** `{ assignedOfficer: 1, inspectionStatus: 1 }`, `{ stakeholder: 1, inspectionStatus: 1 }`, `{ inspectionDate: -1 }`.

#### 3.2.7 `Certificate` (`backend/models/Certificate.js`)
- **Fields:**
  - `certificateNumber` (String, required, unique, e.g. `LM-CERT-YYYY-XXXXX-XXXX`)
  - `application` (ObjectId -> `VerificationApplication`, required, unique)
  - `inspection` (ObjectId -> `VerificationInspection`)
  - `instrument` (ObjectId -> `Instrument`, required)
  - `stakeholder` (ObjectId -> `Stakeholder`, required)
  - `issuedBy` (ObjectId -> `User`, required)
  - `issuedAt` (Date, default: Date.now)
  - `validFrom` (Date, required)
  - `validUntil` (Date, required)
  - `certificateStatus` / `status` (String, enum: `ACTIVE`, `VALID`, `EXPIRED`, `REVOKED`, `CANCELLED`, `SUSPENDED`)
  - `certificateUrl` / `certificatePdfPath` (String, path to generated PDF)
  - `qrToken` / `qrVerificationToken` (String, 64-character hex, unique, indexed)
  - `qrCodeDataUrl` (String, Base64 PNG data URL)
  - `tamperEvidentHash` (String, SHA-256 cryptographic digest)
  - `issuingAuthority` (String, default: 'Department of Consumer Affairs, Legal Metrology Division, Government of India')
  - `revokedAt` (Date), `revokedBy` (ObjectId -> `User`), `revocationReason` (String)
- **Instance Method:** `getDynamicStatus(expiringWindowDays = 30)` -> calculates whether status is `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, or `REVOKED`.
- **Indexes:** `{ validUntil: 1, certificateStatus: 1 }`, `{ qrToken: 1 }` (unique), `{ stakeholder: 1 }`.

#### 3.2.8 `Notification` (`backend/models/Notification.js`)
- **Fields:**
  - `recipient` (ObjectId -> `User`, required, indexed)
  - `type` (String, enum: `VERIFICATION_REMINDER`, `VERIFICATION_WARNING`, `VERIFICATION_URGENT`, `VERIFICATION_EXPIRED`, `CERTIFICATE_ISSUED`, `CERTIFICATE_EXPIRING_60`, `CERTIFICATE_EXPIRING_30`, `CERTIFICATE_EXPIRING_7`, `CERTIFICATE_EXPIRED`, `APPLICATION_STATUS_CHANGED`, `SCHEDULE_CREATED`, `SYSTEM_ALERT`, etc.)
  - `title` (String, required)
  - `message` (String, required)
  - `instrument` (ObjectId -> `Instrument`)
  - `application` (ObjectId -> `VerificationApplication`)
  - `dueDate` (Date)
  - `relatedEntityType` (String), `relatedEntityId` (ObjectId)
  - `priority` (String, enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT`, `CRITICAL`)
  - `link` (String)
  - `isRead` (Boolean, default: false)
  - `readAt` (Date)
  - `metadata` (Mixed, JSON payload)
- **Compound Indexes:** `{ recipient: 1, isRead: 1, createdAt: -1 }`, `{ recipient: 1, instrument: 1, type: 1, dueDate: 1 }`.

#### 3.2.9 `AuditLog` (`backend/models/AuditLog.js`)
- **Fields:**
  - `user` (ObjectId -> `User`)
  - `userRole` (String)
  - `userEmail` (String)
  - `action` (String, required, e.g. `USER_LOGIN`, `CERTIFICATE_GENERATED`, `CERTIFICATE_REVOKED`, `INSTRUMENT_EXPIRED`, `INSPECTION_COMPLETED`)
  - `entity` (String, required)
  - `entityId` (String)
  - `ipAddress` (String)
  - `userAgent` (String)
  - `metadata` (Mixed)
  - `timestamp` (Date, default: Date.now)
- **Compound Indexes:** `{ entity: 1, entityId: 1 }`, `{ action: 1, timestamp: -1 }`, `{ user: 1, timestamp: -1 }`.

---

## 4. Authentication, Authorization & RBAC Matrix

### 4.1 Authentication Framework
- **Mechanism:** JSON Web Token (JWT) with standard Bearer authorization header, cookie fallback, and query token support.
- **Password Security:** Salted and hashed using `bcryptjs` (salt rounds: 10). Password fields are strictly excluded from default queries (`select: false`).
- **Token Verification:** `authMiddleware.js` verifies signature using `JWT_SECRET`, checks token expiration, and loads the active user from MongoDB (`+isActive`). If the user account is deactivated, requests are immediately aborted.
- **Account Deactivation Protection:** Even with a valid unexpired token, if an admin sets `isActive: false`, the next API request fails with HTTP 401 Unauthorized.

### 4.2 Role-Based Access Control (RBAC) Matrix

| Resource / Action | `BUSINESS_USER` | `FIELD_VERIFICATION_OFFICER` | `LEGAL_METROLOGY_OFFICER` | `GATC_OFFICER` | `ADMIN` / `SUPER_ADMIN` | Public / Anonymous |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **User Sign-Up / Register** | Yes | No | No | No | Admin seeds | Yes (Self-service) |
| **View Own Instruments** | Yes | No | District Scope | Authorized GATC | System-wide | No |
| **Register / Edit Instrument** | Yes | No | No | No | Yes | No |
| **Submit Verification App** | Yes | No | No | No | Yes | No |
| **Approve / Reject App** | No | No | Yes (Jurisdiction) | No | Yes | No |
| **Create Schedule** | No | No | Yes | Yes (GATC) | Yes | No |
| **Submit Field Checklist/GPS**| No | Yes (Assigned) | Yes (Assigned) | Yes (Assigned) | Yes | No |
| **Record MPE Readings** | No | Yes (Assigned) | Yes (Assigned) | Yes (GATC) | Yes | No |
| **Finalize Inspection Verdict**| No | No | Yes | Yes | Yes | No |
| **Issue Digital Certificate** | No | No | Yes | No | Yes | No |
| **Revoke Certificate** | No | No | No | No | Yes | No |
| **Public QR Verification** | Yes | Yes | Yes | Yes | Yes | **Yes (Full Public)**|
| **Trigger Expiry Scheduler** | No | No | No | No | Yes (Admin only) | No |
| **View Audit Logs** | No | No | No | No | Yes | No |

---

## 5. Core Operational Engines

### 5.1 Verification Lifecycle State Machine
Every application advances through strict linear and validated state transitions:

```
[ DRAFT ]
    │
    ▼
[ SUBMITTED ] ──────────► [ UNDER_REVIEW ] ──────────► [ REJECTED ]
                                  │
                                  ▼
                             [ APPROVED ]
                                  │
                                  ▼
                            [ SCHEDULED ]
                                  │
                                  ▼
                      [ INSPECTION_IN_PROGRESS ]
                                  │
                                  ▼
                      [ INSPECTION_COMPLETED ]
                         │                │
            (Passed)     │                │     (Failed)
                         ▼                ▼
                    [ VERIFIED ]    [ REJECTED_AFTER_INSPECTION ]
                         │
                         ▼
              [ CERTIFICATE_GENERATED ]
```

- State transitions are validated by `applicationWorkflowService.js`.
- Each transition records an immutable entry in `statusHistory` storing `fromStatus`, `toStatus`, `changedBy`, `remarks`, and `timestamp`.

### 5.2 Field Inspection, Standards & MPE Engine
- **Instrument Condition Checklist:** Evaluates visual checks, leveling bubble centering, model approval plate legibility, and zero-tracking operational status.
- **Reference Standards Tracking:** Captures reference weight IDs, denominations (e.g., 20 kg Class F1/M1), and calibration validity expiry dates of testing equipment used by officers.
- **Intrinsic Error Calculation:**
  $$\text{Intrinsic Error} = \text{Indicated Reading} - \text{Applied Load}$$
  Evaluated strictly against statutory Maximum Permissible Error (MPE) thresholds based on instrument accuracy class (Class I, II, III, IIII) and test load range.
- **Geo-Tagging & Sealing:** Captures real-time device latitude, longitude, and accuracy in meters. Records physical lead seal counts and unique tamper-evident hologram sticker serials.

### 5.3 Digital Certificate Generation & Cryptographic Integrity Engine
- **Unique Identifier:** Formatted as `LM-CERT-YYYY-XXXXX-XXXX` ensuring zero collision.
- **High-Entropy QR Token:** Generated via `crypto.randomBytes(32).toString('hex')` (64 hex characters, $2^{256}$ entropy).
- **Tamper-Evident SHA-256 Digest:**
  $$\text{Digest} = \text{SHA-256}\left(\text{certNo} \parallel \text{appNo} \parallel \text{instSerial} \parallel \text{licenseNo} \parallel \text{validFrom} \parallel \text{validUntil} \parallel \text{officerId}\right)$$
  Printed directly on the certificate PDF and stored in MongoDB. Any post-issuance database tampering causes a mismatch during integrity audits.
- **Vector QR Code:** Generated using `qrcode` library pointing to `${APP_URL}/verify-certificate?token=${qrToken}`.
- **PDF Generation:** Rendered via `PDFKit` into a formal legal metrology template featuring official Government of India crest headers, statutory seals, dynamic QR code embed, and officer credentials.

### 5.4 Public QR Code Verification
- Public verification route: `GET /api/public/verify/:token` (and `GET /api/certificates/verify/:token`).
- Accessible to any citizen or enforcement flying squad without authentication.
- Dynamically resolves:
  - Is the certificate currently `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, or `REVOKED`?
  - Returns stakeholder business name, trade license number, premise location.
  - Returns instrument category, make, model, serial number, accuracy class, and verification scale interval ($e$).
  - Returns verification date, validity window, issuing officer designation, and district jurisdiction.
  - Returns revocation reason and revocation timestamp if revoked.

### 5.5 Automated Expiry & Due-Date Engine
- **Architecture:** Managed by `backend/services/expiryService.js` and driven by `backend/jobs/expiryScheduler.js` running on a 24-hour interval.
- **Alert Windows & Escalation Levels:**

| Window | Days to Due Date | Severity / Notification Type | Priority | Target Recipients |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 1 (Reminder)** | 90 Days | `VERIFICATION_REMINDER` | `LOW` | Business User (Owner) |
| **Stage 2 (Warning)** | 30 Days | `VERIFICATION_WARNING` | `MEDIUM` | Business User (Owner) |
| **Stage 3 (Urgent)** | 7 Days | `VERIFICATION_URGENT` | `HIGH` | Business User + District LMO |
| **Stage 4 (Expired)** | $\le$ 0 Days | `VERIFICATION_EXPIRED` | `CRITICAL` | Business User + District LMO + Admin |

- **Automatic Status Mutation:** When an instrument reaches $\le 0$ days past due date, the engine automatically transitions `Instrument.status` from `ACTIVE_VERIFIED` to `EXPIRED`, logs an audit entry, and escalates to enforcement officers.
- **Duplicate Alert Suppression:** The engine verifies past notification logs using compound queries (`recipient`, `instrument`, `type`, `dueDate`) ensuring stakeholders never receive duplicate reminders for the same statutory cycle.
- **Supersession on Re-Verification:** When a new certificate is generated for an instrument, old pending expiry alerts are automatically marked as read and tagged `supersededByReverification`.

---

## 6. Security, Threat Mitigation & Middleware Architecture

### 6.1 Defense-in-Depth Middleware Pipeline
Every HTTP request traverses seven protective layers before executing controller logic:

1. **Helmet 8.3:** Injects strict security headers:
   - `Content-Security-Policy`: Restricts scripts, styles, objects, and connect sources. In development, configured with frameguards compliant with container preview environments.
   - `X-Content-Type-Options: nosniff`: Prevents MIME-type confusion attacks.
   - `X-XSS-Protection: 1; mode=block`.
2. **CORS:** Restricts cross-origin resource sharing to designated client origins with credentials support.
3. **Rate Limiting (`express-rate-limit`):**
   - Authentication routes: Max 25 attempts per 15-minute window per IP.
   - General API routes: Max 150 requests per minute per IP.
4. **HTTP Parameter Pollution (`hpp`):** Protects against array-based query parameter manipulation.
5. **NoSQL Injection & Prototype Pollution Defense (`requestSecurityMiddleware`):**
   - Rejects any query or body containing MongoDB operators (`$ne`, `$gt`, `$regex`, `$or`, `$where`).
   - Recursively inspects for `__proto__`, `constructor`, and `prototype` manipulation.
6. **XSS & Script Injection Filter:**
   - Detects active `<script>` tags, HTML attributes, `javascript:` URIs, and event handlers (`onload`, `onerror`).
   - Performs deep HTML entity cleaning via `xss` library.
7. **Tenant-Isolated File Storage (`fileController.js`):**
   - Blocks path traversal (`..`, `\`, `/`, `%2e`, `%2f`, null bytes).
   - Validates user role against linked database documents before releasing certificates, KYC files, or inspection photos.

---

## 7. Mobile Architecture (Capacitor 8.5)

### 7.1 Cross-Platform Setup
- **Native Shells:** Fully configured in `/android` (Gradle / Android Studio) and `/ios` (Xcode).
- **Application ID:** `gov.in.doca.emaap`
- **Application Name:** `e-Maap Verify`
- **Web Directory Target:** `dist/` (built by Vite)

### 7.2 Native Capacitor Plugins

| Plugin | Package | Native Android Capability / Permission |
| :--- | :--- | :--- |
| **Barcode Scanner** | `@capacitor-mlkit/barcode-scanning` | Google MLKit vision barcode scanner for on-site QR certificate validation |
| **Camera** | `@capacitor/camera` | Captures high-resolution inspection evidence and stamping photographs |
| **Geolocation** | `@capacitor/geolocation` | Reads `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` for tamper-proof GPS stamps |
| **Local Notifications**| `@capacitor/local-notifications` | Native push alerts for upcoming verification appointments and expiry warnings |
| **Network** | `@capacitor/network` | Detects offline status during rural field inspections |
| **Splash Screen** | `@capacitor/splash-screen` | Custom Government of India branded launch splash screen |

---

## 8. API Endpoint Specifications

The backend exposes RESTful endpoints structured across modular routers:

### 8.1 Authentication & Profile (`/api/auth`)
- `POST /api/auth/register` — Business user registration with automatic KYC record initialization.
- `POST /api/auth/login` — Email and password authentication; returns JWT and user profile.
- `GET /api/auth/me` — Retrieves active session profile.
- `POST /api/auth/logout` — Invalidates client session.
- `PUT /api/auth/change-password` — Secure password update with previous password verification.

### 8.2 Instruments (`/api/instruments`)
- `GET /api/instruments` — Lists instruments filtered by stakeholder / jurisdiction.
- `POST /api/instruments` — Enrolls a new physical weighing/measuring instrument.
- `GET /api/instruments/:id` — Detailed instrument view with calibration history.
- `PUT /api/instruments/:id` — Updates instrument specifications.
- `DELETE /api/instruments/:id` — Soft-deactivates an instrument.

### 8.3 Applications (`/api/applications`)
- `GET /api/applications` — Lists verification applications filtered by status and role.
- `POST /api/applications` — Submits a new verification or re-verification application.
- `GET /api/applications/:id` — Retrieves application details, assigned LMO, documents, and status history.
- `PUT /api/applications/:id/status` — Role-restricted status advancement.
- `POST /api/applications/:id/assign-officer` — Admin/LMO officer allocation.

### 8.4 Verification Schedules (`/api/schedules`)
- `GET /api/schedules` — Lists scheduled visits with calendar query filters.
- `POST /api/schedules` — Books an inspection appointment with officer assignment.
- `PUT /api/schedules/:id/reschedule` — Reschedules visit with mandatory statutory reason logging.
- `PUT /api/schedules/:id/cancel` — Cancels an appointment.

### 8.5 Inspections & Calibration (`/api/inspections`)
- `GET /api/inspections` — Lists inspection records.
- `POST /api/inspections` — Initializes an inspection checklist.
- `PUT /api/inspections/:id/readings` — Records MPE test loads, intrinsic errors, and standards used.
- `PUT /api/inspections/:id/evidence` — Uploads GPS coordinates and stamping photographs.
- `POST /api/inspections/:id/finalize` — Finalizes inspection verdict (`PASSED` or `FAILED`).

### 8.6 Certificates (`/api/certificates`)
- `GET /api/certificates` — Lists certificates scoped to stakeholder or jurisdiction.
- `POST /api/certificates/generate/:inspectionId` — Issues digital certificate with QR code and SHA-256 digest.
- `GET /api/certificates/:id` — Retrieves certificate metadata.
- `GET /api/certificates/verify/:token` — Public QR validation endpoint.
- `POST /api/certificates/:id/revoke` — Administrator-only revocation with statutory justification.

### 8.7 Public Verification (`/api/public`)
- `GET /api/public/verify/:token` — Unauthenticated public lookup for instant verification.

### 8.8 Notifications & Expiry (`/api/notifications`)
- `GET /api/notifications` — Retrieves in-app notifications with unread count.
- `PATCH /api/notifications/:id/read` — Marks notification as read.
- `PATCH /api/notifications/read-all` — Marks all notifications as read.
- `GET /api/notifications/preferences` — Retrieves stakeholder notification settings.
- `PUT /api/notifications/preferences` — Updates email and alert window preferences.
- `POST /api/notifications/trigger-expiry-check` — Administrator-only trigger for on-demand expiry evaluation.

### 8.9 Secure File Delivery (`/api/files`)
- `GET /api/files/:folder/:filename` — RBAC-enforced secure download for certificates, evidence, and documents.

### 8.10 Admin & Diagnostics (`/api/admin`)
- `GET /api/admin/analytics` — Platform metrics (instruments, applications, compliance rate).
- `GET /api/admin/audit-logs` — Full-stack audit log viewer with user, action, and date filters.
- `GET /api/admin/diagnostics/integrity` — Runs database referential integrity checks.

---

## 9. Implementation Status & Gap Analysis

To ensure strict compliance with project realities, the table below documents the exact implementation status of every architectural component:

| Component / Subsystem | Implementation Status | Technical Verification Notes |
| :--- | :---: | :--- |
| **Authentication & RBAC** | **Implemented** | Bcrypt password hashing, JWT validation, 6 system roles enforced across frontend and backend. |
| **Instrument Registry & Lifecycle** | **Implemented** | Full CRUD, category classification, capacity, accuracy classes, verification interval tracking. |
| **Application State Machine** | **Implemented** | Strict state transitions from `SUBMITTED` to `CERTIFICATE_GENERATED` with history tracking. |
| **Multi-Tier Scheduling** | **Implemented** | Date, time slot, premise/lab/GATC location types, officer assignment, and reschedule history. |
| **On-Site Inspection & MPE Engine** | **Implemented** | Checklists, standards used, intrinsic error vs MPE calculations, lead seal and hologram recording. |
| **GPS & Photo Evidence Capture** | **Implemented** | Latitude/longitude bounds validation, multi-part photo uploads with secure directory routing. |
| **Digital Certificate Generation** | **Implemented** | PDFKit vector PDF generation, unique serial numbers, SHA-256 tamper-evident digest creation. |
| **Public QR Code Verification** | **Implemented** | High-entropy 64-char hex tokens, unauthenticated lookup, dynamic validity and revocation check. |
| **Automated Expiry Scheduler** | **Implemented** | 24-hour background cron, 90d/30d/7d/expired alert rules, auto-status mutation, duplicate prevention. |
| **Security Middleware Suite** | **Implemented** | Helmet, CORS, RateLimiters, HPP, NoSQL injection blocker, Prototype pollution guard, XSS filter. |
| **Tenant-Isolated File Controller** | **Implemented** | Path traversal blocking, MIME checking, database ownership verification before file serving. |
| **Capacitor Mobile Shell** | **Implemented** | Native Android and iOS projects configured with barcode scanner, camera, and geolocation plugins. |
| **Hardware Bluetooth Scale Link** | **Not Implemented** | Direct Bluetooth serial communication with physical weighing balances is currently not implemented. |
| **Payment Gateway Integration** | **Simulated / Partial** | Fee structure and transaction reference tracking are implemented in DB; live Razorpay/BillDesk webhook integration is marked as simulated. |
| **Aadhaar e-Sign Integration** | **Not Implemented** | Digital signatures currently use internal cryptographic SHA-256 hashes; direct CDAC/NSDL Aadhaar e-Sign API is not connected. |
| **SMS Gateway Integration** | **Not Implemented** | Notifications are delivered via In-App alerts and SMTP Email; SMS gateway (CDAC / NIC SMS) is not connected. |

---

## 10. Conclusion & Production Readiness
**e-Maap Verify** fulfills all statutory and technical requirements set forth in **Smart India Hackathon Problem Statement 26036**. By eliminating physical paperwork, providing real-time cryptographic verification, enforcing zero-trust data access, and automating compliance tracking, the platform delivers a modern, transparent, and counterfeit-proof Legal Metrology ecosystem for the Department of Consumer Affairs.
