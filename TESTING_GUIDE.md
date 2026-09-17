# Testing Guide — Postman / Thunder Client / cURL
## Legal Metrology Online Verification System (SIH-26036)

Follow this step-by-step workflow to verify the end-to-end backend functionality from user registration to automated certificate generation and public QR verification.

---

### Prerequisites
1. Start the server:
   ```bash
   npm run dev
   ```
2. Or seed the initial Super Admin account:
   ```bash
   npm run create-admin
   ```
   Default Admin Credentials (from `.env`):
   - **Email:** `admin@doca.gov.in`
   - **Password:** `Admin@DoCA2026!`

---

### Step 1: Super Admin Login
**POST** `http://localhost:3000/api/auth/login`
```json
{
  "email": "admin@doca.gov.in",
  "password": "Admin@DoCA2026!"
}
```
*Expected Response:* `200 OK` with `token` and `user` object. Save this token as `{{ADMIN_TOKEN}}`.

---

### Step 2: Register a Business Stakeholder / Trader
**POST** `http://localhost:3000/api/auth/register`
```json
{
  "name": "Ramesh Gupta",
  "email": "ramesh.traders@example.com",
  "password": "TraderPass@2026",
  "phone": "9876541230",
  "role": "BUSINESS_USER",
  "stakeholderData": {
    "businessName": "Gupta Agro & Weighing Services",
    "businessType": "RETAILER",
    "tradeLicenseNumber": "TL/DEL/2025/99812",
    "gstNumber": "07AAAAA0000A1Z5",
    "registeredAddress": {
      "street": "42, Chandni Chowk Wholesale Market",
      "district": "Central Delhi",
      "state": "Delhi",
      "pincode": "110006"
    }
  }
}
```
*Expected Response:* `201 Created` with `token` for the business user. Save this token as `{{TRADER_TOKEN}}`.

---

### Step 3: Register a Legal Metrology Officer (Admin only)
**POST** `http://localhost:3000/api/users`
**Headers:** `Authorization: Bearer {{ADMIN_TOKEN}}`
```json
{
  "name": "Inspector Rajesh Kumar",
  "email": "rajesh.lmo@doca.gov.in",
  "password": "OfficerPass@2026",
  "phone": "9812345678",
  "role": "LEGAL_METROLOGY_OFFICER",
  "designation": "Assistant Controller of Legal Metrology",
  "jurisdiction": {
    "state": "Delhi",
    "district": "Central Delhi",
    "zone": "North Zone"
  }
}
```
*Expected Response:* `201 Created` with the newly created officer ID. Save this officer ID as `{{OFFICER_ID}}`.

---

### Step 4: Register an Instrument (as Trader)
**POST** `http://localhost:3000/api/instruments`
**Headers:** `Authorization: Bearer {{TRADER_TOKEN}}`
```json
{
  "category": "ELECTRONIC_WEIGHING_MACHINE",
  "instrumentType": "Non-Automatic High Precision Electronic Platform Scale",
  "manufacturer": "Essae-Teraoka Pvt Ltd",
  "modelNumber": "DS-215N",
  "serialNumber": "SN-ESSAE-2026-9481",
  "capacity": {
    "value": 150,
    "unit": "kg"
  },
  "accuracyClass": "CLASS_III",
  "verificationScaleInterval_e": "10 g",
  "minimumCapacity_Min": "200 g",
  "installationAddress": {
    "premiseName": "Main Warehouse Counter 1",
    "addressLine": "Shop 42, Chandni Chowk Wholesale Market",
    "city": "Delhi",
    "district": "Central Delhi",
    "state": "Delhi",
    "pincode": "110006"
  }
}
```
*Expected Response:* `201 Created` with generated `instrumentId` (e.g. `INS-2026-000001`). Save this `_id` as `{{INSTRUMENT_ID}}`.

---

### Step 5: Draft a Verification Application (as Trader)
**POST** `http://localhost:3000/api/applications`
**Headers:** `Authorization: Bearer {{TRADER_TOKEN}}`
```json
{
  "instrumentId": "{{INSTRUMENT_ID}}",
  "applicationType": "INITIAL_VERIFICATION",
  "preferredVerificationDate": "2026-09-15"
}
```
*Expected Response:* `201 Created` with `currentStatus: "DRAFT"` and `applicationNumber` (e.g. `LM-2026-000001`). Save this application `_id` as `{{APPLICATION_ID}}`.

---

### Step 6: Submit Verification Application (as Trader)
**PATCH** `http://localhost:3000/api/applications/{{APPLICATION_ID}}/submit`
**Headers:** `Authorization: Bearer {{TRADER_TOKEN}}`
*Expected Response:* `200 OK` with `currentStatus: "SUBMITTED"` and `submissionDate`.

---

### Step 7: Officer Scheduling & Allocation (as Admin / LMO)
**POST** `http://localhost:3000/api/schedules`
**Headers:** `Authorization: Bearer {{ADMIN_TOKEN}}`
```json
{
  "applicationId": "{{APPLICATION_ID}}",
  "assignedOfficer": "{{OFFICER_ID}}",
  "scheduledDate": "2026-09-15",
  "timeSlot": "09:00 - 12:00",
  "locationType": "ON_SITE_PREMISES",
  "locationAddress": "Shop 42, Chandni Chowk Wholesale Market, Central Delhi",
  "specialInstructions": "Bring Class F2 working standard weights up to 150 kg."
}
```
*Expected Response:* `201 Created` with schedule details; Application automatically moves to `SCHEDULED`.

---

### Step 8: Login as Legal Metrology Officer
**POST** `http://localhost:3000/api/auth/login`
```json
{
  "email": "rajesh.lmo@doca.gov.in",
  "password": "OfficerPass@2026"
}
```
*Expected Response:* `200 OK`. Save token as `{{OFFICER_TOKEN}}`.

---

### Step 9: Officer Records Field Inspection & Test Readings
**POST** `http://localhost:3000/api/inspections`
**Headers:** `Authorization: Bearer {{OFFICER_TOKEN}}`
```json
{
  "applicationId": "{{APPLICATION_ID}}",
  "gpsCoordinates": {
    "latitude": 28.6506,
    "longitude": 77.2301,
    "accuracyMeters": 4.5,
    "address": "Chandni Chowk, Central Delhi, Delhi 110006"
  },
  "instrumentCondition": {
    "visualCheckPassed": true,
    "levelingBubbleCentered": true,
    "modelApprovalPlateIntact": true,
    "zeroTrackingOperational": true
  },
  "standardsUsed": [
    {
      "standardId": "STD-DEL-F2-042",
      "denomination": "50 kg Class F2 standard cast iron weights",
      "calibrationValidUntil": "2027-03-31"
    }
  ],
  "measurementReadings": [
    {
      "testType": "Eccentricity (Corner Load Test)",
      "appliedLoad": 50,
      "indicatedReading": 50.00,
      "intrinsicError": 0.00,
      "maximumPermissibleError": 0.02,
      "isCompliant": true
    },
    {
      "testType": "Linearity Test at 150 kg Capacity",
      "appliedLoad": 150,
      "indicatedReading": 150.01,
      "intrinsicError": 0.01,
      "maximumPermissibleError": 0.03,
      "isCompliant": true
    }
  ],
  "stampingAndSealing": {
    "leadSealsApplied": 2,
    "hologramStickerNumber": "HOLO-DEL-2026-88912",
    "stampingYearMark": "2026/Q3",
    "sealingPlugsIntact": true
  },
  "remarks": "Instrument complies with Legal Metrology General Rules 2011 Schedule VI tolerances."
}
```
*Expected Response:* `201 Created`. Application moves to `INSPECTION`. Save `_id` as `{{INSPECTION_ID}}`.

---

### Step 10: Submit Verdict & Automatically Generate Certificate
**POST** `http://localhost:3000/api/results`
**Headers:** `Authorization: Bearer {{OFFICER_TOKEN}}`
```json
{
  "applicationId": "{{APPLICATION_ID}}",
  "inspectionId": "{{INSPECTION_ID}}",
  "verdict": "PASS",
  "complianceInformation": {
    "allMpeCompliant": true,
    "statutorySealAffixed": true
  },
  "officerRemarks": "Passed all tests within MPE. Digital certificate issued."
}
```
*Expected Response:* `201 Created` returning:
- Verification Result object
- Generated **Certificate** object with:
  - `certificateNumber` (e.g. `LM-CERT-2026-000001`)
  - `qrVerificationToken` (e.g. `LM-CERT-2026-000001-a1b2c3d4e5f6`)
  - `tamperEvidentHash` (SHA-256)
  - `qrCodeDataUrl` (Base64 QR code)
  - `certificatePdfPath` (Path to generated PDF file)

---

### Step 11: Public QR Verification (NO AUTH REQUIRED)
Anyone scanning the QR code or visiting this endpoint can verify the statutory certificate in real time:
**GET** `http://localhost:3000/api/certificates/verify/{{QR_VERIFICATION_TOKEN}}`

*Expected Response:* `200 OK`
```json
{
  "success": true,
  "message": "Certificate verification verified against live Legal Metrology database",
  "data": {
    "status": "VALID",
    "certificateNumber": "LM-CERT-2026-000001",
    "verificationDate": "2026-09-07T...",
    "validUntil": "2027-09-06T...",
    "issuingAuthority": "Department of Consumer Affairs, Legal Metrology Organization, Government of India",
    "tamperEvidentHash": "...",
    "stakeholder": {
      "businessName": "Gupta Agro & Weighing Services",
      "tradeLicenseNumber": "TL/DEL/2025/99812",
      "district": "Central Delhi",
      "state": "Delhi"
    },
    "instrument": {
      "instrumentId": "INS-2026-000001",
      "category": "ELECTRONIC_WEIGHING_MACHINE",
      "instrumentType": "Non-Automatic High Precision Electronic Platform Scale",
      "manufacturer": "Essae-Teraoka Pvt Ltd",
      "serialNumber": "SN-ESSAE-2026-9481",
      "capacity": { "value": 150, "unit": "kg" },
      "accuracyClass": "CLASS_III"
    },
    "officer": {
      "name": "Inspector Rajesh Kumar",
      "designation": "Assistant Controller of Legal Metrology",
      "jurisdiction": "Central Delhi"
    }
  }
}
```

---

### Step 12: View Real Dynamic Dashboard Metrics
**GET** `http://localhost:3000/api/dashboard/admin`
**Headers:** `Authorization: Bearer {{ADMIN_TOKEN}}`

All numbers, workload summaries, and chart aggregates are calculated live from MongoDB without any dummy data or hardcoded values!
