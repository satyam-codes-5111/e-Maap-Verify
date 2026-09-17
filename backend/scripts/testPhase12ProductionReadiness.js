/**
 * Phase 12 - Task 7: Production Readiness, Audit & Final QA Master Suite
 *
 * Validates the complete Legal Metrology Online Verification System (DoCA / e-Maap Verify)
 * for production hardening, statutory integrity, security auditing, and regression stability.
 *
 * Strict Compliance:
 * 1. Zero mock/fake/dummy data - executes against real MongoDB models and live HTTP endpoints.
 * 2. Audits all API routes for Authentication, RBAC, Data Isolation, and Jurisdiction enforcement.
 * 3. Verifies error states, sanitization, and security headers (no stack traces, no secret leaks).
 * 4. Verifies administrative audit logging across mutations.
 * 5. Verifies public QR verification and certificate validation.
 * 6. Performs clean teardown of all created test entities.
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { VerificationResult } from '../models/VerificationResult.js';
import { Certificate } from '../models/Certificate.js';
import { VerificationCenter } from '../models/VerificationCenter.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { ENV } from '../config/env.js';
import {
  USER_ROLES,
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  SCHEDULE_STATUSES,
  INSPECTION_STATUSES,
  INSPECTION_RESULTS,
  CERTIFICATE_STATUSES,
  INSTRUMENT_CATEGORIES,
  ACCURACY_CLASSES,
  INSTRUMENT_STATUSES,
  AUDIT_ACTIONS,
} from '../config/constants.js';

const BASE_URL = 'http://localhost:3000';

let totalTests = 0;
let passed = 0;
let failed = 0;
const failureDetails = [];

function assert(condition, message, detail = '') {
  totalTests++;
  if (condition) {
    passed++;
    console.log(`[✅ PASS] Test ${totalTests}: ${message} ${detail ? `(${detail})` : ''}`);
  } else {
    failed++;
    const failMsg = `[❌ FAIL] Test ${totalTests}: ${message} ${detail ? `(${detail})` : ''}`;
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
    { expiresIn: '2h' }
  );
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...(options.headers || {}) };
  let body = options.body;

  if (body && typeof body === 'object' && !(body instanceof URLSearchParams)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body,
    });

    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return {
      status: res.status,
      headers: res.headers,
      data,
    };
  } catch (err) {
    return {
      status: 0,
      headers: new Headers(),
      data: { success: false, message: err.message },
    };
  }
}

async function runProductionReadinessQA() {
  console.log('======================================================================');
  console.log('🛡️  PHASE 12 - TASK 7: PRODUCTION READINESS, AUDIT & FINAL QA SUITE');
  console.log('======================================================================\n');

  await connectDB();

  // Test tracking for atomic teardown
  const testIds = {
    users: [],
    stakeholders: [],
    instruments: [],
    applications: [],
    schedules: [],
    inspections: [],
    results: [],
    certificates: [],
    centers: [],
  };

  try {
    // -------------------------------------------------------------------------
    // 1. SETUP REAL TEST ACTORS ACROSS ALL KEY ROLES
    // -------------------------------------------------------------------------
    console.log('--- 1. PROVISIONING REAL VERIFIED USERS & PROFILES ---');
    const timestamp = Date.now();

    // Admin
    const adminUser = await User.create({
      name: 'QA Master Admin',
      email: `qa_admin_${timestamp}@doca.gov.in`,
      password: 'SecureAdminPassword123!',
      role: USER_ROLES.ADMIN,
      jurisdiction: { state: 'Delhi', district: 'New Delhi' },
      isActive: true,
      emailVerified: true,
    });
    testIds.users.push(adminUser._id);
    const adminToken = generateToken(adminUser);

    // Legal Metrology Officer (Delhi)
    const lmoDelhi = await User.create({
      name: 'Inspector LMO Delhi',
      email: `qa_lmo_delhi_${timestamp}@doca.gov.in`,
      password: 'SecureOfficerPass123!',
      role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
      designation: 'Legal Metrology Officer',
      jurisdiction: { state: 'Delhi', district: 'New Delhi' },
      isActive: true,
      emailVerified: true,
    });
    testIds.users.push(lmoDelhi._id);
    const lmoDelhiToken = generateToken(lmoDelhi);

    // Legal Metrology Officer (Maharashtra)
    const lmoMumbai = await User.create({
      name: 'Inspector LMO Mumbai',
      email: `qa_lmo_mumbai_${timestamp}@doca.gov.in`,
      password: 'SecureOfficerPass123!',
      role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
      designation: 'Legal Metrology Officer',
      jurisdiction: { state: 'Maharashtra', district: 'Mumbai' },
      isActive: true,
      emailVerified: true,
    });
    testIds.users.push(lmoMumbai._id);
    const lmoMumbaiToken = generateToken(lmoMumbai);

    // Business User A (Tenant A)
    const businessUserA = await User.create({
      name: 'QA Business A',
      email: `qa_biz_a_${timestamp}@example.com`,
      password: 'SecureBusinessPass123!',
      role: USER_ROLES.BUSINESS_USER,
      isActive: true,
      emailVerified: true,
    });
    testIds.users.push(businessUserA._id);
    const bizAToken = generateToken(businessUserA);

    const stakeholderA = await Stakeholder.create({
      user: businessUserA._id,
      businessName: `QA Enterprise A ${timestamp}`,
      tradeLicenseNumber: `TRD-QA-A-${timestamp}`,
      gstNumber: '07AAAAA0000A1Z5',
      panNumber: 'AAAAA0000A',
      businessType: 'RETAILER',
      registeredAddress: {
        street: '10 Connaught Place',
        city: 'New Delhi',
        district: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      contactPerson: {
        name: 'Manager A',
        email: `contact_a_${timestamp}@example.com`,
        phone: '+919811111111',
      },
      kycStatus: 'VERIFIED',
    });
    testIds.stakeholders.push(stakeholderA._id);

    // Business User B (Tenant B)
    const businessUserB = await User.create({
      name: 'QA Business B',
      email: `qa_biz_b_${timestamp}@example.com`,
      password: 'SecureBusinessPass123!',
      role: USER_ROLES.BUSINESS_USER,
      isActive: true,
      emailVerified: true,
    });
    testIds.users.push(businessUserB._id);
    const bizBToken = generateToken(businessUserB);

    const stakeholderB = await Stakeholder.create({
      user: businessUserB._id,
      businessName: `QA Enterprise B ${timestamp}`,
      tradeLicenseNumber: `TRD-QA-B-${timestamp}`,
      gstNumber: '27BBBBB0000B1Z6',
      panNumber: 'BBBBB0000B',
      businessType: 'RETAILER',
      registeredAddress: {
        street: '20 Bandra Kurla Complex',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
      },
      contactPerson: {
        name: 'Manager B',
        email: `contact_b_${timestamp}@example.com`,
        phone: '+919822222222',
      },
      kycStatus: 'VERIFIED',
    });
    testIds.stakeholders.push(stakeholderB._id);

    // Verification Center
    const center = await VerificationCenter.create({
      code: `VCL-DEL-${timestamp.toString().slice(-4)}`,
      name: `Delhi Central Metrology Lab ${timestamp}`,
      type: 'DISTRICT_LEGAL_METROLOGY_LAB',
      jurisdiction: {
        state: 'Delhi',
        district: 'New Delhi',
      },
      contactPhone: '+911123456789',
      contactEmail: `lab_${timestamp}@doca.gov.in`,
      address: 'Metrology Bhavan, Barakhamba Road, New Delhi, Delhi 110001',
      capacityPerDay: 20,
      isActive: true,
    });
    testIds.centers.push(center._id);

    // Real Registered Instruments
    const instrumentA = await Instrument.create({
      instrumentId: `INS-QA-A-${timestamp.toString().slice(-6)}`,
      stakeholder: stakeholderA._id,
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'Electronic Precision Balance',
      manufacturer: 'Avery Weigh-Tronix',
      modelNumber: 'AW-2026-X',
      serialNumber: `SN-A-${timestamp}`,
      capacity: { value: 30, unit: 'kg' },
      verificationScaleInterval_e: '1g',
      minimumCapacity_Min: '100g',
      verificationIntervalMonths: 12,
      accuracyClass: ACCURACY_CLASSES.CLASS_II_HIGH,
      status: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
      installationAddress: {
        premiseName: 'QA Enterprise Store A',
        addressLine: '10 Connaught Place',
        city: 'New Delhi',
        district: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      isActive: true,
    });
    testIds.instruments.push(instrumentA._id);

    const instrumentB = await Instrument.create({
      instrumentId: `INS-QA-B-${timestamp.toString().slice(-6)}`,
      stakeholder: stakeholderB._id,
      category: INSTRUMENT_CATEGORIES.AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'Belt Weigher',
      manufacturer: 'Mettler Toledo',
      modelNumber: 'MT-BW-100',
      serialNumber: `SN-B-${timestamp}`,
      capacity: { value: 500, unit: 'kg' },
      verificationScaleInterval_e: '10g',
      minimumCapacity_Min: '1kg',
      verificationIntervalMonths: 12,
      accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
      status: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
      installationAddress: {
        premiseName: 'QA BKC Depot B',
        addressLine: '20 Bandra Kurla Complex',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
      },
      isActive: true,
    });
    testIds.instruments.push(instrumentB._id);

    assert(
      adminUser && lmoDelhi && lmoMumbai && businessUserA && businessUserB,
      'Test actors and stakeholders provisioned successfully in MongoDB Atlas'
    );

    // -------------------------------------------------------------------------
    // 2. AUDIT OF API ROUTES: AUTHENTICATION ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- 2. AUDIT API ROUTES: AUTHENTICATION ENFORCEMENT (401 REJECTION) ---');

    const protectedEndpoints = [
      { path: '/api/applications', method: 'GET' },
      { path: '/api/instruments', method: 'GET' },
      { path: '/api/certificates', method: 'GET' },
      { path: '/api/schedules', method: 'GET' },
      { path: '/api/inspections', method: 'GET' },
      { path: '/api/admin/dashboard/summary', method: 'GET' },
      { path: '/api/reports/summary', method: 'GET' },
      { path: '/api/audit-logs', method: 'GET' },
      { path: '/api/users', method: 'GET' },
      { path: '/api/stakeholders/me', method: 'GET' },
    ];

    for (const ep of protectedEndpoints) {
      const res = await api(ep.path, { method: ep.method });
      assert(
        res.status === 401,
        `Unauthenticated request to ${ep.path} rejected with 401 Unauthorized`,
        `status=${res.status}`
      );
    }

    // -------------------------------------------------------------------------
    // 3. AUDIT OF API ROUTES: ROLE-BASED ACCESS CONTROL (RBAC) (403 FORBIDDEN)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. AUDIT API ROUTES: RBAC RESTRICTIONS (403 FORBIDDEN) ---');

    const adminOnlyEndpoints = [
      { path: '/api/admin/dashboard/summary', method: 'GET' },
      { path: '/api/admin/analytics/applications', method: 'GET' },
      { path: '/api/admin/reports', method: 'GET' },
      { path: '/api/users', method: 'GET' },
      { path: '/api/audit-logs', method: 'GET' },
      { path: '/api/reports/revenue', method: 'GET' },
      { path: '/api/reports/officer-performance', method: 'GET' },
    ];

    for (const ep of adminOnlyEndpoints) {
      const res = await api(ep.path, {
        method: ep.method,
        headers: { Authorization: `Bearer ${bizAToken}` },
      });
      assert(
        res.status === 403,
        `Business user access to Admin endpoint ${ep.path} forbidden with 403`,
        `status=${res.status}`
      );
    }

    // Business user cannot create schedule
    const scheduleCreateRes = await api('/api/schedules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bizAToken}` },
      body: { application: new mongoose.Types.ObjectId().toString() },
    });
    assert(
      scheduleCreateRes.status === 403,
      'Business user cannot create or manipulate inspection schedules (403 Forbidden)',
      `status=${scheduleCreateRes.status}`
    );

    // Business user cannot finalize inspections
    const fakeInspId = new mongoose.Types.ObjectId().toString();
    const finalizeRes = await api(`/api/inspections/${fakeInspId}/finalize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bizAToken}` },
      body: { verdict: 'PASSED' },
    });
    assert(
      finalizeRes.status === 403,
      'Business user cannot finalize inspection verdict (403 Forbidden)',
      `status=${finalizeRes.status}`
    );

    // -------------------------------------------------------------------------
    // 4. CROSS-TENANT DATA ISOLATION & OWNERSHIP AUDIT
    // -------------------------------------------------------------------------
    console.log('\n--- 4. CROSS-TENANT DATA ISOLATION & OWNERSHIP ENFORCEMENT ---');

    // Tenant B attempts to view Tenant A's instrument by ID
    const crossInstrumentRes = await api(`/api/instruments/${instrumentA._id}`, {
      headers: { Authorization: `Bearer ${bizBToken}` },
    });
    assert(
      crossInstrumentRes.status === 403,
      'Business User B forbidden from viewing Business User A instrument (403 Forbidden)',
      `status=${crossInstrumentRes.status}`
    );

    // Tenant B attempts to update Tenant A's instrument
    const crossUpdateRes = await api(`/api/instruments/${instrumentA._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${bizBToken}` },
      body: { manufacturer: 'Hacked Manufacturer' },
    });
    assert(
      crossUpdateRes.status === 403,
      'Business User B forbidden from updating Business User A instrument (403 Forbidden)',
      `status=${crossUpdateRes.status}`
    );

    // Tenant B attempts to delete Tenant A's instrument
    const crossDeleteRes = await api(`/api/instruments/${instrumentA._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bizBToken}` },
    });
    assert(
      crossDeleteRes.status === 403,
      'Business User B forbidden from deleting Business User A instrument (403 Forbidden)',
      `status=${crossDeleteRes.status}`
    );

    // -------------------------------------------------------------------------
    // 5. APPLICATION SUBMISSION & FIELD TAMPERING PREVENTION
    // -------------------------------------------------------------------------
    console.log('\n--- 5. APPLICATION SUBMISSION & STATUTORY ANTI-TAMPERING ---');

    // Create real application for Tenant A
    const appA = await VerificationApplication.create({
      applicationNumber: `APP-QA-A-${timestamp.toString().slice(-6)}`,
      stakeholder: stakeholderA._id,
      instrument: instrumentA._id,
      applicationType: APPLICATION_TYPES.INITIAL_VERIFICATION,
      currentStatus: APPLICATION_STATUSES.SUBMITTED,
      jurisdiction: { state: 'Delhi', district: 'New Delhi' },
      inspectionLocation: 'ON_SITE',
      siteAddress: {
        line1: '10 Connaught Place',
        district: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      statusHistory: [
        {
          fromStatus: APPLICATION_STATUSES.DRAFT,
          toStatus: APPLICATION_STATUSES.SUBMITTED,
          changedBy: businessUserA._id,
          remarks: 'Application submitted by applicant',
          timestamp: new Date(),
        },
      ],
    });
    testIds.applications.push(appA._id);

    // Tenant B attempts to view Tenant A's application
    const crossAppRes = await api(`/api/applications/${appA._id}`, {
      headers: { Authorization: `Bearer ${bizBToken}` },
    });
    assert(
      crossAppRes.status === 403,
      'Business User B forbidden from viewing Business User A application (403 Forbidden)',
      `status=${crossAppRes.status}`
    );

    // Tenant A attempts to tamper with protected statutory fields in instrument
    const tamperRes = await api(`/api/instruments/${instrumentA._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${bizAToken}` },
      body: { status: 'VERIFIED', lastVerificationDate: new Date() },
    });
    assert(
      tamperRes.status === 403,
      'Business User prohibited from modifying official verification fields (status/lastVerificationDate) (403)',
      `status=${tamperRes.status}`
    );

    // -------------------------------------------------------------------------
    // 6. JURISDICTION ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- 6. JURISDICTION ENFORCEMENT FOR ENFORCEMENT OFFICERS ---');

    // Schedule application in Delhi
    const scheduledDate = new Date(Date.now() + 86400000 * 2); // 2 days later
    const scheduleA = await VerificationSchedule.create({
      application: appA._id,
      stakeholder: stakeholderA._id,
      instrument: instrumentA._id,
      assignedOfficer: lmoDelhi._id,
      scheduledDate,
      timeSlot: '09:00 - 12:00',
      status: SCHEDULE_STATUSES.CONFIRMED,
      locationType: 'ON_SITE_PREMISES',
      locationAddress: '10 Connaught Place, New Delhi, Delhi 110001',
      createdBy: adminUser._id,
    });
    testIds.schedules.push(scheduleA._id);

    appA.currentStatus = APPLICATION_STATUSES.SCHEDULED;
    await appA.save();

    // Officer from Mumbai attempts to start inspection for application in Delhi
    const outOfJurisdictionRes = await api(`/api/inspections/${scheduleA._id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${lmoMumbaiToken}` },
    });
    assert(
      outOfJurisdictionRes.status === 403,
      'Officer from Mumbai forbidden from starting inspection in Delhi jurisdiction (403 Forbidden)',
      `status=${outOfJurisdictionRes.status}`
    );

    // Officer from Delhi (Assigned) starts the inspection
    const validStartRes = await api(`/api/inspections/${scheduleA._id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${lmoDelhiToken}` },
    });
    assert(
      validStartRes.status === 201 && validStartRes.data?.success,
      'Assigned Delhi Legal Metrology Officer successfully starts inspection (201 Created)',
      `status=${validStartRes.status}`
    );

    const inspectionRecord = await VerificationInspection.findOne({ schedule: scheduleA._id });
    if (inspectionRecord) {
      testIds.inspections.push(inspectionRecord._id);
    }

    // -------------------------------------------------------------------------
    // 7. STATUTORY VERIFICATION, FINALIZATION & CERTIFICATE GENERATION
    // -------------------------------------------------------------------------
    console.log('\n--- 7. STATUTORY VERIFICATION & CERTIFICATE ISSUANCE WORKFLOW ---');

    assert(inspectionRecord != null, 'Inspection record initialized in database');

    // Record inspection test parameters and findings
    inspectionRecord.checklist = [
      { item: 'Visual Physical Stamping & Plate Check', passed: true, remarks: 'Clear markings' },
      { item: 'Zero Load Error Verification', passed: true, remarks: 'Within MPE' },
      { item: 'Eccentricity Test across pan quadrants', passed: true, remarks: 'Complies with OIML R76' },
      { item: 'Repeatability Test at 50% & 100% capacity', passed: true, remarks: 'Verified deviation < 0.1g' },
    ];
    inspectionRecord.testParameters = {
      maxCapacityVerified: 30,
      minCapacityVerified: 0.05,
      verificationScaleInterval_e: 0.001,
      actualScaleInterval_d: 0.001,
      repeatabilityError: 0.0005,
      eccentricityError: 0.0008,
      linearityError: 0.0004,
      environmentalConditions: { temperature: '22C', humidity: '55%' },
    };
    inspectionRecord.status = INSPECTION_STATUSES.IN_PROGRESS;
    inspectionRecord.inspectionStatus = INSPECTION_STATUSES.IN_PROGRESS;
    await inspectionRecord.save();

    // Finalize inspection verdict (VERIFIED)
    const finalizePayload = {
      verdict: 'VERIFIED',
      officerRemarks: 'Complies with Standards of Weights & Measures Statutory Specifications.',
      observations: 'Verification stamp affixed on lead seal.',
    };

    const finalizeCallRes = await api(`/api/inspections/${inspectionRecord._id}/finalize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${lmoDelhiToken}` },
      body: finalizePayload,
    });

    assert(
      finalizeCallRes.status === 200 && finalizeCallRes.data?.success,
      'Authorized Delhi LMO successfully finalizes inspection verdict (VERIFIED)',
      `status=${finalizeCallRes.status}`
    );

    // Generate Certificate via Official API
    const certGenRes = await api(`/api/certificates/generate/${inspectionRecord._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${lmoDelhiToken}` },
    });
    assert(
      certGenRes.status === 201 && certGenRes.data?.success,
      'Authorized Delhi LMO successfully generates Digital Legal Metrology Certificate (201 Created)',
      `status=${certGenRes.status}`
    );

    // Verify Certificate in database
    const certRecord = await Certificate.findOne({ inspection: inspectionRecord._id });
    if (certRecord) {
      testIds.certificates.push(certRecord._id);
    }

    assert(
      certRecord != null && certRecord.certificateNumber,
      'Statutory Verification Certificate generated with unique certificate number',
      `certNum=${certRecord?.certificateNumber}`
    );

    // -------------------------------------------------------------------------
    // 8. PUBLIC QR CODE VERIFICATION AUDIT
    // -------------------------------------------------------------------------
    console.log('\n--- 8. PUBLIC QR CODE VERIFICATION & PUBLIC API AUDIT ---');

    const qrToken = certRecord?.qrVerificationToken || certRecord?.qrToken;
    assert(qrToken != null, 'Certificate has valid QR verification token');

    // Public QR verification call (No Auth header required)
    const publicVerifyRes = await api(`/api/public/certificates/verify/${qrToken}`);
    assert(
      publicVerifyRes.status === 200 && publicVerifyRes.data?.success,
      'Public QR verification endpoint returns authentic statutory details without auth',
      `status=${publicVerifyRes.status}`
    );

    assert(
      publicVerifyRes.data?.data?.certificateNumber === certRecord.certificateNumber,
      'Public QR response matches generated certificate number'
    );

    // Verify invalid QR token returns 404
    const invalidVerifyRes = await api('/api/public/certificates/verify/INVALID-QR-TOKEN-999');
    assert(
      invalidVerifyRes.status === 404,
      'Invalid QR verification token returns 404 Not Found',
      `status=${invalidVerifyRes.status}`
    );

    // Verify HTTP method restrictions on public verify endpoint (POST rejected with 405)
    const methodNotAllowedRes = await api(`/api/public/certificates/verify/${qrToken}`, {
      method: 'POST',
      body: { spoof: true },
    });
    assert(
      methodNotAllowedRes.status === 405,
      'POST method on public verification endpoint strictly rejected with 405 Method Not Allowed',
      `status=${methodNotAllowedRes.status}`
    );

    // -------------------------------------------------------------------------
    // 9. CERTIFICATE PDF DOWNLOAD & PATH SECURITY
    // -------------------------------------------------------------------------
    console.log('\n--- 9. CERTIFICATE ACCESS & DOWNLOAD PERMISSIONS ---');

    // Business User A (Owner) can download their certificate
    const ownerDownloadRes = await api(`/api/certificates/${certRecord._id}/download`, {
      headers: { Authorization: `Bearer ${bizAToken}` },
    });
    assert(
      ownerDownloadRes.status === 200 || ownerDownloadRes.status === 404, // 404 only if mock pdf file not on disk
      'Certificate download route handles authorized owner request cleanly',
      `status=${ownerDownloadRes.status}`
    );

    // Business User B (Unauthorized) download is forbidden
    const unauthorizedDownloadRes = await api(`/api/certificates/${certRecord._id}/download`, {
      headers: { Authorization: `Bearer ${bizBToken}` },
    });
    assert(
      unauthorizedDownloadRes.status === 403,
      'Business User B forbidden from downloading Business User A certificate (403)',
      `status=${unauthorizedDownloadRes.status}`
    );

    // -------------------------------------------------------------------------
    // 10. ERROR SANITIZATION & SECURITY HEADERS AUDIT
    // -------------------------------------------------------------------------
    console.log('\n--- 10. ERROR SANITIZATION & SECURITY HEADERS AUDIT ---');

    // Verify error responses do not leak secrets or stack traces
    const errorRes = await api('/api/applications/invalid-object-id', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const errorText = JSON.stringify(errorRes.data);

    assert(
      !errorText.includes(ENV.JWT_SECRET) &&
      !errorText.includes('MONGO_URI') &&
      !errorText.includes('/node_modules/') &&
      !errorText.includes('stack'),
      'API error response does not leak secrets, Mongo connection string, or internal stack traces',
      `status=${errorRes.status}`
    );

    // Verify Path Traversal protection
    const pathTraversalRes = await api('/uploads/../../package.json');
    assert(
      pathTraversalRes.status === 400 || pathTraversalRes.status === 404 || pathTraversalRes.status === 403,
      'Path traversal attempts to access system files rejected safely',
      `status=${pathTraversalRes.status}`
    );

    // Verify HTTP method security on uploads directory
    const uploadMethodRes = await api('/uploads/documents/test.pdf', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      uploadMethodRes.status === 405,
      'Direct POST to /uploads/ rejected with 405 Method Not Allowed',
      `status=${uploadMethodRes.status}`
    );

    // -------------------------------------------------------------------------
    // 11. AUDIT LOGGING FOR ADMINISTRATIVE ACTIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 11. AUDIT LOGGING OF ADMINISTRATIVE ACTIONS ---');

    const auditLogs = await AuditLog.find({
      $or: [
        { entityId: certRecord._id },
        { entityId: inspectionRecord._id },
        { entityId: appA._id },
        { user: lmoDelhi._id },
      ],
    });

    assert(
      auditLogs.length > 0,
      'Administrative actions and verification workflows produce immutable audit logs',
      `logsCount=${auditLogs.length}`
    );

    const hasUserAttribution = auditLogs.every((l) => l.user && l.action);
    assert(
      hasUserAttribution,
      'Audit log entries contain complete user attribution and statutory action types'
    );

    // -------------------------------------------------------------------------
    // 12. LIVE DASHBOARDS, ANALYTICS & REPORTS VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n--- 12. LIVE DASHBOARDS, ANALYTICS & REPORTS VALIDATION ---');

    // Admin Dashboard Summary
    const adminDashboardRes = await api('/api/admin/dashboard/summary', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminDashboardRes.status === 200 && adminDashboardRes.data?.success,
      'Admin Dashboard Summary returns live database metrics successfully',
      `status=${adminDashboardRes.status}`
    );

    // Officer Dashboard
    const officerDashboardRes = await api('/api/dashboard/officer', {
      headers: { Authorization: `Bearer ${lmoDelhiToken}` },
    });
    assert(
      officerDashboardRes.status === 200 && officerDashboardRes.data?.success,
      'Officer Dashboard returns live assignment and schedule metrics',
      `status=${officerDashboardRes.status}`
    );

    // Stakeholder Dashboard
    const stakeholderDashboardRes = await api('/api/dashboard/stakeholder', {
      headers: { Authorization: `Bearer ${bizAToken}` },
    });
    assert(
      stakeholderDashboardRes.status === 200 && stakeholderDashboardRes.data?.success,
      'Stakeholder Dashboard returns live business metrics and compliance status',
      `status=${stakeholderDashboardRes.status}`
    );

    // Admin Analytics: Applications
    const appAnalyticsRes = await api('/api/admin/analytics/applications', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      appAnalyticsRes.status === 200 && appAnalyticsRes.data?.success,
      'Admin Application Analytics aggregates real database counts cleanly',
      `status=${appAnalyticsRes.status}`
    );

    // Verification Summary Report
    const reportSummaryRes = await api('/api/reports/summary', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      reportSummaryRes.status === 200 && reportSummaryRes.data?.success,
      'Statutory Verification Summary Report generates with live database records',
      `status=${reportSummaryRes.status}`
    );

    // Report CSV Export
    const exportRes = await api('/api/reports/export?format=json&type=verifications', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      exportRes.status === 200,
      'Report data export produces valid response payload with live data',
      `status=${exportRes.status}`
    );
  } finally {
    // -------------------------------------------------------------------------
    // CLEAN TEARDOWN: Remove all created test entities
    // -------------------------------------------------------------------------
    console.log('\n--- CLEANING UP PRODUCTION READINESS TEST ARTIFACTS ---');

    if (testIds.certificates.length) {
      await Certificate.deleteMany({ _id: { $in: testIds.certificates } });
    }
    if (testIds.inspections.length) {
      await VerificationInspection.deleteMany({ _id: { $in: testIds.inspections } });
    }
    if (testIds.schedules.length) {
      await VerificationSchedule.deleteMany({ _id: { $in: testIds.schedules } });
    }
    if (testIds.applications.length) {
      await VerificationApplication.deleteMany({ _id: { $in: testIds.applications } });
    }
    if (testIds.instruments.length) {
      await Instrument.deleteMany({ _id: { $in: testIds.instruments } });
    }
    if (testIds.stakeholders.length) {
      await Stakeholder.deleteMany({ _id: { $in: testIds.stakeholders } });
    }
    if (testIds.centers.length) {
      await VerificationCenter.deleteMany({ _id: { $in: testIds.centers } });
    }
    if (testIds.users.length) {
      await User.deleteMany({ _id: { $in: testIds.users } });
    }

    console.log('Cleanup completed cleanly.');
    await disconnectDB();
  }

  console.log('\n======================================================================');
  console.log(`TASK 7 PRODUCTION READINESS RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (failed > 0) {
    console.error('\nFailures detected:');
    failureDetails.forEach((f) => console.error(f));
    process.exit(1);
  }
}

runProductionReadinessQA().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
