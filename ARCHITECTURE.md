# e-Maap Verify: System Architecture Documentation
**Smart India Hackathon (SIH) — Problem Statement ID: 26036**  
**Department of Consumer Affairs (DoCA), Government of India**  
**Architecture Specification & Component Interaction Diagrams**

---

## 1. High-Level System Architecture

The following diagram illustrates the multi-tier enterprise architecture of **e-Maap Verify**, showing client applications, the security gateway, backend application services, and persistent data storage.

```mermaid
graph TD
    subgraph Client Tier
        Web["React 19 SPA (Web Portal)<br/>Vite + Tailwind CSS 4"]
        Mobile["Capacitor Native App<br/>Android / iOS (MLKit + GPS)"]
        Public["Public Browser / QR Scanner<br/>Citizens & Enforcement Squads"]
    end

    subgraph Security & API Gateway
        Nginx["Reverse Proxy / Port 3000 Ingress"]
        Helmet["Helmet Security Headers<br/>(CSP, Anti-Sniff, X-XSS)"]
        RateLimit["Rate Limiter<br/>(Auth: 25/15m, API: 150/1m)"]
        SecCheck["Request Security Guard<br/>(NoSQL Injection & Prototype Defense)"]
        Sanitizer["XSS Deep Sanitizer"]
        JWTAuth["JWT Authentication Guard<br/>(`protect` middleware)"]
        RBAC["Role-Based Authorization<br/>(`authorize` / `restrictTo`)"]
    end

    subgraph Core Application Services
        AuthSvc["AuthService<br/>(Bcrypt + Token Engine)"]
        WorkflowSvc["ApplicationWorkflowService<br/>(State Transitions)"]
        SchedSvc["ScheduleService<br/>(Officer & Center Matching)"]
        InspSvc["InspectionService<br/>(MPE & Checklist Rules)"]
        CertSvc["CertificateService<br/>(SHA-256 Digest & QR Token)"]
        QRSvc["QRService<br/>(Public Verification URIs)"]
        PDFSvc["PDFService<br/>(PDFKit Legal Metrology Vector)"]
        ExpirySvc["ExpiryService<br/>(90d, 30d, 7d, Overdue Engine)"]
        NotifSvc["NotificationService<br/>(In-App & SMTP Dispatcher)"]
        AuditSvc["AuditService<br/>(Immutable Log Tracker)"]
    end

    subgraph Background Processing
        CronJob["ExpiryScheduler<br/>(Daily Automated 24h Cron)"]
    end

    subgraph Persistence & File Storage
        MongoDB[("MongoDB Atlas Replica Set<br/>Users, Instruments, Apps,<br/>Inspections, Certificates, Logs")]
        SecureFiles[("Encrypted Local File Store<br/>/uploads/documents<br/>/uploads/certificates<br/>/uploads/instrument-photos")]
    end

    Web -->|HTTPS REST| Nginx
    Mobile -->|HTTPS REST| Nginx
    Public -->|HTTPS GET /verify-certificate| Nginx

    Nginx --> Helmet
    Helmet --> RateLimit
    RateLimit --> SecCheck
    SecCheck --> Sanitizer
    Sanitizer --> JWTAuth
    JWTAuth --> RBAC

    RBAC --> AuthSvc
    RBAC --> WorkflowSvc
    RBAC --> SchedSvc
    RBAC --> InspSvc
    RBAC --> CertSvc
    RBAC --> ExpirySvc
    RBAC --> NotifSvc
    RBAC --> AuditSvc

    Public -.->|Bypasses JWT/RBAC| QRSvc

    CertSvc --> QRSvc
    CertSvc --> PDFSvc
    PDFSvc --> SecureFiles
    CronJob --> ExpirySvc
    ExpirySvc --> NotifSvc
    ExpirySvc --> MongoDB

    AuthSvc --> MongoDB
    WorkflowSvc --> MongoDB
    SchedSvc --> MongoDB
    InspSvc --> MongoDB
    CertSvc --> MongoDB
    NotifSvc --> MongoDB
    AuditSvc --> MongoDB
```

---

## 2. Verification Application Lifecycle State Machine

This state diagram depicts the formal lifecycle of a `VerificationApplication` and the corresponding status transitions of the associated `Instrument`.

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Business User Creates Draft
    DRAFT --> SUBMITTED: Uploads KYC & Documents

    state SUBMITTED {
        [*] --> PendingReview
        PendingReview: Awaiting LMO Jurisdiction Allocation
    }

    SUBMITTED --> UNDER_REVIEW: LMO Opens Application
    UNDER_REVIEW --> REJECTED: Incomplete / Non-compliant Documents
    REJECTED --> [*]: Re-application Required

    UNDER_REVIEW --> APPROVED: LMO Approves Application
    APPROVED --> SCHEDULED: Visit Date, Slot & Officer Assigned

    SCHEDULED --> INSPECTION_IN_PROGRESS: Field Officer Arrives On-Premise
    INSPECTION_IN_PROGRESS --> INSPECTION_COMPLETED: MPE Checks, GPS & Photos Recorded

    INSPECTION_COMPLETED --> VERIFIED: All Readings Comply with MPE
    INSPECTION_COMPLETED --> REJECTED_AFTER_INSPECTION: Readings Exceed MPE / Broken Seals

    REJECTED_AFTER_INSPECTION --> [*]: Instrument Marked REJECTED

    VERIFIED --> CERTIFICATE_GENERATED: LMO Signs & Generates Certificate
    
    state CERTIFICATE_GENERATED {
        [*] --> ActiveCertificate
        ActiveCertificate: Instrument -> ACTIVE_VERIFIED
        ActiveCertificate: Next Due Date Scheduled
    }

    CERTIFICATE_GENERATED --> [*]: Complete Cycle
```

---

## 3. Inspection, Calibration & Certificate Issuance Sequence

The sequence diagram below details the interaction between the Field Officer, Legal Metrology Officer (LMO), Backend Services, PDF Engine, and MongoDB when executing an on-site calibration verification.

```mermaid
sequenceDiagram
    autonumber
    actor FO as Field Verification Officer
    actor LMO as Legal Metrology Officer
    participant API as Express API Gateway
    participant InspSvc as InspectionService
    participant CertSvc as CertificateService
    participant PDF as PDFService (PDFKit)
    participant QR as QRService (qrcode)
    participant DB as MongoDB Atlas
    actor Biz as Commercial Trader

    FO->>API: PUT /api/inspections/:id/readings (Loads, Errors, Standard IDs)
    API->>InspSvc: Validate readings against MPE tolerances
    InspSvc->>DB: Save measurementReadings[]

    FO->>API: PUT /api/inspections/:id/evidence (GPS coords, lead seal, photo uploads)
    API->>InspSvc: Verify GPS bounds & sanitize photo paths
    InspSvc->>DB: Save GPS, leadSealsApplied, photographs[]

    FO->>API: POST /api/inspections/:id/submit
    API->>InspSvc: Mark inspectionStatus = SUBMITTED
    InspSvc->>DB: Update Inspection

    LMO->>API: POST /api/certificates/generate/:inspectionId
    API->>CertSvc: generateCertificateForInspection({ inspectionId, user: LMO })
    
    rect rgb(240, 248, 255)
        Note over CertSvc, DB: Database Transaction
        CertSvc->>DB: Fetch Inspection, Instrument & Stakeholder
        CertSvc->>CertSvc: Calculate validity window (validFrom, validUntil)
        CertSvc->>CertSvc: Generate Unique Certificate No: LM-CERT-YYYY-XXXXX-XXXX
        CertSvc->>CertSvc: Generate 64-char Hex Cryptographic Token (crypto.randomBytes)
        CertSvc->>CertSvc: Compute SHA-256 Digest over Certificate Metadata
        CertSvc->>QR: Generate vector QR Code pointing to /verify-certificate?token=qrToken
        QR-->>CertSvc: Base64 QR Data URL
        CertSvc->>PDF: generateCertificatePDF(certData, qrDataUrl, tamperEvidentHash)
        PDF-->>CertSvc: Saved to /uploads/certificates/cert.pdf
        CertSvc->>DB: Insert Certificate Record
        CertSvc->>DB: Update Application status = CERTIFICATE_GENERATED
        CertSvc->>DB: Update Instrument status = ACTIVE_VERIFIED, nextVerificationDueDate = validUntil
        CertSvc->>DB: Log Audit Event (AUDIT_ACTIONS.CERTIFICATE_GENERATED)
    end

    CertSvc->>API: Return Certificate Object
    API->>Biz: Dispatch In-App & Email Notification (Certificate Issued)
    API-->>LMO: HTTP 201 Created (Certificate JSON with download URL)
```

---

## 4. Public QR Verification & Cryptographic Anti-Counterfeiting Flow

The following diagram shows how any consumer or enforcement squad verifies an instrument on-site without needing an account or login.

```mermaid
sequenceDiagram
    autonumber
    actor Consumer as Citizen / Flying Squad
    participant Camera as Mobile Scanner / Camera
    participant WebUI as React Web / Capacitor UI (/verify-certificate)
    participant PublicAPI as GET /api/public/verify/:token
    participant CertModel as Certificate (Mongoose)
    participant DB as MongoDB Atlas

    Consumer->>Camera: Point phone at physical QR code on instrument
    Camera->>WebUI: Resolves URL: https://emaap.doca.gov.in/verify-certificate?token=64_HEX_TOKEN
    WebUI->>PublicAPI: Fetch verification metadata with qrToken
    PublicAPI->>CertModel: findOne({ qrToken: token })
    CertModel->>DB: Query by indexed qrToken
    DB-->>PublicAPI: Certificate with Populated Stakeholder, Instrument & Officer

    alt Certificate Not Found
        PublicAPI-->>WebUI: 404 Not Found (Invalid or Counterfeit Certificate)
        WebUI-->>Consumer: Displays Red Warning: "UNVERIFIED / COUNTERFEIT CERTIFICATE"
    else Certificate Found
        PublicAPI->>CertModel: Evaluate getDynamicStatus()
        note right of PublicAPI: Checks if validUntil < now, or if revoked/cancelled
        PublicAPI-->>WebUI: Sanitized Public Payload:<br/>- Certificate Number<br/>- Trader Name & District<br/>- Make, Model, Serial No, Capacity<br/>- Verification Date & Expiry Date<br/>- Dynamic Status (ACTIVE / EXPIRING / EXPIRED / REVOKED)<br/>- Officer Name & Jurisdiction<br/>- SHA-256 Tamper-Evident Digest
        WebUI-->>Consumer: Displays Verified Green Badge with Official DoCA Emblem
    end
```

---

## 5. Expiry Engine & Statutory Due-Date Escalation Architecture

The automated expiry engine executes continuously in the background to ensure all weights and measures are calibrated on schedule.

```mermaid
flowchart TD
    Start([24-Hour Cron Tick / Manual Admin Trigger]) --> ScanCertificates[Scan Certificates Table<br/>Filter: non-revoked, non-cancelled]
    Start --> ScanInstruments[Scan Instruments Table<br/>Filter: isActive = true, status != REJECTED]

    subgraph Certificate Alert Pipeline
        ScanCertificates --> ComputeCertDays[Compute daysRemaining = validUntil - now]
        ComputeCertDays --> IsCertExpired{daysRemaining <= 0?}
        IsCertExpired -- Yes --> SendCertExpired[Dispatch CERTIFICATE_EXPIRED<br/>Priority: URGENT<br/>Recipient: Business User]
        IsCertExpired -- No --> MatchCertWindow{Matched Window?}
        MatchCertWindow -- "days <= 7" --> SendCert7[Dispatch CERTIFICATE_EXPIRING_7]
        MatchCertWindow -- "days <= 30" --> SendCert30[Dispatch CERTIFICATE_EXPIRING_30]
        MatchCertWindow -- "days <= 60" --> SendCert60[Dispatch CERTIFICATE_EXPIRING_60]
        MatchCertWindow -- "> 60 days" --> CertUpToDate[Status: ACTIVE (No alert needed)]
    end

    subgraph Instrument Expiry & Multi-Tier Escalation Pipeline
        ScanInstruments --> ComputeInstDiff[Compute diffDays = nextVerificationDueDate - now]
        ComputeInstDiff --> CheckInstStage{Due Stage?}

        CheckInstStage -- "diffDays <= 0 (Overdue)" --> MutateStatus[Mutate Instrument.status = EXPIRED<br/>Log Audit Event: INSTRUMENT_EXPIRED]
        MutateStatus --> DispatchExpired[Dispatch VERIFICATION_EXPIRED (CRITICAL)<br/>Recipients: Business User + District LMO + Admin]

        CheckInstStage -- "0 < diffDays <= 7" --> DispatchUrgent[Dispatch VERIFICATION_URGENT (HIGH)<br/>Recipients: Business User + District LMO]

        CheckInstStage -- "7 < diffDays <= 30" --> DispatchWarning[Dispatch VERIFICATION_WARNING (MEDIUM)<br/>Recipient: Business User]

        CheckInstStage -- "30 < diffDays <= 90" --> DispatchReminder[Dispatch VERIFICATION_REMINDER (LOW)<br/>Recipient: Business User]

        CheckInstStage -- "> 90 days" --> InstUpToDate[Status: UP_TO_DATE]
    end

    subgraph Dedup & Storage
        SendCertExpired & SendCert7 & SendCert30 & SendCert60 & DispatchExpired & DispatchUrgent & DispatchWarning & DispatchReminder --> CheckDuplicate{Alert already sent<br/>for this cycle?}
        CheckDuplicate -- Yes --> SkipAlert[Skip Creation (Deduplication)]
        CheckDuplicate -- No --> CreateNotif[Insert into Notification Collection<br/>Send SMTP Email if enabled]
    end

    SkipAlert --> End([Cycle Complete])
    CreateNotif --> End
```

---

## 6. Tenancy & Role-Based Data Isolation Model

To ensure multi-tenant security across businesses, enforcement districts, and administrative tiers, data access is strictly segmented at both the database query and file-serving layers.

```mermaid
graph LR
    subgraph Data Access Boundaries
        subgraph Business User Boundary
            BU[Business User] -->|Can only query| OwnRecords["- Own Stakeholder Profile<br/>- Own Instruments<br/>- Own Applications<br/>- Own Certificates<br/>- Own Notifications"]
        end

        subgraph District LMO Boundary
            LMO[Legal Metrology Officer] -->|Can only query| DistrictRecords["- District Applications<br/>- District Verification Schedules<br/>- District Inspections<br/>- Can Issue Certificates for District"]
        end

        subgraph Field Officer Boundary
            FO[Field Verification Officer] -->|Can only query| AssignedOnly["- Explicitly Assigned Schedules<br/>- Explicitly Assigned Inspection Checklists<br/>- Assigned Evidence Files"]
        end

        subgraph Central Admin Boundary
            Admin[Administrator / Super Admin] -->|Full Jurisdiction| GlobalRecords["- All Applications & Instruments<br/>- Officer Re-assignment<br/>- Revocation Authority<br/>- System-wide Audit Logs & Diagnostics"]
        end
    end
```

### Storage-Level Tenant Isolation (`/uploads`)
When any user requests a protected file (e.g. `/api/files/certificates/cert.pdf` or `/api/files/instrument-photos/photo.jpg`):
1. The request passes through `getSecureFile` in `fileController.js`.
2. The user's JWT identity is verified.
3. If `req.user.role === 'BUSINESS_USER'`:
   - A compound `$or` query confirms that the file URL is referenced in a record belonging to the user's `Stakeholder` document.
   - If the file is not linked to their own instruments, applications, or certificates, access is aborted with **HTTP 403 Forbidden**.
4. If `req.user.role === 'FIELD_VERIFICATION_OFFICER'`:
   - The system queries `VerificationInspection` to ensure the officer is recorded as `assignedOfficer` or `officer` for that specific evidence.
5. If `req.user.role === 'LEGAL_METROLOGY_OFFICER'`:
   - Enforces jurisdictional and assignment checks for inspection evidence photos.
