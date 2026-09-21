# e-Maap Verify: Deployment & Operations Manual
**Smart India Hackathon (SIH) — Problem Statement ID: 26036**  
**Department of Consumer Affairs (DoCA), Ministry of Consumer Affairs, Food & Public Distribution**  
**Production Deployment Guide, Cloud Provisioning & Native Mobile Builds**

---

## 1. Production Architecture Overview

The **e-Maap Verify** platform is architected for high availability, low latency, and secure multi-region scaling:

```
                                  [ Cloudflare / Route 53 DNS ]
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       │                                                 │
                       ▼                                                 ▼
             [ Vercel Edge Network ]                           [ Render / Cloud Run ]
             Frontend Web Application                          Backend Node.js API Service
             - React 19 SPA (Vite build)                       - Express 4.21 Server
             - Global CDN Edge Distribution                    - Background Expiry Scheduler
             - Automated HTTPS & Brotli                        - PDFKit & QR Generation Engines
                       │                                                 │
                       │ REST API Calls                                  │ Mongoose TLS
                       └────────────────────────►────────────────────────┘
                                                                         │
                                                                         ▼
                                                              [ MongoDB Atlas Cluster ]
                                                              - Replica Set (M10+ recommended)
                                                              - Daily Snapshots & Point-in-Time Recovery
                                                              - Network Peering & IP Whitelisting
```

---

## 2. Environment Variables & Configuration

All production secrets and endpoints are managed via environment variables. Declare variables in hosting dashboards according to this specification:

### 2.1 Backend & Server Environment Variables

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | `3000` | Application ingress port (3000 required in container sandbox). |
| `NODE_ENV` | Yes | `production` | Enables Express caching and production optimizations. |
| `MONGO_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/Legal-Metrology` | MongoDB Atlas replica set connection URI. |
| `JWT_SECRET` | Yes | `min_32_char_random_cryptographic_secret` | Secret key for signing and verifying JWT authentication tokens. |
| `JWT_EXPIRES_IN` | No | `8h` | Lifetime of issued authentication tokens. |
| `CLIENT_URL` | Yes | `https://emaap.doca.gov.in` | Whitelisted frontend origin for CORS policies. |
| `SERVER_URL` | Yes | `https://api.emaap.doca.gov.in` | Canonical URL of the backend API service. |
| `APP_URL` | Yes | `https://emaap.doca.gov.in` | Public entry point used when generating QR verification URLs. |
| `UPLOAD_DIR` | Yes | `./uploads` (or `/data/uploads` persistent volume) | Absolute or relative path to store documents, certificates, and photos. |
| `SMTP_HOST` | No | `smtp.mailtrap.io` / `smtp.nic.in` | SMTP server host for dispatching notification emails. |
| `SMTP_PORT` | No | `587` | SMTP port (465 for SSL, 587 for STARTTLS). |
| `SMTP_USER` | No | `service_account@doca.gov.in` | SMTP authentication username. |
| `SMTP_PASSWORD`| No | `secure_smtp_password` | SMTP authentication password. |
| `SMTP_FROM` | No | `noreply-legalmetrology@doca.gov.in` | Sender address header on outbound statutory alerts. |
| `ADMIN_INITIAL_NAME` | No | `Super Administrator` | Default administrator name for database bootstrapping. |
| `ADMIN_INITIAL_EMAIL`| No | `admin@doca.gov.in` | Initial administrative email address for bootstrap seed. |
| `ADMIN_INITIAL_PASSWORD` | No | `SecureAdminPassword123!` | Initial administrator password for bootstrap seed. |

### 2.2 Frontend Environment Variables

| Variable Name | Required | Example | Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Optional | `https://api.emaap.doca.gov.in` | Base URL for API requests. Leave blank if deploying behind unified proxy. Required for mobile app builds. |

---

## 3. Step-by-Step Production Deployment

### 3.1 Option A: Unified Full-Stack Container (Render / Cloud Run / Docker)

The repository provides a single production build script combining the Vite client build and esbuild server bundle:

```bash
# 1. Install dependencies
npm install --production=false

# 2. Compile frontend and backend bundles
npm run build

# 3. Launch the production server
npm start
```

#### Build Artifacts Produced:
- `dist/` — Contains minified React HTML, JS, CSS, and asset bundles.
- `dist/server.cjs` — Self-contained CommonJS bundled server executable with external packages resolved.

#### Persistent Volume Mount for Uploads:
When deploying on container platforms (Render, Google Cloud Run, AWS ECS), mount a persistent disk volume to the directory specified by `UPLOAD_DIR` (e.g. `/data/uploads`) to ensure that uploaded photos and generated certificate PDFs persist across container restarts.

---

### 3.2 Option B: Decoupled Deployment (Vercel Frontend + Render Backend)

#### Step 1: Deploy Backend to Render
1. Create a new **Web Service** on [Render.com](https://render.com).
2. Connect your Git repository.
3. Configure service settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node backend/server.js` (or `npm start`)
4. Add a **Persistent Disk**:
   - Mount Path: `/opt/render/project/src/uploads`
   - Size: 10 GB+
5. Configure Environment Variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, etc.).
6. Deploy service and note your assigned HTTPS backend URL (e.g., `https://emaap-api.onrender.com`).

#### Step 2: Deploy Frontend to Vercel
1. Import the Git repository into [Vercel](https://vercel.com).
2. Select Framework Preset: **Vite**.
3. Configure Build and Output:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Configure Environment Variables:
   - `VITE_API_URL`: `https://emaap-api.onrender.com`
5. Deploy. Vercel provisions global edge distribution and an automatic SSL certificate.

---

## 4. Background Jobs & Scheduler Lifecycle

The automated expiry and due-date engine is managed by `backend/jobs/expiryScheduler.js`:
- **Auto-Initialization:** The scheduler initializes automatically upon server startup in `backend/server.js`.
- **Default Frequency:** Runs every 24 hours (`24 * 60 * 60 * 1000` ms).
- **Graceful Process Management:** In development or CLI test environments, the timer handles unref calls (`schedulerInterval.unref()`) to prevent blocking automated test runners.
- **Manual Trigger Endpoint:** Administrators can trigger an on-demand audit cycle via:
  ```http
  POST /api/notifications/trigger-expiry-check
  Authorization: Bearer <ADMIN_JWT>
  ```

---

## 5. Native Mobile Application Builds (Capacitor)

The mobile client leverages Capacitor 8.5 to package the React application into native Android and iOS packages.

### 5.1 Preparing Frontend for Mobile Build
Set the backend API endpoint in your `.env` before compiling:
```bash
VITE_API_URL=https://api.emaap.doca.gov.in
```

Run the build and sync command:
```bash
npm run cap:build
```
This executes `npm run build` and updates the native assets in `/android` and `/ios`.

---

### 5.2 Building Android APK / AAB (Google Play)

#### Prerequisites:
- Android Studio Ladybug (or higher)
- JDK 17 or 21
- Android SDK 34/35 with Build Tools

#### Build Instructions:
1. Open the Android project:
   ```bash
   npm run cap:open:android
   ```
2. In Android Studio, select **Build > Generate Signed Bundle / APK**.
3. Choose **Android App Bundle** (for Google Play Store distribution) or **APK** (for internal departmental distribution).
4. Select your release keystore and key alias.
5. Choose build variant: `release`.
6. Click **Finish**. Output is generated in `android/app/release/app-release.aab`.

#### Permissions in `android/app/src/main/AndroidManifest.xml`:
- `android.permission.INTERNET`
- `android.permission.ACCESS_NETWORK_STATE`
- `android.permission.CAMERA`
- `android.permission.ACCESS_FINE_LOCATION`
- `android.permission.ACCESS_COARSE_LOCATION`
- Google MLKit Vision Barcode UI metadata for on-device QR scanning.

---

### 5.3 Building iOS IPA (Apple App Store)

#### Prerequisites:
- macOS with Xcode 15+ installed
- Apple Developer Account provisioning profiles

#### Build Instructions:
1. Open the iOS project:
   ```bash
   npm run cap:open:ios
   ```
2. In Xcode, configure Signing & Capabilities with your Apple Team ID.
3. Select target: **Any iOS Device (arm64)**.
4. Select **Product > Archive**.
5. Once the archive completes, click **Distribute App** to submit to TestFlight or export the `.ipa` package.

---

## 6. Database Maintenance & Backup Strategy

### 6.1 MongoDB Atlas Automated Backups
- **Continuous Cloud Backups:** Enable continuous backups in MongoDB Atlas with a 7-day point-in-time recovery (PITR) window.
- **Snapshot Retention:** Retain daily snapshots for 30 days and monthly snapshots for 12 months for statutory compliance.

### 6.2 Administrative Integrity Diagnostics
The platform includes built-in diagnostic routines to detect orphaned records or broken entity relationships:
```http
GET /api/admin/diagnostics/integrity
Authorization: Bearer <ADMIN_JWT>
```
This routine validates:
1. Instruments with missing or non-existent Stakeholder references.
2. Certificates with broken Application or Instrument linkages.
3. Tamper verification across all issued certificates by recalculating SHA-256 digests.

---

## 7. Operational Monitoring & Health Checks

- **Health Probe Endpoint:** `GET /api/health` returns HTTP 200 with `{ status: "ok" }`. Use this for load balancer liveness and readiness probes.
- **Audit Log Inspection:** All authentication failures, certificate generation, revocations, and expiry transitions are queryable at `GET /api/admin/audit-logs`.
- **System Metrics:** In container environments, monitor CPU, memory usage, and open file descriptors to ensure optimal throughput during heavy PDF rendering cycles.
