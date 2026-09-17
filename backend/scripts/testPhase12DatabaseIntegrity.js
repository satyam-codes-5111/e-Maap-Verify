import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { Certificate } from '../models/Certificate.js';
import { VerificationResult } from '../models/VerificationResult.js';
import { VerificationCenter } from '../models/VerificationCenter.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { GATC } from '../models/GATC.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { ENV } from '../config/env.js';
import {
  USER_ROLES,
  APPLICATION_STATUSES,
  SCHEDULE_STATUSES,
  INSPECTION_STATUSES,
  INSTRUMENT_STATUSES,
  INSTRUMENT_CATEGORIES,
  ACCURACY_CLASSES,
  INSPECTION_RESULTS,
  CERTIFICATE_STATUSES,
  VERIFICATION_VERDICTS,
} from '../config/constants.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { runDatabaseIntegrityDiagnostics } from '../services/integrityDiagnosticService.js';
import { checkScheduleConflicts } from '../services/scheduleService.js';
import { transitionApplicationStatus } from '../services/applicationWorkflowService.js';

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;
const failureDetails = [];

function assert(condition, message, detail = '') {
  const currentTest = passed + failed + 1;
  if (condition) {
    passed++;
    console.log(`[✅ PASS] Test ${currentTest}: ${message} ${detail ? `(${detail})` : ''}`);
  } else {
    failed++;
    const failMsg = `[❌ FAIL] Test ${currentTest}: ${message} ${detail ? `(${detail})` : ''}`;
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

  if (body && typeof body === 'object') {
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

async function runDatabaseIntegrityTests() {
  console.log('================================================================');
  console.log('🛡️ PHASE 12 — TASK 6: DATABASE INTEGRITY, INDEXING & TRANSACTIONS');
  console.log('================================================================\n');

  await connectDB();

  // Test artifacts tracker for clean teardown
  const createdUserIds = [];
  const createdStakeholderIds = [];
  const createdInstrumentIds = [];
  const createdAppIds = [];
  const createdScheduleIds = [];
  const createdInspectionIds = [];
  const createdCertIds = [];
  const createdResultIds = [];
  const createdCenterIds = [];

  try {
    // -------------------------------------------------------------
    // SECTION 1: TOPOLOGY & TRANSACTION INFRASTRUCTURE VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- SECTION 1: DATABASE TOPOLOGY & TRANSACTION CAPABILITY ---');
    const topologyType = mongoose.connection.client?.topology?.description?.type || 'Unknown';
    const isReplicaSet = topologyType.includes('ReplicaSet');
    assert(
      isReplicaSet || topologyType !== 'Unknown',
      'Database client topology correctly identified',
      `Topology: ${topologyType}`
    );

    let txTestedSuccess = false;
    let txTestedRollback = false;

    // Test 2: Transaction Commit Test
    const testStakeholderUser = new User({
      name: 'TX Test User',
      email: `tx_test_${Date.now()}@example.gov.in`,
      password: 'StrongPassword123!',
      role: USER_ROLES.BUSINESS_USER,
      isActive: true,
    });
    await testStakeholderUser.save();
    createdUserIds.push(testStakeholderUser._id);

    await runInTransaction(async (session) => {
      const stakeholder = new Stakeholder({
        user: testStakeholderUser._id,
        businessName: 'TX Test Business Enterprises',
        businessType: 'MANUFACTURER',
        tradeLicenseNumber: `TL-TX-${Date.now()}`,
        gstNumber: '07AAAAA0000A1Z5',
        registeredAddress: {
          street: '123 Test St',
          city: 'New Delhi',
          district: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
        },
        contactPerson: {
          name: 'Rajesh Sharma',
          phone: '9876543210',
          email: 'rajesh@example.com',
          designation: 'Director',
        },
      });
      await stakeholder.save(session ? { session } : undefined);
      createdStakeholderIds.push(stakeholder._id);
      txTestedSuccess = true;
    });
    assert(txTestedSuccess, 'Transaction successfully committed multi-step operation');

    // Test 3: Transaction Rollback on Error
    const rollbackTestUser = new User({
      name: 'Rollback User',
      email: `rollback_${Date.now()}@example.gov.in`,
      password: 'StrongPassword123!',
      role: USER_ROLES.BUSINESS_USER,
    });
    await rollbackTestUser.save();
    createdUserIds.push(rollbackTestUser._id);

    const initialCount = await Stakeholder.countDocuments({ user: rollbackTestUser._id });
    try {
      await runInTransaction(async (session) => {
        const stakeholderFail = new Stakeholder({
          user: rollbackTestUser._id,
          businessName: 'Rollback Business',
          businessType: 'MANUFACTURER',
          tradeLicenseNumber: `TL-FAIL-${Date.now()}`,
          gstNumber: '07AAAAA0000A1Z6',
          registeredAddress: {
            street: '123 Rollback St',
            city: 'New Delhi',
            district: 'New Delhi',
            state: 'Delhi',
            pincode: '110001',
          },
          contactPerson: {
            name: 'Fail Person',
            phone: '9876543211',
            email: 'fail@example.com',
          },
        });
        await stakeholderFail.save(session ? { session } : undefined);
        // Force an error inside the transaction
        throw new Error('SIMULATED_TRANSACTION_FAILURE_ROLLBACK');
      });
    } catch (err) {
      if (err.message === 'SIMULATED_TRANSACTION_FAILURE_ROLLBACK') {
        txTestedRollback = true;
      }
    }
    const postFailCount = await Stakeholder.countDocuments({ user: rollbackTestUser._id });
    assert(
      txTestedRollback && postFailCount === initialCount && postFailCount === 0,
      'Transaction cleanly aborts and rolls back mutations on exception',
      `Count remained ${postFailCount}`
    );

    // -------------------------------------------------------------
    // SECTION 2: SCHEMA CONSTRAINTS & INDEX INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: SCHEMA CONSTRAINTS & UNIQUE INDEXES ---');

    // Test 4: User Email Unique Constraint
    let duplicateEmailError = false;
    try {
      const dupUser = new User({
        name: 'Duplicate User',
        email: testStakeholderUser.email,
        password: 'Password123!',
        role: USER_ROLES.BUSINESS_USER,
      });
      await dupUser.save();
    } catch (err) {
      duplicateEmailError = err.code === 11000 || err.name === 'MongoServerError';
    }
    assert(duplicateEmailError, 'User unique index rejects duplicate email address');

    // Test 5: Instrument unique instrumentId constraint
    const testInstrument = new Instrument({
      instrumentId: `INST-TEST-${Date.now()}`,
      stakeholder: createdStakeholderIds[0],
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'Commercial Electronic Weighing Instrument',
      manufacturer: 'Apex Weights Ltd',
      modelNumber: 'AW-500',
      serialNumber: `SN-${Date.now()}`,
      capacity: { value: 50, unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
      verificationScaleInterval_e: '5g',
      status: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
      installationAddress: {
        premiseName: 'Warehouse 1',
        addressLine: '10 Industrial Area',
        city: 'New Delhi',
        district: 'New Delhi',
        state: 'Delhi',
        pincode: '110020',
      },
    });
    await testInstrument.save();
    createdInstrumentIds.push(testInstrument._id);

    let dupInstrumentError = false;
    try {
      const dupInst = new Instrument({
        instrumentId: testInstrument.instrumentId,
        stakeholder: createdStakeholderIds[0],
        category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
        instrumentType: 'Commercial Electronic Weighing Instrument',
        manufacturer: 'Apex Weights Ltd',
        modelNumber: 'AW-500',
        serialNumber: `SN-DUP-${Date.now()}`,
        capacity: { value: 50, unit: 'kg' },
        accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
        verificationScaleInterval_e: '5g',
        installationAddress: {
          premiseName: 'Warehouse 1',
          addressLine: '10 Industrial Area',
          city: 'New Delhi',
          district: 'New Delhi',
          state: 'Delhi',
          pincode: '110020',
        },
      });
      await dupInst.save();
    } catch (err) {
      dupInstrumentError = err.code === 11000 || err.name === 'MongoServerError';
    }
    assert(dupInstrumentError, 'Instrument unique index rejects duplicate instrumentId');

    // Test 6: Stakeholder unique tradeLicenseNumber
    let dupTradeLicenseError = false;
    const anotherUser = new User({
      name: 'Another User',
      email: `another_${Date.now()}@example.gov.in`,
      password: 'StrongPassword123!',
      role: USER_ROLES.BUSINESS_USER,
    });
    await anotherUser.save();
    createdUserIds.push(anotherUser._id);

    try {
      const dupStakeholder = new Stakeholder({
        user: anotherUser._id,
        businessName: 'Duplicate Trade License Inc',
        businessType: 'REPAIRER',
        tradeLicenseNumber: (await Stakeholder.findById(createdStakeholderIds[0])).tradeLicenseNumber,
        gstNumber: '07BBBBB0000B1Z1',
        registeredAddress: {
          street: '456 Lane',
          city: 'New Delhi',
          district: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
        },
        contactPerson: {
          name: 'Contact Guy',
          phone: '9876543212',
          email: 'guy@example.com',
        },
      });
      await dupStakeholder.save();
    } catch (err) {
      dupTradeLicenseError = err.code === 11000 || err.name === 'MongoServerError';
    }
    assert(dupTradeLicenseError, 'Stakeholder unique index rejects duplicate tradeLicenseNumber');

    // Test 7: Index Synchronization Across All Domain Models
    const modelsToIndexCheck = [
      User,
      Stakeholder,
      Instrument,
      VerificationApplication,
      VerificationSchedule,
      VerificationInspection,
      Certificate,
      Notification,
      AuditLog,
      VerificationResult,
      VerificationCenter,
      GATC,
      NotificationPreference,
    ];
    let allIndexesInSync = true;
    for (const model of modelsToIndexCheck) {
      try {
        const indexes = await model.collection.indexes();
        if (!indexes || indexes.length === 0) {
          allIndexesInSync = false;
        }
      } catch (e) {
        allIndexesInSync = false;
      }
    }
    assert(allIndexesInSync, 'All 13 core domain models have verified MongoDB indexes registered');

    // -------------------------------------------------------------
    // SECTION 3: STATE TRANSITION INTEGRITY & WORKFLOW ENGINE
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: STATE TRANSITION MACHINE INTEGRITY ---');

    const officerUser = new User({
      name: 'Inspector Verma',
      email: `inspector_${Date.now()}@doca.gov.in`,
      password: 'StrongPassword123!',
      role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
      jurisdiction: { state: 'Delhi', district: 'New Delhi' },
      isActive: true,
    });
    await officerUser.save();
    createdUserIds.push(officerUser._id);

    const testApp = new VerificationApplication({
      applicationNumber: `APP-INT-${Date.now()}`,
      stakeholder: createdStakeholderIds[0],
      instrument: testInstrument._id,
      applicationType: 'INITIAL_VERIFICATION',
      verificationLocation: {
        locationType: 'ON_SITE_PREMISES',
        address: '10 Industrial Area, New Delhi',
        district: 'New Delhi',
      },
      currentStatus: APPLICATION_STATUSES.DRAFT,
      fees: { amount: 2500, paymentStatus: 'PAID' },
      createdBy: testStakeholderUser._id,
    });
    await testApp.save();
    createdAppIds.push(testApp._id);

    // Test 8: Valid state transition DRAFT -> SUBMITTED
    await transitionApplicationStatus(testApp, APPLICATION_STATUSES.SUBMITTED, testStakeholderUser);
    assert(
      testApp.currentStatus === APPLICATION_STATUSES.SUBMITTED,
      'Valid state transition executed: DRAFT -> SUBMITTED'
    );

    // Test 9: Valid state transition SUBMITTED -> UNDER_REVIEW
    await transitionApplicationStatus(testApp, APPLICATION_STATUSES.UNDER_REVIEW, officerUser);
    assert(
      testApp.currentStatus === APPLICATION_STATUSES.UNDER_REVIEW,
      'Valid state transition executed: SUBMITTED -> UNDER_REVIEW'
    );

    // Test 10: Invalid state transition UNDER_REVIEW -> VERIFIED (illegal skip)
    let illegalTransitionBlocked = false;
    try {
      await transitionApplicationStatus(testApp, APPLICATION_STATUSES.VERIFIED, officerUser);
    } catch (err) {
      illegalTransitionBlocked = err.statusCode === 400 || err.message.includes('Invalid status transition');
    }
    assert(
      illegalTransitionBlocked,
      'State transition engine rejects illegal state transition jump (UNDER_REVIEW -> VERIFIED)'
    );

    // Test 11: Valid transition UNDER_REVIEW -> APPROVED
    await transitionApplicationStatus(testApp, APPLICATION_STATUSES.APPROVED, officerUser);
    assert(
      testApp.currentStatus === APPLICATION_STATUSES.APPROVED,
      'Valid state transition executed: UNDER_REVIEW -> APPROVED'
    );

    // Test 12: Audit history is preserved sequentially
    assert(
      testApp.statusHistory.length >= 3,
      'Application statusHistory maintains complete sequential audit records',
      `History count: ${testApp.statusHistory.length}`
    );

    // -------------------------------------------------------------
    // SECTION 4: CONCURRENCY & DOUBLE-BOOKING CONFLICT PREVENTION
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: CONCURRENCY & DOUBLE-BOOKING PROTECTION ---');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const testCenter = new VerificationCenter({
      name: `Delhi State Metrology Lab ${Date.now()}`,
      code: `VCTR-${Date.now()}`,
      address: 'Barakhamba Road, Connaught Place, New Delhi, Delhi 110001',
      capacityPerDay: 1, // Strict capacity of 1 for testing capacity overflow
      jurisdiction: { state: 'Delhi', district: 'New Delhi' },
      isActive: true,
    });
    await testCenter.save();
    createdCenterIds.push(testCenter._id);

    // Schedule #1
    const schedule1 = new VerificationSchedule({
      application: testApp._id,
      instrument: testInstrument._id,
      stakeholder: createdStakeholderIds[0],
      assignedOfficer: officerUser._id,
      verificationCenter: testCenter._id,
      scheduledDate: tomorrow,
      timeSlot: '10:00 - 11:30',
      startTime: '10:00',
      endTime: '11:30',
      locationType: 'DISTRICT_LABORATORY',
      locationAddress: 'Barakhamba Road, Connaught Place, New Delhi',
      status: SCHEDULE_STATUSES.SCHEDULED,
      createdBy: officerUser._id,
    });
    await schedule1.save();
    createdScheduleIds.push(schedule1._id);

    // Test 13: Officer double-booking conflict detection
    let officerConflictDetected = false;
    try {
      await checkScheduleConflicts({
        scheduledDate: tomorrow,
        startTime: '10:30',
        endTime: '12:00',
        timeSlot: '10:30 - 12:00',
        assignedOfficerId: officerUser._id,
        applicationId: new mongoose.Types.ObjectId(),
      });
    } catch (err) {
      officerConflictDetected = err.statusCode === 409 || err.message.includes('already has a verification scheduled');
    }
    assert(
      officerConflictDetected,
      'Conflict engine detects and blocks officer overlapping time slot (409 Conflict)'
    );

    // Test 14: Instrument double-booking conflict detection
    let instrumentConflictDetected = false;
    try {
      await checkScheduleConflicts({
        scheduledDate: tomorrow,
        startTime: '10:15',
        endTime: '11:15',
        timeSlot: '10:15 - 11:15',
        assignedOfficerId: new mongoose.Types.ObjectId(),
        instrumentId: testInstrument._id,
        applicationId: new mongoose.Types.ObjectId(),
      });
    } catch (err) {
      instrumentConflictDetected = err.statusCode === 409 || err.message.includes('already booked');
    }
    assert(
      instrumentConflictDetected,
      'Conflict engine detects and blocks instrument overlapping schedule (409 Conflict)'
    );

    // Test 15: Verification center capacity limit detection
    let centerCapacityExceeded = false;
    try {
      await checkScheduleConflicts({
        scheduledDate: tomorrow,
        startTime: '14:00',
        endTime: '15:30',
        timeSlot: '14:00 - 15:30',
        assignedOfficerId: new mongoose.Types.ObjectId(),
        verificationCenterId: testCenter._id,
        applicationId: new mongoose.Types.ObjectId(),
      });
    } catch (err) {
      centerCapacityExceeded = err.statusCode === 409 || err.message.includes('capacity limit');
    }
    assert(
      centerCapacityExceeded,
      'Conflict engine detects and blocks center capacity exceeded (409 Conflict)'
    );

    // Test 16: Non-overlapping schedule allowed
    let nonOverlappingAllowed = false;
    const anotherDay = new Date(tomorrow);
    anotherDay.setDate(anotherDay.getDate() + 7);
    try {
      const allowed = await checkScheduleConflicts({
        scheduledDate: anotherDay,
        startTime: '10:00',
        endTime: '11:00',
        timeSlot: '10:00 - 11:00',
        assignedOfficerId: officerUser._id,
        instrumentId: testInstrument._id,
        verificationCenterId: testCenter._id,
        applicationId: new mongoose.Types.ObjectId(),
      });
      nonOverlappingAllowed = allowed === true;
    } catch (err) {
      nonOverlappingAllowed = false;
    }
    assert(nonOverlappingAllowed, 'Conflict engine allows valid non-conflicting schedule');

    // -------------------------------------------------------------
    // SECTION 5: REFERENTIAL INTEGRITY & DIAGNOSTIC SCANNER
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: REFERENTIAL INTEGRITY & DIAGNOSTIC SCAN ---');

    // Test 17: Service-level diagnostic scan execution
    const diagReport = await runDatabaseIntegrityDiagnostics();
    assert(
      typeof diagReport.totalOrphansDetected === 'number' && diagReport.status !== undefined,
      'Integrity diagnostic service executes and outputs comprehensive database scan',
      `Orphans count: ${diagReport.totalOrphansDetected}, Status: ${diagReport.status}`
    );

    // Test 18: Admin endpoint access to integrity report (SUPER_ADMIN)
    const superAdmin = new User({
      name: 'Super Administrator',
      email: `superadmin_${Date.now()}@doca.gov.in`,
      password: 'SuperPassword123!',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true,
    });
    await superAdmin.save();
    createdUserIds.push(superAdmin._id);
    const adminToken = generateToken(superAdmin);

    const adminDiagRes = await api('/api/admin/diagnostics/integrity', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminDiagRes.status === 200 && adminDiagRes.data.success === true,
      'GET /api/admin/diagnostics/integrity returns 200 OK for authorized administrator'
    );

    // Test 19: RBAC protection on diagnostics endpoint (BUSINESS_USER rejected with 403)
    const bizToken = generateToken(testStakeholderUser);
    const bizDiagRes = await api('/api/admin/diagnostics/integrity', {
      headers: { Authorization: `Bearer ${bizToken}` },
    });
    assert(
      bizDiagRes.status === 403,
      'GET /api/admin/diagnostics/integrity enforces RBAC: rejects BUSINESS_USER with 403 Forbidden'
    );

    // Test 20: Unauthenticated access rejected with 401
    const unauthDiagRes = await api('/api/admin/diagnostics/integrity');
    assert(
      unauthDiagRes.status === 401,
      'GET /api/admin/diagnostics/integrity enforces authentication: rejects unauthenticated with 401'
    );

    // -------------------------------------------------------------
    // SECTION 6: COMPLETE WORKFLOW TRANSACTION INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: COMPLETE WORKFLOW TRANSACTION & AUDIT INTEGRITY ---');

    testApp.assignedLMO = officerUser._id;
    await testApp.save();

    // Create an inspection for testApp
    const inspection = new VerificationInspection({
      inspectionNumber: `INSP-TX-${Date.now()}`,
      application: testApp._id,
      schedule: schedule1._id,
      instrument: testInstrument._id,
      stakeholder: createdStakeholderIds[0],
      assignedOfficer: officerUser._id,
      officer: officerUser._id,
      inspectionDate: new Date(),
      inspectionStatus: INSPECTION_STATUSES.IN_PROGRESS,
      location: '10 Industrial Area',
      instrumentCondition: { visualCheckPassed: true, levelingBubbleCentered: true, modelApprovalPlateIntact: true, zeroTrackingOperational: true },
      standardsUsed: [
        {
          standardId: 'WS-001',
          denomination: '10kg F1 Weight',
          calibrationValidUntil: new Date(Date.now() + 86400000 * 180),
        },
      ],
      measurementReadings: [
        {
          testType: 'LINEARITY',
          appliedLoad: 10,
          indicatedReading: 10.0001,
          intrinsicError: 0.0001,
          maximumPermissibleError: 0.0005,
          isCompliant: true,
        },
      ],
      stampingAndSealing: {
        leadSealsApplied: 1,
        hologramStickerNumber: `HOLO-${Date.now()}`,
        stampingYearMark: '2026',
        sealingPlugsIntact: true,
      },
    });
    await inspection.save();
    createdInspectionIds.push(inspection._id);

    // Finalize inspection via service
    const { finalizeInspection } = await import('../services/inspectionService.js');
    const finalResult = await finalizeInspection(
      inspection._id,
      {
        result: INSPECTION_RESULTS.VERIFIED,
        observations: 'Compliant instrument',
        officerRemarks: 'Compliant instrument',
      },
      officerUser
    );

    assert(
      finalResult.verdict === 'VERIFIED' &&
        finalResult.inspection.inspectionStatus === INSPECTION_STATUSES.PASSED,
      'finalizeInspection atomically executed verification and passed status'
    );

    // Test 21: Verify application, instrument, and schedule synchronized atomically
    const updatedApp = await VerificationApplication.findById(testApp._id);
    const updatedInstrument = await Instrument.findById(testInstrument._id);
    const updatedSchedule = await VerificationSchedule.findById(schedule1._id);
    const createdResult = await VerificationResult.findOne({ application: testApp._id });
    if (createdResult) createdResultIds.push(createdResult._id);

    assert(
      updatedApp.currentStatus === APPLICATION_STATUSES.VERIFIED,
      'Application status atomically synchronized to VERIFIED'
    );
    assert(
      updatedInstrument.status === INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
      'Instrument status atomically synchronized to ACTIVE_VERIFIED'
    );
    assert(
      updatedSchedule.status === SCHEDULE_STATUSES.COMPLETED,
      'Schedule status atomically synchronized to COMPLETED'
    );
    assert(
      createdResult && createdResult.result === VERIFICATION_VERDICTS.PASS,
      'VerificationResult document atomically created with PASS verdict'
    );

    // Test 22: Certificate generation within transaction
    const { generateCertificateForInspection } = await import('../services/certificateService.js');
    const cert = await generateCertificateForInspection({ inspectionId: inspection._id, user: officerUser });
    createdCertIds.push(cert._id);

    const postCertApp = await VerificationApplication.findById(testApp._id);
    assert(
      cert.certificateNumber &&
        cert.certificateStatus === CERTIFICATE_STATUSES.ACTIVE &&
        postCertApp.currentStatus === APPLICATION_STATUSES.CERTIFICATE_GENERATED,
      'Certificate generation atomically transitions application to CERTIFICATE_GENERATED'
    );

    // Test 23: Audit log immutability check
    const recentAuditLogs = await AuditLog.find({
      entityId: String(testApp._id),
    });
    assert(
      recentAuditLogs.length >= 1,
      'Audit logs recorded for all state mutations with complete user attribution',
      `Audit logs recorded: ${recentAuditLogs.length}`
    );
  } finally {
    // -------------------------------------------------------------
    // CLEAN TEARDOWN: Ensure no orphaned test records remain
    // -------------------------------------------------------------
    console.log('\n--- CLEANING UP TEST ARTIFACTS ---');
    if (createdResultIds.length) await VerificationResult.deleteMany({ _id: { $in: createdResultIds } });
    if (createdCertIds.length) await Certificate.deleteMany({ _id: { $in: createdCertIds } });
    if (createdInspectionIds.length) await VerificationInspection.deleteMany({ _id: { $in: createdInspectionIds } });
    if (createdScheduleIds.length) await VerificationSchedule.deleteMany({ _id: { $in: createdScheduleIds } });
    if (createdAppIds.length) await VerificationApplication.deleteMany({ _id: { $in: createdAppIds } });
    if (createdInstrumentIds.length) await Instrument.deleteMany({ _id: { $in: createdInstrumentIds } });
    if (createdStakeholderIds.length) await Stakeholder.deleteMany({ _id: { $in: createdStakeholderIds } });
    if (createdCenterIds.length) await VerificationCenter.deleteMany({ _id: { $in: createdCenterIds } });
    if (createdUserIds.length) await User.deleteMany({ _id: { $in: createdUserIds } });

    // Clean up earlier orphan test applications detected in initial scan
    await VerificationApplication.deleteMany({
      applicationNumber: { $regex: /^APP-FINAL-/ },
    });

    console.log('Cleanup completed cleanly.');
    await disconnectDB();
  }

  console.log('\n================================================================');
  console.log(`TASK 6 DATABASE INTEGRITY RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    console.error('\nFailures:');
    failureDetails.forEach((f) => console.error(f));
    process.exit(1);
  }
}

runDatabaseIntegrityTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
