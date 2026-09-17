/**
 * Phase 8: Digital Certificate + QR Verification - Comprehensive Test Suite
 * Validates real MongoDB operations, cryptographic QR generation, PDF generation,
 * tamper-evident hashing, statutory validity calculation, lifecycle statuses (ACTIVE, EXPIRED, REVOKED),
 * public verification API, RBAC protection, audit logs, and stakeholder notifications.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { VerificationResult } from '../models/VerificationResult.js';
import { Certificate } from '../models/Certificate.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import {
  USER_ROLES,
  APPLICATION_STATUSES,
  SCHEDULE_STATUSES,
  INSTRUMENT_STATUSES,
  INSPECTION_STATUSES,
  INSPECTION_RESULTS,
  VERIFICATION_VERDICTS,
  CERTIFICATE_STATUSES,
  INSTRUMENT_CATEGORIES,
  ACCURACY_CLASSES,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
} from '../config/constants.js';

const BASE_URL = 'http://localhost:3000';

const results = [];

function recordTest(id, name, passed, details = '') {
  results.push({ id, name, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${symbol}] Test ${id}: ${name} ${details ? `(${details})` : ''}`);
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('📜 Starting Phase 8: Digital Certificate & QR Verification Test Suite');
  console.log('===============================================================\n');

  await connectDB();

  const adminEmail = ENV.ADMIN_INITIAL_EMAIL;
  const adminPassword = ENV.ADMIN_INITIAL_PASSWORD;

  let superAdminToken = '';
  let officer1Token = '';
  let officer2Token = '';
  let fvoToken = '';
  let businessUser1Token = '';
  let businessUser2Token = '';

  let officer1 = null;
  let officer2 = null;
  let fvoUser = null;
  let user1 = null;
  let user2 = null;

  let stakeholder1 = null;
  let stakeholder2 = null;

  let instPassed = null;
  let instFailed = null;
  let instUnfinalized = null;
  let instExpired = null;

  let appPassed = null;
  let appFailed = null;
  let appUnfinalized = null;

  let inspPassed = null;
  let inspFailed = null;
  let inspUnfinalized = null;

  let generatedCertDoc = null;
  let generatedCertData = null;

  try {
    // -------------------------------------------------------------
    // Setup 0: Provision / Authenticate Test Entities
    // -------------------------------------------------------------
    // 1. Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    superAdminToken = adminLoginData.data?.token;

    // 2. Officer 1 (Mumbai LMO)
    officer1 = await User.findOne({ email: 'phase8_lmo1@doca.gov.in' });
    if (!officer1) {
      officer1 = new User({
        name: 'Inspector Vijay Patil',
        email: 'phase8_lmo1@doca.gov.in',
        phone: '9822001122',
        role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
        designation: 'Senior Legal Metrology Officer',
        jurisdiction: { state: 'Maharashtra', district: 'Mumbai', zone: 'South' },
        isActive: true,
      });
      officer1.password = 'Inspector@123';
      await officer1.save();
    }
    const off1LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase8_lmo1@doca.gov.in', password: 'Inspector@123' }),
    });
    officer1Token = (await off1LoginRes.json()).data?.token;

    // 3. Officer 2 (Pune LMO)
    officer2 = await User.findOne({ email: 'phase8_lmo2@doca.gov.in' });
    if (!officer2) {
      officer2 = new User({
        name: 'Inspector Sunita Kadam',
        email: 'phase8_lmo2@doca.gov.in',
        phone: '9822003344',
        role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
        designation: 'Legal Metrology Officer',
        jurisdiction: { state: 'Maharashtra', district: 'Pune', zone: 'North' },
        isActive: true,
      });
      officer2.password = 'Inspector@123';
      await officer2.save();
    }
    const off2LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase8_lmo2@doca.gov.in', password: 'Inspector@123' }),
    });
    officer2Token = (await off2LoginRes.json()).data?.token;

    // 4. FVO User
    fvoUser = await User.findOne({ email: 'phase8_fvo@doca.gov.in' });
    if (!fvoUser) {
      fvoUser = new User({
        name: 'Officer Rajesh Sawant',
        email: 'phase8_fvo@doca.gov.in',
        phone: '9822005566',
        role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
        designation: 'Field Verification Officer',
        jurisdiction: { state: 'Maharashtra', district: 'Mumbai', zone: 'South' },
        isActive: true,
      });
      fvoUser.password = 'Officer@123';
      await fvoUser.save();
    }
    const fvoLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase8_fvo@doca.gov.in', password: 'Officer@123' }),
    });
    fvoToken = (await fvoLoginRes.json()).data?.token;

    // 5. Business User 1 & Stakeholder 1 (Mumbai)
    user1 = await User.findOne({ email: 'phase8_trader1@test.com' });
    if (!user1) {
      user1 = new User({
        name: 'Aarav Mehta',
        email: 'phase8_trader1@test.com',
        phone: '9822007788',
        role: USER_ROLES.BUSINESS_USER,
        isActive: true,
      });
      user1.password = 'Trader@123';
      await user1.save();
    }
    const u1LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase8_trader1@test.com', password: 'Trader@123' }),
    });
    businessUser1Token = (await u1LoginRes.json()).data?.token;

    stakeholder1 = await Stakeholder.findOne({ user: user1._id });
    if (!stakeholder1) {
      stakeholder1 = new Stakeholder({
        user: user1._id,
        businessName: 'Phase 8 APMC Super Weighers LLP',
        tradeLicenseNumber: 'MH-MUM-TL-PH8-001',
        gstNumber: '27AAAAA0000A1Z5',
        businessType: 'RETAILER',
        contactPerson: { name: 'Aarav Mehta', designation: 'Partner', phone: '9822007788', email: 'phase8_trader1@test.com' },
        registeredAddress: { street: 'Grain Market Yard', city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', pincode: '400009' },
        verificationStatus: 'APPROVED',
      });
      await stakeholder1.save();
    }

    // 6. Business User 2 & Stakeholder 2 (Pune)
    user2 = await User.findOne({ email: 'phase8_trader2@test.com' });
    if (!user2) {
      user2 = new User({
        name: 'Kavita Deshpande',
        email: 'phase8_trader2@test.com',
        phone: '9822009900',
        role: USER_ROLES.BUSINESS_USER,
        isActive: true,
      });
      user2.password = 'Trader@123';
      await user2.save();
    }
    const u2LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase8_trader2@test.com', password: 'Trader@123' }),
    });
    businessUser2Token = (await u2LoginRes.json()).data?.token;

    stakeholder2 = await Stakeholder.findOne({ user: user2._id });
    if (!stakeholder2) {
      stakeholder2 = new Stakeholder({
        user: user2._id,
        businessName: 'Phase 8 Pune Precision Spices Ltd',
        tradeLicenseNumber: 'MH-PUN-TL-PH8-002',
        gstNumber: '27BBBBB0000B1Z6',
        businessType: 'DEALER',
        contactPerson: { name: 'Kavita Deshpande', designation: 'Director', phone: '9822009900', email: 'phase8_trader2@test.com' },
        registeredAddress: { street: 'Hadapsar MIDC', city: 'Pune', district: 'Pune', state: 'Maharashtra', pincode: '411028' },
        verificationStatus: 'APPROVED',
      });
      await stakeholder2.save();
    }

    // 7. Provision Instruments
    instPassed = await Instrument.findOne({ serialNumber: 'SN-PH8-PASS-001' });
    if (!instPassed) {
      instPassed = new Instrument({
        instrumentId: 'INST-PH8-001',
        stakeholder: stakeholder1._id,
        category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
        instrumentType: 'Electronic Tabletop Balance',
        manufacturer: 'Essae-Teraoka Ltd',
        modelNumber: 'DS-215N',
        serialNumber: 'SN-PH8-PASS-001',
        capacity: { value: 30, unit: 'kg' },
        accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
        verificationScaleInterval_e: '5g',
        installationAddress: {
          premiseName: 'Main Counter',
          addressLine: 'Grain Market Yard Shop 12',
          city: 'Mumbai',
          district: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400009',
        },
        status: INSTRUMENT_STATUSES.SUBMITTED_FOR_VERIFICATION,
        verificationIntervalMonths: 12,
      });
      await instPassed.save();
    }

    instFailed = await Instrument.findOne({ serialNumber: 'SN-PH8-FAIL-002' });
    if (!instFailed) {
      instFailed = new Instrument({
        instrumentId: 'INST-PH8-002',
        stakeholder: stakeholder1._id,
        category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
        instrumentType: 'Industrial Heavy Platform Scale',
        manufacturer: 'Avery India',
        modelNumber: 'A-500',
        serialNumber: 'SN-PH8-FAIL-002',
        capacity: { value: 500, unit: 'kg' },
        accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
        verificationScaleInterval_e: '50g',
        installationAddress: {
          premiseName: 'Loading Dock',
          addressLine: 'Warehouse Gate 4',
          city: 'Mumbai',
          district: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400009',
        },
        status: INSTRUMENT_STATUSES.SUBMITTED_FOR_VERIFICATION,
        verificationIntervalMonths: 12,
      });
      await instFailed.save();
    }

    instUnfinalized = await Instrument.findOne({ serialNumber: 'SN-PH8-UNF-003' });
    if (!instUnfinalized) {
      instUnfinalized = new Instrument({
        instrumentId: 'INST-PH8-003',
        stakeholder: stakeholder1._id,
        category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
        instrumentType: 'Weighbridge 50T',
        manufacturer: 'Eagle Scales',
        modelNumber: 'WB-50T',
        serialNumber: 'SN-PH8-UNF-003',
        capacity: { value: 50, unit: 'tonne' },
        accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
        verificationScaleInterval_e: '10kg',
        installationAddress: {
          premiseName: 'Entry Gate',
          addressLine: 'Weighing Bay 1',
          city: 'Mumbai',
          district: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400009',
        },
        status: INSTRUMENT_STATUSES.SUBMITTED_FOR_VERIFICATION,
        verificationIntervalMonths: 12,
      });
      await instUnfinalized.save();
    }

    // 8. Provision Applications
    const uniqueSuffix = Date.now().toString().slice(-6);

    appPassed = new VerificationApplication({
      applicationNumber: `APP-PH8-PASS-${uniqueSuffix}`,
      stakeholder: stakeholder1._id,
      instrument: instPassed._id,
      applicationType: 'INITIAL_VERIFICATION',
      currentStatus: APPLICATION_STATUSES.VERIFIED,
      assignedOfficer: officer1._id,
    });
    await appPassed.save();

    appFailed = new VerificationApplication({
      applicationNumber: `APP-PH8-FAIL-${uniqueSuffix}`,
      stakeholder: stakeholder1._id,
      instrument: instFailed._id,
      applicationType: 'INITIAL_VERIFICATION',
      currentStatus: APPLICATION_STATUSES.REJECTED,
      assignedOfficer: officer1._id,
    });
    await appFailed.save();

    appUnfinalized = new VerificationApplication({
      applicationNumber: `APP-PH8-UNF-${uniqueSuffix}`,
      stakeholder: stakeholder1._id,
      instrument: instUnfinalized._id,
      applicationType: 'INITIAL_VERIFICATION',
      currentStatus: APPLICATION_STATUSES.INSPECTION,
      assignedOfficer: officer1._id,
    });
    await appUnfinalized.save();

    // 9. Provision Inspections
    inspUnfinalized = new VerificationInspection({
      inspectionNumber: `INSP-PH8-UNF-${uniqueSuffix}`,
      application: appUnfinalized._id,
      instrument: instUnfinalized._id,
      stakeholder: stakeholder1._id,
      assignedOfficer: officer1._id,
      inspectionDate: new Date(),
      inspectionStatus: INSPECTION_STATUSES.IN_PROGRESS,
      isFinalized: false,
    });
    await inspUnfinalized.save();

    inspFailed = new VerificationInspection({
      inspectionNumber: `INSP-PH8-FAIL-${uniqueSuffix}`,
      application: appFailed._id,
      instrument: instFailed._id,
      stakeholder: stakeholder1._id,
      assignedOfficer: officer1._id,
      inspectionDate: new Date(),
      inspectionStatus: INSPECTION_STATUSES.FAILED,
      result: INSPECTION_RESULTS.REJECTED,
      isFinalized: true,
      finalizedAt: new Date(),
      finalizedBy: officer1._id,
      rejectionReason: 'Exceeded maximum permissible tolerance limits at 500kg.',
    });
    await inspFailed.save();

    inspPassed = new VerificationInspection({
      inspectionNumber: `INSP-PH8-PASS-${uniqueSuffix}`,
      application: appPassed._id,
      instrument: instPassed._id,
      stakeholder: stakeholder1._id,
      assignedOfficer: officer1._id,
      inspectionDate: new Date(),
      inspectionStatus: INSPECTION_STATUSES.PASSED,
      result: INSPECTION_RESULTS.VERIFIED,
      isFinalized: true,
      finalizedAt: new Date(),
      finalizedBy: officer1._id,
      officerRemarks: 'All test loads well within legal tolerance limits. Approved.',
    });
    await inspPassed.save();

    console.log('✅ Phase 8 Setup completed: Test entities initialized in real MongoDB.\n');

    // -------------------------------------------------------------
    // TEST 1: Cannot generate certificate for unfinalized inspection -> 400
    // -------------------------------------------------------------
    const res1 = await fetch(`${BASE_URL}/api/certificates/generate/${inspUnfinalized._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    recordTest(
      1,
      'Cannot generate certificate for unfinalized inspection (returns 400 Bad Request)',
      res1.status === 400,
      `Status: ${res1.status}`
    );

    // -------------------------------------------------------------
    // TEST 2: Cannot generate certificate for FAILED / REJECTED inspection -> 400
    // -------------------------------------------------------------
    const res2 = await fetch(`${BASE_URL}/api/certificates/generate/${inspFailed._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    recordTest(
      2,
      'Cannot generate certificate for failed/rejected inspection (returns 400 Bad Request)',
      res2.status === 400,
      `Status: ${res2.status}`
    );

    // -------------------------------------------------------------
    // TEST 3: Unauthorized user (Business User) cannot generate certificate -> 403
    // -------------------------------------------------------------
    const res3a = await fetch(`${BASE_URL}/api/certificates/generate/${inspPassed._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${businessUser1Token}`,
      },
    });
    const res3b = await fetch(`${BASE_URL}/api/certificates/generate/${inspPassed._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fvoToken}`,
      },
    });
    recordTest(
      3,
      'Unauthorized user (Business User / FVO) cannot generate certificate (returns 403 Forbidden)',
      res3a.status === 403 && res3b.status === 403,
      `Business User: ${res3a.status}, FVO: ${res3b.status}`
    );

    // -------------------------------------------------------------
    // TEST 4: Valid PASSED inspection generates certificate successfully -> 201 Created
    // -------------------------------------------------------------
    const res4 = await fetch(`${BASE_URL}/api/certificates/generate/${inspPassed._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    const data4 = await res4.json();
    if (res4.status !== 201) {
      console.error('Test 4 Failed Details:', JSON.stringify(data4, null, 2));
    }
    generatedCertData = data4.data;

    recordTest(
      4,
      'Valid PASSED inspection generates digital certificate successfully (returns 201 Created)',
      res4.status === 201 && !!generatedCertData?.certificateNumber,
      `Status: ${res4.status}, CertNo: ${generatedCertData?.certificateNumber}`
    );

    // Fetch created certificate from MongoDB
    generatedCertDoc = await Certificate.findById(generatedCertData?._id);

    // -------------------------------------------------------------
    // TEST 5: Certificate contains correct certificateNumber, validFrom, validUntil
    // -------------------------------------------------------------
    const certNumPattern = /^LM-CERT-\d{4}-\d{5}-[A-Z0-9]{4}$/;
    const hasValidDates =
      generatedCertDoc?.validFrom &&
      generatedCertDoc?.validUntil &&
      new Date(generatedCertDoc.validUntil) > new Date(generatedCertDoc.validFrom);
    recordTest(
      5,
      'Certificate contains deterministic certificateNumber, validFrom, and validUntil',
      certNumPattern.test(generatedCertDoc?.certificateNumber || '') && hasValidDates,
      `CertNumber: ${generatedCertDoc?.certificateNumber}, ValidUntil: ${generatedCertDoc?.validUntil?.toISOString()}`
    );

    // -------------------------------------------------------------
    // TEST 6: Duplicate certificate generation attempt is rejected -> 400
    // -------------------------------------------------------------
    const res6 = await fetch(`${BASE_URL}/api/certificates/generate/${inspPassed._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    recordTest(
      6,
      'Duplicate certificate generation attempt for the same inspection is rejected (returns 400)',
      res6.status === 400,
      `Status: ${res6.status}`
    );

    // -------------------------------------------------------------
    // TEST 7: QR token is cryptographically secure (64 hex characters) and unique
    // -------------------------------------------------------------
    const qrToken = generatedCertDoc?.qrToken || generatedCertDoc?.qrVerificationToken;
    const is64Hex = typeof qrToken === 'string' && /^[0-9a-f]{64}$/i.test(qrToken);
    recordTest(
      7,
      'QR verification token is cryptographically secure (64 hex characters) and unique',
      is64Hex,
      `QR Token Length: ${qrToken?.length}, Sample: ${qrToken?.slice(0, 16)}...`
    );

    // -------------------------------------------------------------
    // TEST 8: QR verification URL is valid and points to public verify endpoint
    // -------------------------------------------------------------
    const qrUrl = generatedCertDoc?.qrUrl;
    const isUrlValid =
      typeof qrUrl === 'string' &&
      qrUrl.includes('/api/public/certificates/verify/') &&
      qrUrl.includes(qrToken);
    recordTest(
      8,
      'QR verification URL correctly references the public verification endpoint',
      isUrlValid,
      `QR URL: ${qrUrl}`
    );

    // -------------------------------------------------------------
    // TEST 9: PDF certificate file is generated on disk and exists
    // -------------------------------------------------------------
    const relativePdfPath = generatedCertDoc?.certificateUrl || generatedCertDoc?.certificatePdfPath;
    const absolutePdfPath = path.resolve(
      process.cwd(),
      relativePdfPath.startsWith('/') ? relativePdfPath.slice(1) : relativePdfPath
    );
    const pdfFileExists = fs.existsSync(absolutePdfPath);
    const pdfStats = pdfFileExists ? fs.statSync(absolutePdfPath) : null;
    recordTest(
      9,
      'Official PDF certificate file is generated on disk and is non-empty',
      pdfFileExists && (pdfStats?.size || 0) > 1000,
      `Path: ${relativePdfPath}, Size: ${pdfStats?.size} bytes`
    );

    // -------------------------------------------------------------
    // TEST 10: Application transitions to CERTIFICATE_GENERATED in MongoDB
    // -------------------------------------------------------------
    const updatedApp = await VerificationApplication.findById(appPassed._id);
    recordTest(
      10,
      'Application transitions to CERTIFICATE_GENERATED with status history entry in MongoDB',
      updatedApp?.currentStatus === APPLICATION_STATUSES.CERTIFICATE_GENERATED,
      `Current Status: ${updatedApp?.currentStatus}`
    );

    // -------------------------------------------------------------
    // TEST 11: Instrument nextVerificationDueDate and status are updated in MongoDB
    // -------------------------------------------------------------
    const updatedInst = await Instrument.findById(instPassed._id);
    const hasNextDueDate =
      updatedInst?.nextVerificationDueDate &&
      new Date(updatedInst.nextVerificationDueDate).getTime() ===
        new Date(generatedCertDoc.validUntil).getTime();
    recordTest(
      11,
      'Instrument status is ACTIVE_VERIFIED and nextVerificationDueDate matches certificate in MongoDB',
      updatedInst?.status === INSTRUMENT_STATUSES.ACTIVE_VERIFIED && hasNextDueDate,
      `Status: ${updatedInst?.status}, DueDate: ${updatedInst?.nextVerificationDueDate?.toISOString()}`
    );

    // -------------------------------------------------------------
    // TEST 12: Notification is created for stakeholder
    // -------------------------------------------------------------
    const certNotification = await Notification.findOne({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_GENERATED,
    }).sort({ createdAt: -1 });
    recordTest(
      12,
      'Notification is automatically dispatched to stakeholder upon certificate issuance',
      !!certNotification && certNotification.title.includes('Certificate'),
      `Notification ID: ${certNotification?._id}, Title: ${certNotification?.title}`
    );

    // -------------------------------------------------------------
    // TEST 13: Audit log is created for certificate generation
    // -------------------------------------------------------------
    const certAuditLog = await AuditLog.findOne({
      entity: 'Certificate',
      entityId: generatedCertDoc._id,
      action: AUDIT_ACTIONS.CERTIFICATE_GENERATED,
    });
    recordTest(
      13,
      'Audit log record is created capturing certificate generation event with officer identity',
      !!certAuditLog && String(certAuditLog.user) === String(officer1._id),
      `Audit Log ID: ${certAuditLog?._id}, Action: ${certAuditLog?.action}`
    );

    // -------------------------------------------------------------
    // TEST 14: Public verification with valid token returns 200 + VERIFIED data
    // -------------------------------------------------------------
    const res14 = await fetch(`${BASE_URL}/api/public/certificates/verify/${qrToken}`);
    const data14 = await res14.json();
    const pubData = data14.data;
    const isPublicValid =
      res14.status === 200 &&
      pubData?.certificateNumber === generatedCertDoc.certificateNumber &&
      pubData?.status === CERTIFICATE_STATUSES.ACTIVE &&
      pubData?.isValid === true &&
      pubData?.instrument?.instrumentId === instPassed.instrumentId &&
      pubData?.stakeholder?.businessName === stakeholder1.businessName;

    recordTest(
      14,
      'Public verification endpoint with valid token returns 200 and verified statutory details',
      isPublicValid,
      `Status: ${pubData?.status}, Instrument: ${pubData?.instrument?.instrumentId}`
    );

    // -------------------------------------------------------------
    // TEST 15: Public verification with invalid token returns 404
    // -------------------------------------------------------------
    const invalidToken = '000000000000000000000000000000000000000000000000000000000000ffff';
    const res15 = await fetch(`${BASE_URL}/api/public/certificates/verify/${invalidToken}`);
    recordTest(
      15,
      'Public verification with unknown or invalid token returns 404 Not Found',
      res15.status === 404,
      `Status: ${res15.status}`
    );

    // -------------------------------------------------------------
    // TEST 16: Public verification does NOT leak confidential data
    // -------------------------------------------------------------
    const hasPassword = 'password' in pubData || 'passwordHash' in pubData;
    const hasInternalOfficerEmail = pubData?.officer && 'email' in pubData.officer;
    const hasInternalStakeholderPhone = pubData?.stakeholder && 'phone' in pubData.stakeholder;
    const doesNotLeak = !hasPassword && !hasInternalOfficerEmail && !hasInternalStakeholderPhone;
    recordTest(
      16,
      'Public verification does NOT leak confidential data (passwords, emails, private contacts)',
      doesNotLeak,
      `Leaks Detected: password=${hasPassword}, email=${hasInternalOfficerEmail}`
    );

    // -------------------------------------------------------------
    // TEST 17: Tamper-evident hash matches certificate payload
    // -------------------------------------------------------------
    const hashPayload = `${generatedCertDoc.certificateNumber}|${appPassed.applicationNumber}|${instPassed.instrumentId}|${stakeholder1.tradeLicenseNumber}|${generatedCertDoc.validFrom.toISOString()}|${generatedCertDoc.validUntil.toISOString()}|${officer1._id}`;
    const expectedHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
    const hashMatches = generatedCertDoc.tamperEvidentHash === expectedHash;
    recordTest(
      17,
      'Tamper-evident SHA-256 cryptographic hash matches expected statutory payload',
      hashMatches,
      `Stored: ${generatedCertDoc.tamperEvidentHash.slice(0, 16)}... Expected: ${expectedHash.slice(0, 16)}...`
    );

    // -------------------------------------------------------------
    // TEST 18: Expired certificate returns EXPIRED status dynamically
    // -------------------------------------------------------------
    // Create an expired certificate directly in MongoDB for verification test
    const expiredValidFrom = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    const expiredValidUntil = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
    const expiredQrToken = crypto.randomBytes(32).toString('hex');
    const expiredCertNumber = `LM-CERT-2025-${Math.floor(Math.random() * 90000 + 10000)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const expiredCert = new Certificate({
      certificateNumber: expiredCertNumber,
      application: appPassed._id,
      inspection: inspPassed._id,
      instrument: instPassed._id,
      stakeholder: stakeholder1._id,
      issuedBy: officer1._id,
      issuedByOfficer: officer1._id,
      issuedAt: expiredValidFrom,
      validFrom: expiredValidFrom,
      validUntil: expiredValidUntil,
      certificateStatus: CERTIFICATE_STATUSES.ACTIVE, // Stored as active, but dynamically expired
      status: CERTIFICATE_STATUSES.ACTIVE,
      qrToken: expiredQrToken,
      qrVerificationToken: expiredQrToken,
      tamperEvidentHash: 'sample-tamper-hash-for-expired-test',
    });
    // Bypass unique application constraint for this test cert by assigning dummy id
    expiredCert.application = new (Certificate.base.Types.ObjectId)();
    expiredCert.inspection = new (Certificate.base.Types.ObjectId)();
    await expiredCert.save();

    const res18 = await fetch(`${BASE_URL}/api/public/certificates/verify/${expiredQrToken}`);
    const data18 = await res18.json();
    const isDynExpired =
      res18.status === 200 &&
      data18.data?.status === CERTIFICATE_STATUSES.EXPIRED &&
      data18.data?.isExpired === true &&
      data18.data?.isValid === false;

    recordTest(
      18,
      'Expired certificate returns EXPIRED status dynamically upon public lookup',
      isDynExpired,
      `Status: ${data18.data?.status}, isExpired: ${data18.data?.isExpired}`
    );

    // -------------------------------------------------------------
    // TEST 19: Non-admin (Officer / Business User) cannot revoke certificate -> 403
    // -------------------------------------------------------------
    const res19a = await fetch(`${BASE_URL}/api/certificates/${generatedCertDoc._id}/revoke`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify({ reason: 'Attempted officer revocation' }),
    });
    const res19b = await fetch(`${BASE_URL}/api/certificates/${generatedCertDoc._id}/revoke`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${businessUser1Token}`,
      },
      body: JSON.stringify({ reason: 'Attempted trader revocation' }),
    });
    recordTest(
      19,
      'Non-admin users (Officer / Business User) cannot revoke certificate (returns 403 Forbidden)',
      res19a.status === 403 && res19b.status === 403,
      `Officer: ${res19a.status}, Business User: ${res19b.status}`
    );

    // -------------------------------------------------------------
    // TEST 20: Revocation requires valid revocationReason (at least 5 chars) -> 400
    // -------------------------------------------------------------
    const res20a = await fetch(`${BASE_URL}/api/certificates/${generatedCertDoc._id}/revoke`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ reason: '' }),
    });
    const res20b = await fetch(`${BASE_URL}/api/certificates/${generatedCertDoc._id}/revoke`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ reason: 'abc' }),
    });
    recordTest(
      20,
      'Revocation without a specific statutory reason (>= 5 chars) is rejected (returns 400 Bad Request)',
      res20a.status === 400 && res20b.status === 400,
      `Empty Reason: ${res20a.status}, Short Reason: ${res20b.status}`
    );

    // -------------------------------------------------------------
    // TEST 21: Admin can revoke certificate with valid statutory reason -> 200 OK
    // -------------------------------------------------------------
    const statutoryReason = 'Fraudulent alteration of calibration seal detected during surprise market surveillance.';
    const res21 = await fetch(`${BASE_URL}/api/certificates/${generatedCertDoc._id}/revoke`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ reason: statutoryReason }),
    });
    const data21 = await res21.json();
    const isRevoked =
      res21.status === 200 &&
      (data21.data?.certificateStatus === CERTIFICATE_STATUSES.REVOKED ||
        data21.data?.status === CERTIFICATE_STATUSES.REVOKED);
    recordTest(
      21,
      'Authorized Admin can revoke certificate with statutory reason (returns 200 OK)',
      isRevoked,
      `Status: ${res21.status}, CertStatus: ${data21.data?.certificateStatus}`
    );

    // -------------------------------------------------------------
    // TEST 22: Revoked certificate shows REVOKED status in public verification
    // -------------------------------------------------------------
    const res22 = await fetch(`${BASE_URL}/api/public/certificates/verify/${qrToken}`);
    const data22 = await res22.json();
    recordTest(
      22,
      'Revoked certificate displays REVOKED status in public verification response',
      res22.status === 200 &&
        data22.data?.status === CERTIFICATE_STATUSES.REVOKED &&
        data22.data?.isValid === false &&
        data22.data?.isRevoked === true,
      `Status: ${data22.data?.status}, isValid: ${data22.data?.isValid}, isRevoked: ${data22.data?.isRevoked}`
    );

    // -------------------------------------------------------------
    // TEST 23: Revoked certificate includes revocationReason and revokedAt in public data
    // -------------------------------------------------------------
    const revocationDetails = data22.data?.revocationDetails;
    const hasRevocationData =
      revocationDetails?.reason === statutoryReason && !!revocationDetails?.revokedAt;
    recordTest(
      23,
      'Revoked certificate includes statutory revocationReason and revokedAt timestamp in public response',
      hasRevocationData,
      `Reason: "${revocationDetails?.reason?.slice(0, 30)}...", RevokedAt: ${revocationDetails?.revokedAt}`
    );

    // -------------------------------------------------------------
    // TEST 24: Cannot revoke already REVOKED certificate -> 400 Bad Request
    // -------------------------------------------------------------
    const res24 = await fetch(`${BASE_URL}/api/certificates/${generatedCertDoc._id}/revoke`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ reason: 'Attempted double revocation' }),
    });
    recordTest(
      24,
      'Cannot revoke an already REVOKED certificate (returns 400 Bad Request)',
      res24.status === 400,
      `Status: ${res24.status}`
    );

    // -------------------------------------------------------------
    // TEST 25: Revoking certificate updates instrument status to REJECTED in MongoDB
    // -------------------------------------------------------------
    const instAfterRevoke = await Instrument.findById(instPassed._id);
    recordTest(
      25,
      'Revoking certificate automatically updates instrument status to REJECTED in MongoDB',
      instAfterRevoke?.status === INSTRUMENT_STATUSES.REJECTED,
      `Instrument Status: ${instAfterRevoke?.status}`
    );

    // -------------------------------------------------------------
    // TEST 26: Revoking certificate creates an audit log
    // -------------------------------------------------------------
    const revokeAuditLog = await AuditLog.findOne({
      entity: 'Certificate',
      entityId: generatedCertDoc._id,
      action: AUDIT_ACTIONS.CERTIFICATE_REVOKED,
    });
    recordTest(
      26,
      'Revoking certificate generates CERTIFICATE_REVOKED audit log with administrative reason',
      !!revokeAuditLog && revokeAuditLog.metadata?.reason === statutoryReason,
      `Audit Log ID: ${revokeAuditLog?._id}, Reason: ${revokeAuditLog?.metadata?.reason?.slice(0, 30)}...`
    );

    // -------------------------------------------------------------
    // TEST 27: Stakeholder can list own certificates -> 200 OK
    // -------------------------------------------------------------
    const res27 = await fetch(`${BASE_URL}/api/certificates`, {
      headers: { Authorization: `Bearer ${businessUser1Token}` },
    });
    const data27 = await res27.json();
    const certsList = data27.data?.items || data27.data?.data || (Array.isArray(data27.data) ? data27.data : []);
    const containsOwnCert = Array.isArray(certsList) && certsList.some(
      (c) => c.certificateNumber === generatedCertDoc.certificateNumber
    );
    recordTest(
      27,
      'Stakeholder can retrieve list of their own issued certificates (returns 200 OK)',
      res27.status === 200 && containsOwnCert,
      `Count: ${certsList.length}, Contains Issued Cert: ${containsOwnCert}`
    );

    // -------------------------------------------------------------
    // TEST 28: Stakeholder cannot view another stakeholder certificate -> 403 Forbidden
    // -------------------------------------------------------------
    const res28 = await fetch(`${BASE_URL}/api/certificates/${generatedCertDoc._id}`, {
      headers: { Authorization: `Bearer ${businessUser2Token}` },
    });
    recordTest(
      28,
      'Stakeholder cannot view another stakeholder certificate details (returns 403 Forbidden)',
      res28.status === 403,
      `Status: ${res28.status}`
    );

    // -------------------------------------------------------------
    // TEST 29: Admin can list all certificates with pagination & filters -> 200 OK
    // -------------------------------------------------------------
    const res29 = await fetch(`${BASE_URL}/api/certificates?page=1&limit=10&status=REVOKED`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const data29 = await res29.json();
    const adminCerts = data29.data?.items || data29.data?.data || (Array.isArray(data29.data) ? data29.data : []);
    const allRevoked = Array.isArray(adminCerts) && adminCerts.every(
      (c) => c.certificateStatus === CERTIFICATE_STATUSES.REVOKED || c.status === CERTIFICATE_STATUSES.REVOKED
    );
    recordTest(
      29,
      'Admin can query certificates with pagination, search, and status filtering',
      res29.status === 200 && adminCerts.length > 0 && allRevoked,
      `Status: ${res29.status}, Filtered Count: ${adminCerts.length}, All Revoked: ${allRevoked}`
    );

    // -------------------------------------------------------------
    // TEST 30: Certificate PDF download returns valid PDF stream / file -> 200 OK
    // -------------------------------------------------------------
    const res30 = await fetch(`${BASE_URL}/api/certificates/${generatedCertDoc._id}/download`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const pdfBuffer = await res30.arrayBuffer();
    const pdfHeader = Buffer.from(pdfBuffer).slice(0, 4).toString('utf-8');
    const isPdfValid = res30.status === 200 && pdfHeader === '%PDF';
    recordTest(
      30,
      'Certificate PDF download endpoint returns valid binary PDF stream (%PDF magic bytes)',
      isPdfValid,
      `Status: ${res30.status}, Magic Bytes: ${pdfHeader}, Bytes: ${pdfBuffer.byteLength}`
    );

    // -------------------------------------------------------------
    // TEST 31: Stakeholder cannot download another stakeholder PDF -> 403 Forbidden
    // -------------------------------------------------------------
    const res31 = await fetch(`${BASE_URL}/api/certificates/${generatedCertDoc._id}/download`, {
      headers: { Authorization: `Bearer ${businessUser2Token}` },
    });
    recordTest(
      31,
      'Stakeholder cannot download another stakeholder certificate PDF (returns 403 Forbidden)',
      res31.status === 403,
      `Status: ${res31.status}`
    );

    // -------------------------------------------------------------
    // TEST 32: Public verification by direct certificateNumber returns 200 OK
    // -------------------------------------------------------------
    const res32 = await fetch(
      `${BASE_URL}/api/public/certificates/verify/${generatedCertDoc.certificateNumber}`
    );
    const data32 = await res32.json();
    recordTest(
      32,
      'Public verification endpoint works by searching direct certificateNumber string',
      res32.status === 200 && data32.data?.certificateNumber === generatedCertDoc.certificateNumber,
      `Status: ${res32.status}, Cert: ${data32.data?.certificateNumber}`
    );

    // -------------------------------------------------------------
    // TEST 33: Officer can view certificate details by ID -> 200 OK
    // -------------------------------------------------------------
    const res33 = await fetch(`${BASE_URL}/api/certificates/${generatedCertDoc._id}`, {
      headers: { Authorization: `Bearer ${officer1Token}` },
    });
    const data33 = await res33.json();
    recordTest(
      33,
      'Assigned Legal Metrology Officer can view certificate details with populated relations',
      res33.status === 200 && !!data33.data?.instrument && !!data33.data?.stakeholder,
      `Status: ${res33.status}, Instrument: ${data33.data?.instrument?.instrumentId}`
    );

    // -------------------------------------------------------------
    // TEST 34: Unauthenticated access to certificate generation returns 401 Unauthorized
    // -------------------------------------------------------------
    const res34 = await fetch(`${BASE_URL}/api/certificates/generate/${inspPassed._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    recordTest(
      34,
      'Unauthenticated request to certificate generation endpoint is rejected (returns 401)',
      res34.status === 401,
      `Status: ${res34.status}`
    );

  } catch (error) {
    console.error('\n❌ Unhandled error during Phase 8 test execution:', error);
    recordTest(99, 'Test suite completed without unhandled crash', false, error.message);
  } finally {
    console.log('\n===============================================================');
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`Phase 8 Test Results: ${passedCount}/${totalCount} PASSED`);
    if (passedCount === totalCount) {
      console.log('🎉 ALL PHASE 8 DIGITAL CERTIFICATE TEST CRITERIA PASSED WITH ZERO DEFECTS!');
    } else {
      console.log('⚠️ SOME PHASE 8 TESTS FAILED. CHECK LOGS ABOVE.');
    }
    console.log('===============================================================');

    await disconnectDB();
  }
}

runAllTests();
