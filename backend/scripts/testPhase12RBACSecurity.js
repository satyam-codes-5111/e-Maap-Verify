import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { Certificate } from '../models/Certificate.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { ENV } from '../config/env.js';
import {
  USER_ROLES,
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  SCHEDULE_STATUSES,
  INSPECTION_STATUSES,
  CERTIFICATE_STATUSES,
  INSTRUMENT_CATEGORIES,
  ACCURACY_CLASSES,
  INSTRUMENT_STATUSES,
} from '../config/constants.js';

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;
const failureDetails = [];

function assert(condition, message, detail = '') {
  if (condition) {
    passed++;
    console.log(`[✅ PASS] Test ${passed + failed}: ${message} ${detail ? `(${detail})` : ''}`);
  } else {
    failed++;
    const failMsg = `[❌ FAIL] Test ${passed + failed}: ${message} ${detail ? `(${detail})` : ''}`;
    console.error(failMsg);
    failureDetails.push(failMsg);
  }
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      jurisdiction: user.jurisdiction,
    },
    ENV.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...options.headers };
  let body = options.body;

  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
}

async function runRBACSecurityTests() {
  console.log('===============================================================');
  console.log('🛡️ Phase 12 Part 2 — RBAC & Access Isolation Security Suite');
  console.log('===============================================================');

  await connectDB();

  try {
    const defaultPassword = 'Password123#Secure';

    // 1. Setup / Upsert Users for each role
    async function getOrCreateUser(email, role, name, extra = {}) {
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          name,
          email,
          password: defaultPassword,
          role,
          isActive: true,
          ...extra,
        });
        await user.save();
      } else {
        user.password = defaultPassword;
        user.isActive = true;
        user.role = role;
        Object.assign(user, extra);
        await user.save();
      }
      return user;
    }

    const superAdmin = await getOrCreateUser(
      'rbac_super_admin@doca.gov.in',
      USER_ROLES.SUPER_ADMIN,
      'RBAC Super Admin'
    );
    const admin = await getOrCreateUser(
      'rbac_admin@doca.gov.in',
      USER_ROLES.ADMIN,
      'RBAC Admin'
    );
    const lmoA = await getOrCreateUser(
      'rbac_lmo_a@doca.gov.in',
      USER_ROLES.LEGAL_METROLOGY_OFFICER,
      'RBAC LMO Officer A',
      {
        jurisdiction: {
          state: 'Maharashtra',
          district: 'Mumbai City',
          zone: 'South Zone',
        },
      }
    );
    const lmoB = await getOrCreateUser(
      'rbac_lmo_b@doca.gov.in',
      USER_ROLES.LEGAL_METROLOGY_OFFICER,
      'RBAC LMO Officer B',
      {
        jurisdiction: {
          state: 'Maharashtra',
          district: 'Pune',
          zone: 'West Zone',
        },
      }
    );
    const fvo = await getOrCreateUser(
      'rbac_fvo@doca.gov.in',
      USER_ROLES.FIELD_VERIFICATION_OFFICER,
      'RBAC Field Officer'
    );
    const gatc = await getOrCreateUser(
      'rbac_gatc@doca.gov.in',
      USER_ROLES.GATC_OFFICER,
      'RBAC GATC Officer'
    );
    const businessUserA = await getOrCreateUser(
      'rbac_trader_a@apexweigh.com',
      USER_ROLES.BUSINESS_USER,
      'RBAC Trader User A'
    );
    const businessUserB = await getOrCreateUser(
      'rbac_trader_b@metroscale.com',
      USER_ROLES.BUSINESS_USER,
      'RBAC Trader User B'
    );

    // Auth Tokens
    const tokenSuperAdmin = generateToken(superAdmin);
    const tokenAdmin = generateToken(admin);
    const tokenLmoA = generateToken(lmoA);
    const tokenLmoB = generateToken(lmoB);
    const tokenFvo = generateToken(fvo);
    const tokenGatc = generateToken(gatc);
    const tokenBusinessA = generateToken(businessUserA);
    const tokenBusinessB = generateToken(businessUserB);

    // 2. Setup / Upsert Stakeholders
    async function getOrCreateStakeholder(user, businessName, district) {
      let stakeholder = await Stakeholder.findOne({ user: user._id });
      if (!stakeholder) {
        stakeholder = new Stakeholder({
          user: user._id,
          businessName,
          tradeLicenseNumber: `TL-${Math.floor(100000 + Math.random() * 900000)}`,
          registeredAddress: {
            street: '123 Market Rd',
            city: district,
            district,
            state: 'Maharashtra',
            pincode: '400001',
          },
          contactPerson: {
            name: user.name,
            phone: '9876543210',
            email: user.email,
          },
          kycStatus: 'VERIFIED',
        });
        await stakeholder.save();
      }
      return stakeholder;
    }

    const stakeholderA = await getOrCreateStakeholder(
      businessUserA,
      'Apex Weighing Systems A',
      'Mumbai City'
    );
    const stakeholderB = await getOrCreateStakeholder(
      businessUserB,
      'Metro Scales Pvt Ltd B',
      'Pune'
    );

    // 3. Setup / Upsert Instruments
    async function getOrCreateInstrument(stakeholder, serialNumber, user) {
      let inst = await Instrument.findOne({ serialNumber });
      if (!inst) {
        inst = new Instrument({
          instrumentId: `LM-RBAC-${Math.floor(Math.random() * 900000 + 100000)}`,
          stakeholder: stakeholder._id,
          category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
          instrumentType: 'BENCH_SCALE',
          manufacturer: 'Apex Scales',
          modelNumber: 'AS-5000',
          serialNumber,
          capacity: { value: 15, unit: 'kg' },
          accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
          verificationScaleInterval_e: '5g',
          verificationIntervalMonths: 12,
          status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
          installationAddress: {
            premiseName: 'Plot 101 MIDC',
            addressLine: 'Plot 101 MIDC Andheri',
            city: stakeholder.registeredAddress?.city || 'Mumbai',
            state: stakeholder.registeredAddress?.state || 'Maharashtra',
            district: stakeholder.registeredAddress?.district || 'Mumbai',
            pincode: stakeholder.registeredAddress?.pincode || '400093',
          },
          createdBy: user._id,
          isActive: true,
        });
        await inst.save();
      }
      return inst;
    }

    const instrumentA = await getOrCreateInstrument(stakeholderA, 'RBAC-SN-A-001', businessUserA);
    const instrumentB = await getOrCreateInstrument(stakeholderB, 'RBAC-SN-B-002', businessUserB);

    // 4. Setup / Upsert Applications
    async function getOrCreateApplication(stakeholder, instrument, appNumber, assignedLmo) {
      let appRecord = await VerificationApplication.findOne({ applicationNumber: appNumber });
      if (!appRecord) {
        appRecord = new VerificationApplication({
          applicationNumber: appNumber,
          stakeholder: stakeholder._id,
          instrument: instrument._id,
          applicationType: APPLICATION_TYPES.INITIAL_VERIFICATION,
          verificationType: 'INITIAL',
          currentStatus: APPLICATION_STATUSES.DRAFT,
          assignedLMO: assignedLmo._id,
          purpose: 'Statutory verification calibration test',
          requestedDate: new Date(),
        });
        await appRecord.save();
      }
      return appRecord;
    }

    const appA = await getOrCreateApplication(
      stakeholderA,
      instrumentA,
      'APP-RBAC-A-001',
      lmoA
    );
    const appB = await getOrCreateApplication(
      stakeholderB,
      instrumentB,
      'APP-RBAC-B-002',
      lmoB
    );

    // 5. Setup / Upsert Inspection and Schedule for Officer A
    let scheduleA = await VerificationSchedule.findOne({ application: appA._id });
    if (!scheduleA) {
      scheduleA = new VerificationSchedule({
        scheduleNumber: `SCH-RBAC-A-${Math.floor(100000 + Math.random() * 900000)}`,
        application: appA._id,
        stakeholder: stakeholderA._id,
        instrument: instrumentA._id,
        assignedOfficer: lmoA._id,
        scheduledDate: new Date(),
        scheduledTimeSlot: 'MORNING_10_TO_1',
        status: SCHEDULE_STATUSES.IN_PROGRESS,
        locationAddress: 'South Zone Lab, Mumbai City',
      });
      await scheduleA.save();
    }

    let inspectionA = await VerificationInspection.findOne({ application: appA._id });
    if (!inspectionA) {
      inspectionA = new VerificationInspection({
        inspectionNumber: `INSP-RBAC-A-${Math.floor(100000 + Math.random() * 900000)}`,
        application: appA._id,
        schedule: scheduleA._id,
        stakeholder: stakeholderA._id,
        instrument: instrumentA._id,
        assignedOfficer: lmoA._id,
        officer: lmoA._id,
        inspectionStatus: INSPECTION_STATUSES.IN_PROGRESS,
        startTime: new Date(),
        location: 'South Zone Lab, Mumbai City',
        gpsCoordinates: { latitude: 18.922, longitude: 72.8346 },
      });
      await inspectionA.save();
    }

    // 6. Setup / Upsert Certificate for Stakeholder B
    let certB = await Certificate.findOne({ stakeholder: stakeholderB._id });
    if (!certB) {
      certB = new Certificate({
        certificateNumber: `CERT-RBAC-B-${Math.floor(100000 + Math.random() * 900000)}`,
        stakeholder: stakeholderB._id,
        instrument: instrumentB._id,
        application: appB._id,
        issuedBy: lmoB._id,
        issuedByOfficer: lmoB._id,
        issuedAt: new Date(),
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: CERTIFICATE_STATUSES.ACTIVE,
        certificateStatus: CERTIFICATE_STATUSES.ACTIVE,
        qrToken: `QR-TOKEN-RBAC-B-${Math.floor(100000 + Math.random() * 900000)}`,
        securityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        tamperEvidentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });
      await certB.save();
    }

    console.log('✅ Setup completed: All RBAC test roles, users, and records initialized.\n');

    // =========================================================================
    // SECTION 1: ROLE-BASED ACCESS CONTROL FOR ALL ROLES
    // =========================================================================
    console.log('--- SECTION 1: Role-Based Access Control for All Roles ---');

    // Test 1: SUPER_ADMIN can access admin dashboard summary
    const saDashRes = await api('/api/admin/dashboard/summary', {
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    assert(
      saDashRes.status === 200,
      'SUPER_ADMIN can access admin dashboard summary (HTTP 200)',
      `Status: ${saDashRes.status}`
    );

    // Test 2: ADMIN can access admin dashboard summary
    const adminDashRes = await api('/api/admin/dashboard/summary', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(
      adminDashRes.status === 200,
      'ADMIN can access admin dashboard summary (HTTP 200)',
      `Status: ${adminDashRes.status}`
    );

    // Test 3: LMO can access verification applications list
    const lmoAppsRes = await api('/api/applications', {
      headers: { Authorization: `Bearer ${tokenLmoA}` },
    });
    assert(
      lmoAppsRes.status === 200,
      'LEGAL_METROLOGY_OFFICER can access applications list (HTTP 200)',
      `Status: ${lmoAppsRes.status}`
    );

    // Test 4: FIELD_VERIFICATION_OFFICER can access assigned inspections list
    const fvoInspRes = await api('/api/inspections', {
      headers: { Authorization: `Bearer ${tokenFvo}` },
    });
    assert(
      fvoInspRes.status === 200,
      'FIELD_VERIFICATION_OFFICER can access inspections list (HTTP 200)',
      `Status: ${fvoInspRes.status}`
    );

    // Test 5: GATC_OFFICER can access verification schedules list
    const gatcSchedRes = await api('/api/schedules', {
      headers: { Authorization: `Bearer ${tokenGatc}` },
    });
    assert(
      gatcSchedRes.status === 200,
      'GATC_OFFICER can access schedules list (HTTP 200)',
      `Status: ${gatcSchedRes.status}`
    );

    // Test 6: BUSINESS_USER can access own stakeholder profile
    const buMeRes = await api('/api/stakeholders/me', {
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
    });
    assert(
      buMeRes.status === 200,
      'BUSINESS_USER can access own stakeholder profile (HTTP 200)',
      `Status: ${buMeRes.status}`
    );

    // =========================================================================
    // SECTION 2: PRIVILEGE ESCALATION PREVENTION
    // =========================================================================
    console.log('\n--- SECTION 2: Privilege Escalation Prevention ---');

    // Test 7: BUSINESS_USER cannot access admin dashboard
    const buAdminDash = await api('/api/admin/dashboard/summary', {
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
    });
    assert(
      buAdminDash.status === 403,
      'BUSINESS_USER cannot access admin dashboard (HTTP 403)',
      `Status: ${buAdminDash.status}`
    );

    // Test 8: BUSINESS_USER cannot access admin reports
    const buAdminReports = await api('/api/admin/reports', {
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
    });
    assert(
      buAdminReports.status === 403,
      'BUSINESS_USER cannot access admin reports (HTTP 403)',
      `Status: ${buAdminReports.status}`
    );

    // Test 9: FIELD_VERIFICATION_OFFICER cannot access admin dashboard
    const fvoAdminDash = await api('/api/admin/dashboard/summary', {
      headers: { Authorization: `Bearer ${tokenFvo}` },
    });
    assert(
      fvoAdminDash.status === 403,
      'FIELD_VERIFICATION_OFFICER cannot access admin dashboard (HTTP 403)',
      `Status: ${fvoAdminDash.status}`
    );

    // Test 10: FIELD_VERIFICATION_OFFICER cannot access user management
    const fvoUsersRes = await api('/api/users', {
      headers: { Authorization: `Bearer ${tokenFvo}` },
    });
    assert(
      fvoUsersRes.status === 403,
      'FIELD_VERIFICATION_OFFICER cannot access user management (HTTP 403)',
      `Status: ${fvoUsersRes.status}`
    );

    // Test 11: GATC_OFFICER cannot access admin dashboard
    const gatcAdminDash = await api('/api/admin/dashboard/summary', {
      headers: { Authorization: `Bearer ${tokenGatc}` },
    });
    assert(
      gatcAdminDash.status === 403,
      'GATC_OFFICER cannot access admin dashboard (HTTP 403)',
      `Status: ${gatcAdminDash.status}`
    );

    // Test 12: LMO cannot access user management
    const lmoUsersRes = await api('/api/users', {
      headers: { Authorization: `Bearer ${tokenLmoA}` },
    });
    assert(
      lmoUsersRes.status === 403,
      'LEGAL_METROLOGY_OFFICER cannot access user management (HTTP 403)',
      `Status: ${lmoUsersRes.status}`
    );

    // Test 13: ADMIN cannot provision a SUPER_ADMIN account
    const adminCreateSARes = await api('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: {
        name: 'Rogue Super Admin',
        email: 'rogue_sa@doca.gov.in',
        password: defaultPassword,
        phone: '9876543210',
        role: USER_ROLES.SUPER_ADMIN,
        designation: 'Unauthorized Super Admin',
      },
    });
    assert(
      adminCreateSARes.status === 403,
      'ADMIN cannot provision a SUPER_ADMIN account (HTTP 403)',
      `Status: ${adminCreateSARes.status}`
    );

    // Test 14: ADMIN cannot provision another ADMIN account
    const adminCreateAdminRes = await api('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: {
        name: 'Rogue Admin',
        email: 'rogue_admin@doca.gov.in',
        password: defaultPassword,
        phone: '9876543210',
        role: USER_ROLES.ADMIN,
        designation: 'Unauthorized Admin',
      },
    });
    assert(
      adminCreateAdminRes.status === 403,
      'ADMIN cannot provision an ADMIN account (HTTP 403)',
      `Status: ${adminCreateAdminRes.status}`
    );

    // Test 15: ADMIN cannot modify SUPER_ADMIN user account
    const adminEditSARes = await api(`/api/users/${superAdmin._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: {
        name: 'Tampered Super Admin',
        designation: 'Demoted',
      },
    });
    assert(
      adminEditSARes.status === 403,
      'ADMIN cannot modify a SUPER_ADMIN account (HTTP 403)',
      `Status: ${adminEditSARes.status}`
    );

    // Test 16: ADMIN cannot deactivate a SUPER_ADMIN account
    const adminDeactivateSARes = await api(`/api/users/${superAdmin._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { isActive: false },
    });
    assert(
      adminDeactivateSARes.status === 403,
      'ADMIN cannot deactivate a SUPER_ADMIN account (HTTP 403)',
      `Status: ${adminDeactivateSARes.status}`
    );

    // Test 17: ADMIN cannot alter a user role (role modification requires SUPER_ADMIN)
    const adminChangeRoleRes = await api(`/api/users/${businessUserA._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { role: USER_ROLES.LEGAL_METROLOGY_OFFICER },
    });
    assert(
      adminChangeRoleRes.status === 403,
      'ADMIN cannot alter user roles (HTTP 403, requires SUPER_ADMIN)',
      `Status: ${adminChangeRoleRes.status}`
    );

    // =========================================================================
    // SECTION 3: CROSS-USER DATA ISOLATION
    // =========================================================================
    console.log('\n--- SECTION 3: Cross-User Data Isolation ---');

    // Test 18: BUSINESS_USER A cannot view Stakeholder B profile
    const buViewOtherStakeholder = await api(`/api/stakeholders/${stakeholderB._id}`, {
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
    });
    assert(
      buViewOtherStakeholder.status === 403,
      'BUSINESS_USER cannot view another stakeholder business profile (HTTP 403)',
      `Status: ${buViewOtherStakeholder.status}`
    );

    // Test 19: BUSINESS_USER A cannot update Stakeholder B profile
    const buUpdateOtherStakeholder = await api(`/api/stakeholders/${stakeholderB._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
      body: { businessName: 'Hacked Business Name' },
    });
    assert(
      buUpdateOtherStakeholder.status === 403,
      'BUSINESS_USER cannot update another stakeholder business profile (HTTP 403)',
      `Status: ${buUpdateOtherStakeholder.status}`
    );

    // Test 20: BUSINESS_USER A cannot view Instrument B
    const buViewOtherInstrument = await api(`/api/instruments/${instrumentB._id}`, {
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
    });
    assert(
      buViewOtherInstrument.status === 403,
      'BUSINESS_USER cannot view another stakeholder registered instrument (HTTP 403)',
      `Status: ${buViewOtherInstrument.status}`
    );

    // Test 21: BUSINESS_USER A cannot update Instrument B
    const buUpdateOtherInstrument = await api(`/api/instruments/${instrumentB._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
      body: { manufacturer: 'Malicious Manufacturer' },
    });
    assert(
      buUpdateOtherInstrument.status === 403,
      'BUSINESS_USER cannot update another stakeholder registered instrument (HTTP 403)',
      `Status: ${buUpdateOtherInstrument.status}`
    );

    // Test 22: BUSINESS_USER A cannot view Application B
    const buViewOtherApp = await api(`/api/applications/${appB._id}`, {
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
    });
    assert(
      buViewOtherApp.status === 403,
      'BUSINESS_USER cannot view another stakeholder verification application (HTTP 403)',
      `Status: ${buViewOtherApp.status}`
    );

    // Test 23: BUSINESS_USER A cannot modify Application B draft
    const buUpdateOtherApp = await api(`/api/applications/${appB._id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
      body: { remarks: 'Malicious modification of foreign application' },
    });
    assert(
      buUpdateOtherApp.status === 403,
      'BUSINESS_USER cannot modify another stakeholder verification application (HTTP 403)',
      `Status: ${buUpdateOtherApp.status}`
    );

    // Test 24: BUSINESS_USER A cannot view Inspection B
    const buViewOtherInsp = await api(`/api/inspections/${inspectionA._id}`, {
      headers: { Authorization: `Bearer ${tokenBusinessB}` },
    });
    assert(
      buViewOtherInsp.status === 403,
      'BUSINESS_USER cannot view another stakeholder verification inspection (HTTP 403)',
      `Status: ${buViewOtherInsp.status}`
    );

    // Test 25: BUSINESS_USER A cannot view Certificate B
    const buViewOtherCert = await api(`/api/certificates/${certB._id}`, {
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
    });
    assert(
      buViewOtherCert.status === 403,
      'BUSINESS_USER cannot view another stakeholder official certificate (HTTP 403)',
      `Status: ${buViewOtherCert.status}`
    );

    // Test 26: BUSINESS_USER A cannot download Certificate B
    const buDownloadOtherCert = await api(`/api/certificates/${certB._id}/download`, {
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
    });
    assert(
      buDownloadOtherCert.status === 403,
      'BUSINESS_USER cannot download another stakeholder official certificate PDF (HTTP 403)',
      `Status: ${buDownloadOtherCert.status}`
    );

    // =========================================================================
    // SECTION 4: OFFICER ISOLATION & JURISDICTION SECURITY
    // =========================================================================
    console.log('\n--- SECTION 4: Officer Isolation & Jurisdiction Security ---');

    // Test 27: Unassigned Officer B (Pune) cannot view Officer A inspection (Mumbai City)
    const officerBViewInspA = await api(`/api/inspections/${inspectionA._id}`, {
      headers: { Authorization: `Bearer ${tokenLmoB}` },
    });
    assert(
      officerBViewInspA.status === 403,
      'Unassigned officer cannot view inspection assigned to another officer (HTTP 403)',
      `Status: ${officerBViewInspA.status}`
    );

    // Test 28: Unassigned Officer B cannot update draft of Officer A inspection
    const officerBUpdateInspA = await api(`/api/inspections/${inspectionA._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenLmoB}` },
      body: {
        observations: 'Unauthorized inspection draft update by foreign officer',
      },
    });
    assert(
      officerBUpdateInspA.status === 403,
      'Unassigned officer cannot update draft inspection of another officer (HTTP 403)',
      `Status: ${officerBUpdateInspA.status}`
    );

    // Test 29: Unauthorized officer cannot upload evidence to another officer inspection
    const formData = new FormData();
    const fakeBlob = new Blob(['evidence-test-content'], { type: 'image/jpeg' });
    formData.append('evidence', fakeBlob, 'rogue_evidence.jpg');

    const officerBUploadEvidence = await fetch(
      `${BASE_URL}/api/inspections/${inspectionA._id}/evidence`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenLmoB}` },
        body: formData,
      }
    );
    assert(
      officerBUploadEvidence.status === 403,
      'Unauthorized officer cannot upload evidence to another officer inspection (HTTP 403)',
      `Status: ${officerBUploadEvidence.status}`
    );

    // Test 30: Unassigned Officer B (outside jurisdiction) cannot finalize Officer A inspection
    const officerBFinalizeInspA = await api(`/api/inspections/${inspectionA._id}/finalize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenLmoB}` },
      body: {
        result: 'VERIFIED',
        officerRemarks: 'Unauthorized finalization by foreign officer',
      },
    });
    assert(
      officerBFinalizeInspA.status === 403,
      'Unauthorized officer cannot finalize another officer inspection verdict (HTTP 403)',
      `Status: ${officerBFinalizeInspA.status}`
    );

    // =========================================================================
    // SECTION 5: CERTIFICATE SECURITY & REVOCATION RESTRICTIONS
    // =========================================================================
    console.log('\n--- SECTION 5: Certificate Security & Verification Restrictions ---');

    // Test 31: BUSINESS_USER cannot revoke a certificate
    const buRevokeCert = await api(`/api/certificates/${certB._id}/revoke`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenBusinessB}` },
      body: { reason: 'Unauthorized revocation attempt by business user' },
    });
    assert(
      buRevokeCert.status === 403,
      'BUSINESS_USER cannot revoke an official certificate (HTTP 403)',
      `Status: ${buRevokeCert.status}`
    );

    // Test 32: FIELD_VERIFICATION_OFFICER cannot revoke a certificate
    const fvoRevokeCert = await api(`/api/certificates/${certB._id}/revoke`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenFvo}` },
      body: { reason: 'Unauthorized revocation attempt by FVO' },
    });
    assert(
      fvoRevokeCert.status === 403,
      'FIELD_VERIFICATION_OFFICER cannot revoke an official certificate (HTTP 403)',
      `Status: ${fvoRevokeCert.status}`
    );

    // Test 33: Direct modification of certificate via PUT /api/certificates/:id is rejected (no mutating route)
    const directModifyCert = await api(`/api/certificates/${certB._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { status: 'TAMPERED' },
    });
    assert(
      directModifyCert.status === 404 || directModifyCert.status === 405,
      'Direct modification of certificate via PUT is rejected (HTTP 404/405)',
      `Status: ${directModifyCert.status}`
    );

    // Test 34: Direct deletion of certificate via DELETE /api/certificates/:id is rejected
    const directDeleteCert = await api(`/api/certificates/${certB._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    assert(
      directDeleteCert.status === 404 || directDeleteCert.status === 405,
      'Direct deletion of certificate via DELETE is rejected (HTTP 404/405)',
      `Status: ${directDeleteCert.status}`
    );

    // Test 35: Public QR verification endpoint is accessible without authentication (read-only verification)
    const publicVerifyRes = await api(`/api/public/certificates/verify/${certB.qrToken}`);
    assert(
      publicVerifyRes.status === 200 &&
        publicVerifyRes.data?.data?.certificateNumber === certB.certificateNumber,
      'Public QR verification endpoint is accessible without authentication and returns verified record (HTTP 200)',
      `Status: ${publicVerifyRes.status}, Cert: ${publicVerifyRes.data?.data?.certificateNumber}`
    );

    // =========================================================================
    // SECTION 6: USER MANAGEMENT & PERMISSION ESCALATION PREVENTION
    // =========================================================================
    console.log('\n--- SECTION 6: User Management & Permission Escalation Prevention ---');

    // Test 36: Only administrative roles can list platform users (ADMIN returns 200)
    const adminListUsers = await api('/api/users', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(
      adminListUsers.status === 200 && Array.isArray(adminListUsers.data?.data?.users || adminListUsers.data?.data),
      'ADMIN can list platform users with pagination (HTTP 200)',
      `Status: ${adminListUsers.status}`
    );

    // Test 37: BUSINESS_USER cannot list platform users
    const buListUsers = await api('/api/users', {
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
    });
    assert(
      buListUsers.status === 403,
      'BUSINESS_USER cannot list platform users (HTTP 403)',
      `Status: ${buListUsers.status}`
    );

    // Test 38: BUSINESS_USER cannot create users
    const buCreateUser = await api('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
      body: {
        name: 'Trader Created User',
        email: 'trader_created@apexweigh.com',
        password: defaultPassword,
        role: USER_ROLES.BUSINESS_USER,
      },
    });
    assert(
      buCreateUser.status === 403,
      'BUSINESS_USER cannot create platform users (HTTP 403)',
      `Status: ${buCreateUser.status}`
    );

    // Test 39: BUSINESS_USER cannot escalate own role via PUT /api/auth/profile
    const buEscalateProfile = await api('/api/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
      body: {
        role: USER_ROLES.SUPER_ADMIN,
        name: 'Trader Escalation Attempt',
      },
    });
    const refreshedBuUser = await User.findById(businessUserA._id);
    assert(
      buEscalateProfile.status === 200 && refreshedBuUser.role === USER_ROLES.BUSINESS_USER,
      'BUSINESS_USER cannot change own role via /api/auth/profile (role parameter is ignored)',
      `HTTP Status: ${buEscalateProfile.status}, Preserved Role: ${refreshedBuUser?.role}`
    );

    // Test 40: BUSINESS_USER cannot change role via PUT /api/stakeholders/me (strictly rejected)
    const buStakeholderRoleTamper = await api('/api/stakeholders/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
      body: {
        role: USER_ROLES.ADMIN,
      },
    });
    assert(
      buStakeholderRoleTamper.status === 400,
      'BUSINESS_USER attempting to alter role via /api/stakeholders/me returns HTTP 400 Bad Request',
      `Status: ${buStakeholderRoleTamper.status}`
    );

    // Test 41: ADMIN cannot escalate own role to SUPER_ADMIN
    const adminSelfEscalate = await api(`/api/users/${admin._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { role: USER_ROLES.SUPER_ADMIN },
    });
    assert(
      adminSelfEscalate.status === 403,
      'ADMIN cannot escalate their own administrative role to SUPER_ADMIN (HTTP 403)',
      `Status: ${adminSelfEscalate.status}`
    );

    // =========================================================================
    // SECTION 7: AUDIT LOG SECURITY & TAMPER RESISTANCE
    // =========================================================================
    console.log('\n--- SECTION 7: Audit Log Security & Tamper Resistance ---');

    // Test 42: BUSINESS_USER cannot access audit logs
    const buAuditRes = await api('/api/audit-logs', {
      headers: { Authorization: `Bearer ${tokenBusinessA}` },
    });
    assert(
      buAuditRes.status === 403,
      'BUSINESS_USER cannot access audit logs via /api/audit-logs (HTTP 403)',
      `Status: ${buAuditRes.status}`
    );

    // Test 43: FIELD_VERIFICATION_OFFICER cannot access audit logs
    const fvoAuditRes = await api('/api/audit-logs', {
      headers: { Authorization: `Bearer ${tokenFvo}` },
    });
    assert(
      fvoAuditRes.status === 403,
      'FIELD_VERIFICATION_OFFICER cannot access audit logs (HTTP 403)',
      `Status: ${fvoAuditRes.status}`
    );

    // Test 44: LEGAL_METROLOGY_OFFICER cannot access audit logs
    const lmoAuditRes = await api('/api/audit-logs', {
      headers: { Authorization: `Bearer ${tokenLmoA}` },
    });
    assert(
      lmoAuditRes.status === 403,
      'LEGAL_METROLOGY_OFFICER cannot access audit logs (HTTP 403)',
      `Status: ${lmoAuditRes.status}`
    );

    // Test 45: GATC_OFFICER cannot access audit logs
    const gatcAuditRes = await api('/api/audit-logs', {
      headers: { Authorization: `Bearer ${tokenGatc}` },
    });
    assert(
      gatcAuditRes.status === 403,
      'GATC_OFFICER cannot access audit logs (HTTP 403)',
      `Status: ${gatcAuditRes.status}`
    );

    // Test 46: SUPER_ADMIN can access audit logs
    const saAuditRes = await api('/api/audit-logs', {
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    assert(
      saAuditRes.status === 200,
      'SUPER_ADMIN can access official audit logs (HTTP 200)',
      `Status: ${saAuditRes.status}`
    );

    // Test 47: ADMIN can access audit logs
    const adminAuditRes = await api('/api/audit-logs', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(
      adminAuditRes.status === 200,
      'ADMIN can access official audit logs (HTTP 200)',
      `Status: ${adminAuditRes.status}`
    );

    // Test 48: Audit records cannot be injected via POST /api/audit-logs (immutable system log)
    const postAuditRes = await api('/api/audit-logs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
      body: { action: 'FORGED_AUDIT_EVENT', details: 'Malicious forged log' },
    });
    assert(
      postAuditRes.status === 404 || postAuditRes.status === 405,
      'Direct POST to /api/audit-logs is rejected (HTTP 404/405 - immutable audit trail)',
      `Status: ${postAuditRes.status}`
    );

    // Test 49: Audit records cannot be deleted via DELETE /api/audit-logs
    const deleteAuditRes = await api('/api/audit-logs', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    assert(
      deleteAuditRes.status === 404 || deleteAuditRes.status === 405,
      'Direct DELETE to /api/audit-logs is rejected (HTTP 404/405 - non-deletable audit trail)',
      `Status: ${deleteAuditRes.status}`
    );

    // Summary
    console.log('\n===============================================================');
    console.log(`📊 RBAC & ACCESS ISOLATION QA RESULTS: ${passed}/${passed + failed} PASSED`);
    console.log('===============================================================');

    if (failed > 0) {
      console.error(`⚠️ ${failed} tests failed!`);
      failureDetails.forEach((f) => console.error(f));
      process.exit(1);
    } else {
      console.log('🎉 ALL 49 RBAC & ACCESS ISOLATION SECURITY TESTS PASSED WITH ZERO DEFECTS!');
    }
  } finally {
    await disconnectDB();
    console.log('[DATABASE] MongoDB connection closed safely.');
  }
}

runRBACSecurityTests().catch((err) => {
  console.error('Fatal error running RBAC security tests:', err);
  process.exit(1);
});
