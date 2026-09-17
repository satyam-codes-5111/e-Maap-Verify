# Online Verification System for Weighing & Measuring Instruments
## SIH Problem Statement ID: 26036
### Ministry of Consumer Affairs, Food & Public Distribution | Department of Consumer Affairs (DoCA)

---

## 📌 Base URL
```
http://localhost:3000/api
```

## 🔒 Authentication
All protected routes require an HTTP `Authorization` header containing the JWT Bearer token obtained from `/api/auth/login` or `/api/auth/register`:
```http
Authorization: Bearer <your_jwt_access_token>
```

---

## 📦 Standard Response Envelope Format

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Instruments retrieved successfully",
  "data": { ... },
  "timestamp": "2026-09-07T08:15:30.124Z"
}
```

### Paginated Success Response
```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "pages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2026-09-07T08:15:30.124Z"
}
```

### Error Response (`400`, `401`, `403`, `404`, `409`, `500`)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "serialNumber",
      "message": "Serial number is required"
    }
  ]
}
```

---

## 🔑 Role-Based Access Control (RBAC) Matrix

| User Role | Code | Permissions |
|---|---|---|
| **Super Admin** | `SUPER_ADMIN` | Full root access, user roles management, certificate revocation, system audit logs |
| **State / District Admin** | `ADMIN` | User provisioning, GATC approval, jurisdiction oversight |
| **Legal Metrology Officer** | `LEGAL_METROLOGY_OFFICER` | Application scrutiny, schedule assignment, inspection review, stamping verification |
| **Field Verification Officer** | `FIELD_VERIFICATION_OFFICER` | On-site MPE tests, GPS geotagging, seal stamping, photo capture |
| **GATC Officer** | `GATC_OFFICER` | Gov Approved Test Center verification for designated instrument classes |
| **Business User / Trader** | `BUSINESS_USER` | KYC onboarding, instrument registration, verification applications, certificate downloads |

---

## 📡 API Endpoint Catalog

### 1. Authentication & Session Management
- `POST /api/auth/register` — Register a business stakeholder or user account
- `POST /api/auth/login` — Authenticate and receive signed JWT token & user profile
- `GET /api/auth/me` — Retrieve currently authenticated user profile
- `POST /api/auth/change-password` — Change password with current password confirmation
- `POST /api/auth/logout` — Invalidate user session

### 2. User & Officer Management
- `GET /api/users` — Paginated list of users (Admin only; filter by role, district, status)
- `POST /api/users` — Create departmental officer / administrator account
- `GET /api/users/:id` — Get single user profile
- `PUT /api/users/:id` — Update user details / designation
- `PATCH /api/users/:id/status` — Toggle user active / suspended status
- `GET /api/users/officers/list` — Dropdown list of active verification officers for assignment

### 3. Stakeholder & KYC Management
- `GET /api/stakeholders/me` — Get authenticated stakeholder's business profile
- `PUT /api/stakeholders/me` — Update business address, GST, contact details
- `POST /api/stakeholders/me/upload-kyc` — Upload KYC documents (Trade license, GST certificate)
- `GET /api/stakeholders` — List stakeholders (Admin / LMO with search by trade license / GST)
- `GET /api/stakeholders/:id` — Get stakeholder profile by ID
- `PATCH /api/stakeholders/:id/kyc-status` — Approve or reject KYC status (Admin only)

### 4. Instrument Registration & Inventory
- `GET /api/instruments` — List registered instruments (Stakeholders see own; Admin/LMO see district/all)
- `POST /api/instruments` — Register a new instrument (Auto-generates `INS-YYYY-XXXXXX`)
- `GET /api/instruments/:id` — Get instrument details and verification history
- `PUT /api/instruments/:id` — Update installation location and specifications
- `POST /api/instruments/:id/photos` — Upload instrument on-site photograph
- `GET /api/instruments/expiring/summary` — Dynamic counts of instruments expiring in 7, 15, 30 days

### 5. Verification Application Workflow

#### `GET /api/applications`
- **Method**: `GET`
- **Auth**: Required (`Bearer <JWT>`)
- **Allowed Roles**: `SUPER_ADMIN`, `ADMIN`, `LEGAL_METROLOGY_OFFICER`, `GATC_OFFICER`, `FIELD_VERIFICATION_OFFICER`, `BUSINESS_USER`
- **Authorization**: `BUSINESS_USER` sees only applications for their own stakeholder profile. Admin/LMO see jurisdiction/all.
- **Query Parameters**: `page` (default 1), `limit` (default 10), `search` (matches applicationNumber, purpose, applicant name), `applicationStatus`, `applicationType`, `verificationType`, `stakeholder`, `instrument`, `fromDate`, `toDate`, `assignedOfficer`, `verificationCenter`, `sortBy`, `sortOrder`.
- **Success Response (`200 OK`)**: Paginated envelope with items, pagination metadata.

#### `POST /api/applications`
- **Method**: `POST`
- **Auth**: Required
- **Allowed Roles**: `BUSINESS_USER`, `ADMIN`, `SUPER_ADMIN`
- **Request Body**:
  ```json
  {
    "instrumentId": "651a...99",
    "applicationType": "NEW_VERIFICATION",
    "verificationType": "INITIAL",
    "requestedDate": "2026-09-15T09:00:00.000Z",
    "preferredVerificationCenter": "Delhi Central Testing Lab",
    "preferredLocation": "ON_SITE",
    "purpose": "Statutory annual reverification under LM Act 2009",
    "remarks": "Standard weights ready at premise"
  }
  ```
- **Authorization**: Backend automatically derives stakeholder from `req.user.stakeholderId`. Cross-stakeholder instrument requests return `403 Forbidden`. Inactive instruments return `400 Bad Request`.
- **Success Response (`201 Created`)**: Returns application document in `DRAFT` status with auto-generated statutory identifier `LM-YYYY-XXXXXX`.

#### `GET /api/applications/:id`
- **Method**: `GET`
- **Auth**: Required
- **Allowed Roles**: All authenticated roles (Ownership checks enforced: `BUSINESS_USER` restricted to own application).
- **Success Response (`200 OK`)**: Application details populated with stakeholder, instrument, reviewer, assignedOfficer, and verificationCenter.

#### `PATCH /api/applications/:id` or `PUT /api/applications/:id`
- **Method**: `PATCH` / `PUT`
- **Auth**: Required
- **Allowed Roles**: `BUSINESS_USER` (owner), `ADMIN`, `SUPER_ADMIN`
- **Authorization**: Only `DRAFT` applications can be modified. Attempting to edit a `SUBMITTED` or `APPROVED` application returns `403 Forbidden`.
- **Request Body**: Editable draft fields (`requestedDate`, `preferredVerificationCenter`, `preferredLocation`, `purpose`, `remarks`).

#### `POST /api/applications/:id/submit` or `PATCH /api/applications/:id/submit`
- **Method**: `POST` / `PATCH`
- **Auth**: Required
- **Allowed Roles**: `BUSINESS_USER` (owner), `ADMIN`, `SUPER_ADMIN`
- **Validation**: Verifies active stakeholder, valid instrument, mandatory statutory fields, and current status = `DRAFT`.
- **Transitions**: `DRAFT` → `SUBMITTED` (sets `submittedAt = new Date()`).
- **Success Response (`200 OK`)**: Updated application.

#### `POST /api/applications/:id/review` or `PATCH /api/applications/:id/review`
- **Method**: `POST` / `PATCH`
- **Auth**: Required
- **Allowed Roles**: `SUPER_ADMIN`, `ADMIN`, `LEGAL_METROLOGY_OFFICER`, `GATC_OFFICER`
- **Request Body**: `{ "remarks": "Documents scrutinised; eligible for verification" }`
- **Transitions**: `SUBMITTED` → `UNDER_REVIEW`.
- **Success Response (`200 OK`)**: Application with `reviewRemarks` and `reviewedBy` recorded.

#### `POST /api/applications/:id/approve` or `PATCH /api/applications/:id/approve`
- **Method**: `POST` / `PATCH`
- **Auth**: Required
- **Allowed Roles**: `SUPER_ADMIN`, `ADMIN`, `LEGAL_METROLOGY_OFFICER`
- **Request Body**: `{ "remarks": "Verified and approved for scheduling" }`
- **Transitions**: `UNDER_REVIEW` (or `SUBMITTED`) → `APPROVED`.
- **Success Response (`200 OK`)**: Application marked `APPROVED`.

#### `POST /api/applications/:id/reject` or `PATCH /api/applications/:id/reject`
- **Method**: `POST` / `PATCH`
- **Auth**: Required
- **Allowed Roles**: `SUPER_ADMIN`, `ADMIN`, `LEGAL_METROLOGY_OFFICER`
- **Request Body**: `{ "rejectionReason": "Mandatory calibration certificates missing" }`
- **Validation**: `rejectionReason` is mandatory; empty string returns `400 Bad Request`.
- **Transitions**: Any active status → `REJECTED`.
- **Success Response (`200 OK`)**: Application marked `REJECTED`.

#### `GET /api/applications/:id/history`
- **Method**: `GET`
- **Auth**: Required
- **Allowed Roles**: All authorized roles (Data isolation enforced).
- **Success Response (`200 OK`)**: Returns chronological audit entries tracing creation, submissions, status transitions, reviewer actions, and scheduling events.

#### `POST /api/applications/:id/documents`
- **Method**: `POST` (`multipart/form-data`)
- **Auth**: Required
- **Allowed Roles**: `BUSINESS_USER` (owner), `ADMIN`, `SUPER_ADMIN`
- **Payload**: `document` (MIME validation: PDF/PNG/JPEG, max 10MB).
- **Success Response (`201 Created`)**: Appends document metadata to `uploadedDocuments`.

---

### 6. Inspection Scheduling & Officer Allocation

#### `GET /api/schedules`
- **Method**: `GET`
- **Auth**: Required
- **Allowed Roles**: All authenticated roles (`BUSINESS_USER` sees schedules for own applications).
- **Query Parameters**: `status`, `assignedOfficer`, `verificationCenter`, `fromDate`, `toDate`, `page`, `limit`.
- **Success Response (`200 OK`)**: Paginated list of schedules with populated application and officer records.

#### `POST /api/schedules`
- **Method**: `POST`
- **Auth**: Required
- **Allowed Roles**: `SUPER_ADMIN`, `ADMIN`, `LEGAL_METROLOGY_OFFICER`, `GATC_OFFICER`
- **Request Body**:
  ```json
  {
    "applicationId": "651a...11",
    "verificationDate": "2026-09-18T10:00:00.000Z",
    "startTime": "10:00",
    "endTime": "12:00",
    "assignedOfficerId": "651a...22",
    "verificationCenterId": "651a...33",
    "location": "Premises of ABC Traders, Sector 4",
    "notes": "Bring standard class M1 weights"
  }
  ```
- **Validation & Conflict Checks**:
  1. Application must be in `APPROVED` status (else `400 Bad Request`).
  2. No duplicate active schedule for the application (else `409 Conflict`).
  3. No overlapping schedule for the same officer on the same date/timeslot (else `409 Conflict`).
  4. No overlapping schedule for the same instrument (else `409 Conflict`).
- **Transitions**: Application status automatically updates: `APPROVED` → `SCHEDULED`.
- **Success Response (`201 Created`)**: Created `VerificationSchedule` record.

#### `POST /api/schedules/:id/reschedule` or `PATCH /api/schedules/:id/reschedule`
- **Method**: `POST` / `PATCH`
- **Auth**: Required
- **Allowed Roles**: `SUPER_ADMIN`, `ADMIN`, `LEGAL_METROLOGY_OFFICER`
- **Request Body**:
  ```json
  {
    "verificationDate": "2026-09-22T14:00:00.000Z",
    "startTime": "14:00",
    "endTime": "16:00",
    "reason": "Officer on official court duty; trader concurred",
    "assignedOfficerId": "651a...22"
  }
  ```
- **Conflict Checks**: Evaluates officer, instrument, and center availability for the new timeslot.
- **Audit**: Appends previous schedule entry to `rescheduleHistory` array.
- **Success Response (`200 OK`)**: Updated schedule with status `RESCHEDULED`.

### 7. Field Inspection & Metrological Testing
- `GET /api/inspections/assigned` — Inspection queue for logged-in field officer
- `POST /api/inspections` — Record test readings, MPE errors, standards used, GPS coordinates (`SCHEDULED` → `INSPECTION`)
- `POST /api/inspections/:id/photos` — Upload field test evidence photo

### 8. Verification Verdict & Stamping
- `POST /api/results` — Submit final verification verdict (`PASS` or `FAIL`)
  * If `PASS`: Auto-generates Certificate with PDF, QR token, and tamper-evident SHA-256 hash (`INSPECTION` → `VERIFIED` → `CERTIFICATE_GENERATED`)
  * If `FAIL`: Records statutory rejection and flags instrument as `REJECTED`
- `GET /api/results/application/:applicationId` — View official test sheet and verdict

### 9. Digital Certificates & Public QR Verification
- `GET /api/certificates` — Paginated certificate registry (filter by status: VALID, EXPIRED, REVOKED)
- `GET /api/certificates/:id` — Certificate metadata and verification history
- `GET /api/certificates/:id/download` — Download official Legal Metrology Certificate PDF
- `PATCH /api/certificates/:id/revoke` — Revoke certificate with mandatory audit justification
- `GET /api/certificates/verify/:token` — **PUBLIC ENDPOINT (No auth required)**: Scan QR code to verify authenticity directly from the DoCA database

### 10. Dynamic Dashboards (Zero Dummy Data)
- `GET /api/dashboard/admin` — Dynamic aggregations: total applications, status breakdown, instrument categories, officer workloads
- `GET /api/dashboard/officer` — Officer workload: assigned inspections, today's schedule, pending tests
- `GET /api/dashboard/stakeholder` — Trader overview: active certificates, expiring instruments, pending applications

### 11. Reports & Statutory Audit Trail
- `GET /api/reports/summary` — Aggregate verification summary with date range, fees, and pass/fail metrics
- `GET /api/reports/audit-logs` — Immutable audit log trail (User, IP, Action, Entity, Timestamp)
