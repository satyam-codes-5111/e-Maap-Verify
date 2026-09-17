/**
 * Phase 7: Field Verification / Inspection Engine - Comprehensive Test Suite
 * Validates real MongoDB operations, officer inspection workflows, structured observations,
 * measurement readings, tolerance error checks, photo evidence, immutability,
 * statutory verdicts (VERIFIED vs REJECTED), administrative reopen, RBAC, and audit logs.
 */

import { ENV } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { VerificationResult } from '../models/VerificationResult.js';
import { VerificationCenter } from '../models/VerificationCenter.js';
import { AuditLog } from '../models/AuditLog.js';
import {
  USER_ROLES,
  APPLICATION_STATUSES,
  SCHEDULE_STATUSES,
  INSTRUMENT_STATUSES,
  INSPECTION_STATUSES,
  INSPECTION_RESULTS,
  VERIFICATION_VERDICTS,
  INSTRUMENT_CATEGORIES,
  ACCURACY_CLASSES,
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
  console.log('🧪 Starting Phase 7: Field Verification & Inspection Engine Test Suite');
  console.log('===============================================================\n');

  await connectDB();

  const adminEmail = ENV.ADMIN_INITIAL_EMAIL;
  const adminPassword = ENV.ADMIN_INITIAL_PASSWORD;

  let superAdminToken = '';
  let businessUser1Token = '';
  let businessUser2Token = '';
  let officer1Token = '';
  let officer2Token = '';
  let fvoToken = '';

  let user1 = null;
  let user2 = null;
  let officer1 = null;
  let officer2 = null;
  let fvoUser = null;

  let stakeholder1 = null;
  let stakeholder2 = null;

  let instrument1 = null;
  let instrument2 = null;
  let instrument3 = null;

  let appScheduled1 = null;
  let appScheduled2 = null;
  let appDraft = null;
  let appSubmitted = null;

  let center1 = null;

  let scheduleActive1 = null;
  let scheduleActive2 = null;
  let scheduleCancelled = null;
  let scheduleCompleted = null;

  let inspectionPrimary = null;
  let inspectionSecondary = null;

  try {
    // -------------------------------------------------------------
    // Setup 0: Authenticate & Provision Test Entities
    // -------------------------------------------------------------
    // 1. Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    superAdminToken = adminLoginData.data?.token;

    // 2. Provision / Login Officer 1 (LMO)
    officer1 = await User.findOne({ email: 'phase7_lmo1@doca.gov.in' });
    if (!officer1) {
      officer1 = new User({
        name: 'Phase 7 Inspector Deshmukh',
        email: 'phase7_lmo1@doca.gov.in',
        phone: '9822334455',
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
      body: JSON.stringify({ email: 'phase7_lmo1@doca.gov.in', password: 'Inspector@123' }),
    });
    const off1LoginData = await off1LoginRes.json();
    officer1Token = off1LoginData.data?.token;

    // 3. Provision / Login Officer 2 (LMO) - Unassigned to primary schedule
    officer2 = await User.findOne({ email: 'phase7_lmo2@doca.gov.in' });
    if (!officer2) {
      officer2 = new User({
        name: 'Phase 7 Inspector Kulkarni',
        email: 'phase7_lmo2@doca.gov.in',
        phone: '9822334456',
        role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
        designation: 'Legal Metrology Officer',
        jurisdiction: { state: 'Maharashtra', district: 'Pune', zone: 'East' },
        isActive: true,
      });
      officer2.password = 'Inspector@123';
      await officer2.save();
    }
    const off2LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase7_lmo2@doca.gov.in', password: 'Inspector@123' }),
    });
    const off2LoginData = await off2LoginRes.json();
    officer2Token = off2LoginData.data?.token;

    // 4. Provision / Login Field Verification Officer (FVO)
    fvoUser = await User.findOne({ email: 'phase7_fvo@doca.gov.in' });
    if (!fvoUser) {
      fvoUser = new User({
        name: 'Phase 7 Field Assistant Patil',
        email: 'phase7_fvo@doca.gov.in',
        phone: '9822334457',
        role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
        designation: 'Field Verification Officer',
        jurisdiction: { state: 'Maharashtra', district: 'Mumbai', zone: 'South' },
        isActive: true,
      });
      fvoUser.password = 'Assistant@123';
      await fvoUser.save();
    }
    const fvoLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase7_fvo@doca.gov.in', password: 'Assistant@123' }),
    });
    const fvoLoginData = await fvoLoginRes.json();
    fvoToken = fvoLoginData.data?.token;

    // 5. Provision / Login Business User 1 (Trader 1)
    user1 = await User.findOne({ email: 'phase7_trader1@apexweigh.com' });
    if (!user1) {
      user1 = new User({
        name: 'Trader Rajesh Mehta',
        email: 'phase7_trader1@apexweigh.com',
        phone: '9822334460',
        role: USER_ROLES.BUSINESS_USER,
        isActive: true,
      });
      user1.password = 'Trader@123';
      await user1.save();
    }
    const bu1LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase7_trader1@apexweigh.com', password: 'Trader@123' }),
    });
    const bu1LoginData = await bu1LoginRes.json();
    businessUser1Token = bu1LoginData.data?.token;

    // 6. Provision / Login Business User 2 (Trader 2)
    user2 = await User.findOne({ email: 'phase7_trader2@globalscales.com' });
    if (!user2) {
      user2 = new User({
        name: 'Trader Sunita Rao',
        email: 'phase7_trader2@globalscales.com',
        phone: '9822334461',
        role: USER_ROLES.BUSINESS_USER,
        isActive: true,
      });
      user2.password = 'Trader@123';
      await user2.save();
    }
    const bu2LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase7_trader2@globalscales.com', password: 'Trader@123' }),
    });
    const bu2LoginData = await bu2LoginRes.json();
    businessUser2Token = bu2LoginData.data?.token;

    // Stakeholders
    stakeholder1 = await Stakeholder.findOne({ user: user1._id });
    if (!stakeholder1) {
      stakeholder1 = await Stakeholder.create({
        user: user1._id,
        businessName: 'Apex Weighing Systems Ltd',
        tradeLicenseNumber: 'TRD-P7-001',
        businessType: 'MANUFACTURER',
        constitution: 'PRIVATE_LIMITED',
        category: 'MANUFACTURER',
        contactPerson: { name: 'Rajesh Mehta', email: user1.email, phone: user1.phone },
        registeredAddress: {
          street: 'Plot 101 MIDC Andheri',
          city: 'Mumbai',
          district: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400093',
          pincode: '400093',
        },
        gstin: '27AAAAA0000A1Z5',
        kycStatus: 'VERIFIED',
      });
    }

    stakeholder2 = await Stakeholder.findOne({ user: user2._id });
    if (!stakeholder2) {
      stakeholder2 = await Stakeholder.create({
        user: user2._id,
        businessName: 'Global Scales & Meters Pvt Ltd',
        tradeLicenseNumber: 'TRD-P7-002',
        businessType: 'DEALER',
        constitution: 'PRIVATE_LIMITED',
        category: 'DEALER',
        contactPerson: { name: 'Sunita Rao', email: user2.email, phone: user2.phone },
        registeredAddress: {
          street: 'Sector 15 Vashi',
          city: 'Navi Mumbai',
          district: 'Thane',
          state: 'Maharashtra',
          postalCode: '400703',
          pincode: '400703',
        },
        gstin: '27BBBBB1111B2Z6',
        kycStatus: 'VERIFIED',
      });
    }

    // Verification Center
    center1 = await VerificationCenter.findOne({ code: 'P7-DLM-MUM' });
    if (!center1) {
      center1 = await VerificationCenter.create({
        code: 'P7-DLM-MUM',
        name: 'Mumbai Central Metrological Lab',
        type: 'DISTRICT_LEGAL_METROLOGY_LAB',
        jurisdiction: { state: 'Maharashtra', district: 'Mumbai' },
        address: 'Old Customs House, Mumbai',
        capacityPerDay: 20,
        isActive: true,
      });
    }

    // Instruments
    instrument1 = await Instrument.findOne({ serialNumber: 'SN-P7-TEST-001' });
    if (!instrument1) {
      instrument1 = await Instrument.create({
        instrumentId: `LM-P7-${Math.floor(Math.random() * 900000 + 100000)}`,
        stakeholder: stakeholder1._id,
        category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
        instrumentType: 'BENCH_SCALE',
        manufacturer: 'Apex Scales',
        modelNumber: 'AS-5000',
        serialNumber: 'SN-P7-TEST-001',
        capacity: { value: 15, unit: 'kg' },
        accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
        verificationScaleInterval_e: '5g',
        verificationIntervalMonths: 12,
        status: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
        installationAddress: {
          premiseName: 'Plot 101 MIDC',
          addressLine: 'Plot 101 MIDC Andheri',
          city: 'Mumbai',
          state: 'Maharashtra',
          district: 'Mumbai',
          pincode: '400093',
        },
        createdBy: user1._id,
        isActive: true,
      });
    }

    instrument2 = await Instrument.findOne({ serialNumber: 'SN-P7-TEST-002' });
    if (!instrument2) {
      instrument2 = await Instrument.create({
        instrumentId: `LM-P7-${Math.floor(Math.random() * 900000 + 100000)}`,
        stakeholder: stakeholder1._id,
        category: INSTRUMENT_CATEGORIES.FUEL_DISPENSER,
        instrumentType: 'ELECTRONIC_DISPENSER',
        manufacturer: 'PetroFlow Tech',
        modelNumber: 'PF-200',
        serialNumber: 'SN-P7-TEST-002',
        capacity: { value: 100, unit: 'L' },
        accuracyClass: ACCURACY_CLASSES.CLASS_II_HIGH,
        verificationScaleInterval_e: '10mL',
        verificationIntervalMonths: 12,
        status: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
        installationAddress: {
          premiseName: 'Fuel Outlet Andheri',
          addressLine: 'Plot 101 MIDC Andheri',
          city: 'Mumbai',
          state: 'Maharashtra',
          district: 'Mumbai',
          pincode: '400093',
        },
        createdBy: user1._id,
        isActive: true,
      });
    }

    instrument3 = await Instrument.findOne({ serialNumber: 'SN-P7-TEST-003' });
    if (!instrument3) {
      instrument3 = await Instrument.create({
        instrumentId: `LM-P7-${Math.floor(Math.random() * 900000 + 100000)}`,
        stakeholder: stakeholder2._id,
        category: INSTRUMENT_CATEGORIES.COUNTER_SCALE,
        instrumentType: 'COUNTER_SCALE',
        manufacturer: 'National Scales',
        modelNumber: 'NS-10',
        serialNumber: 'SN-P7-TEST-003',
        capacity: { value: 10, unit: 'kg' },
        accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
        verificationScaleInterval_e: '2g',
        verificationIntervalMonths: 12,
        status: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
        installationAddress: {
          premiseName: 'Vashi Market',
          addressLine: 'Sector 15 Vashi',
          city: 'Navi Mumbai',
          state: 'Maharashtra',
          district: 'Thane',
          pincode: '400703',
        },
        createdBy: user2._id,
        isActive: true,
      });
    }

    // Clean up old Phase 7 test schedules, inspections, and results to keep fresh state
    await VerificationSchedule.deleteMany({
      scheduleNumber: { $regex: /^SCH-P7-/ },
    });
    await VerificationInspection.deleteMany({
      inspectionNumber: { $regex: /P7/ },
    });
    await VerificationResult.deleteMany({
      remarks: { $regex: /P7/ },
    });

    // Application 1: SCHEDULED
    appScheduled1 = await VerificationApplication.findOne({ applicationNumber: 'APP-P7-TEST-001' });
    if (!appScheduled1) {
      appScheduled1 = new VerificationApplication({
        applicationNumber: 'APP-P7-TEST-001',
        stakeholder: stakeholder1._id,
        instrument: instrument1._id,
        applicationType: 'NEW_VERIFICATION',
        currentStatus: APPLICATION_STATUSES.SCHEDULED,
        assignedLMO: officer1._id,
        preferredVerificationDate: new Date(Date.now() + 86400000),
        statusHistory: [
          { fromStatus: APPLICATION_STATUSES.DRAFT, toStatus: APPLICATION_STATUSES.SUBMITTED, changedBy: user1._id },
          { fromStatus: APPLICATION_STATUSES.SUBMITTED, toStatus: APPLICATION_STATUSES.APPROVED, changedBy: officer1._id },
          { fromStatus: APPLICATION_STATUSES.APPROVED, toStatus: APPLICATION_STATUSES.SCHEDULED, changedBy: officer1._id },
        ],
      });
      await appScheduled1.save();
    } else {
      appScheduled1.currentStatus = APPLICATION_STATUSES.SCHEDULED;
      await appScheduled1.save();
    }

    // Application 2: SCHEDULED
    appScheduled2 = await VerificationApplication.findOne({ applicationNumber: 'APP-P7-TEST-002' });
    if (!appScheduled2) {
      appScheduled2 = new VerificationApplication({
        applicationNumber: 'APP-P7-TEST-002',
        stakeholder: stakeholder1._id,
        instrument: instrument2._id,
        applicationType: 'RE_VERIFICATION',
        currentStatus: APPLICATION_STATUSES.SCHEDULED,
        assignedLMO: officer1._id,
        preferredVerificationDate: new Date(Date.now() + 86400000),
      });
      await appScheduled2.save();
    } else {
      appScheduled2.currentStatus = APPLICATION_STATUSES.SCHEDULED;
      await appScheduled2.save();
    }

    // Application Draft
    appDraft = await VerificationApplication.findOne({ applicationNumber: 'APP-P7-TEST-DRAFT' });
    if (!appDraft) {
      appDraft = new VerificationApplication({
        applicationNumber: 'APP-P7-TEST-DRAFT',
        stakeholder: stakeholder1._id,
        instrument: instrument1._id,
        applicationType: 'NEW_VERIFICATION',
        currentStatus: APPLICATION_STATUSES.DRAFT,
      });
      await appDraft.save();
    }

    // Application Submitted
    appSubmitted = await VerificationApplication.findOne({ applicationNumber: 'APP-P7-TEST-SUBMIT' });
    if (!appSubmitted) {
      appSubmitted = new VerificationApplication({
        applicationNumber: 'APP-P7-TEST-SUBMIT',
        stakeholder: stakeholder1._id,
        instrument: instrument1._id,
        applicationType: 'NEW_VERIFICATION',
        currentStatus: APPLICATION_STATUSES.SUBMITTED,
      });
      await appSubmitted.save();
    }

    // Application Cancelled
    let appCancelled = await VerificationApplication.findOne({ applicationNumber: 'APP-P7-TEST-CANCEL' });
    if (!appCancelled) {
      appCancelled = await VerificationApplication.create({
        applicationNumber: 'APP-P7-TEST-CANCEL',
        stakeholder: stakeholder1._id,
        instrument: instrument1._id,
        applicationType: 'NEW_VERIFICATION',
        currentStatus: APPLICATION_STATUSES.SCHEDULED,
      });
    }

    // Application Completed
    let appCompleted = await VerificationApplication.findOne({ applicationNumber: 'APP-P7-TEST-COMPL' });
    if (!appCompleted) {
      appCompleted = await VerificationApplication.create({
        applicationNumber: 'APP-P7-TEST-COMPL',
        stakeholder: stakeholder1._id,
        instrument: instrument1._id,
        applicationType: 'NEW_VERIFICATION',
        currentStatus: APPLICATION_STATUSES.SCHEDULED,
      });
    }

    // Clean up any existing schedules, inspections, and results for these test applications to respect unique application index
    await VerificationSchedule.deleteMany({
      application: { $in: [appScheduled1._id, appScheduled2._id, appCancelled._id, appCompleted._id] },
    });
    await VerificationInspection.deleteMany({
      application: { $in: [appScheduled1._id, appScheduled2._id, appCancelled._id, appCompleted._id] },
    });
    await VerificationResult.deleteMany({
      application: { $in: [appScheduled1._id, appScheduled2._id, appCancelled._id, appCompleted._id] },
    });

    // Schedule 1: Assigned to Officer 1
    scheduleActive1 = await VerificationSchedule.findOne({ scheduleNumber: 'SCH-P7-TEST-001' });
    if (!scheduleActive1) {
      scheduleActive1 = new VerificationSchedule({
        scheduleNumber: 'SCH-P7-TEST-001',
        application: appScheduled1._id,
        instrument: instrument1._id,
        stakeholder: stakeholder1._id,
        assignedOfficer: officer1._id,
        verificationCenter: center1._id,
        scheduledDate: new Date(Date.now() + 86400000),
        timeSlot: '10:00 - 11:30',
        startTime: '10:00',
        endTime: '11:30',
        locationType: 'DISTRICT_LABORATORY',
        locationAddress: 'Old Customs House, Mumbai',
        status: SCHEDULE_STATUSES.SCHEDULED,
        createdBy: officer1._id,
      });
      await scheduleActive1.save();
    } else {
      scheduleActive1.status = SCHEDULE_STATUSES.SCHEDULED;
      await scheduleActive1.save();
    }

    // Schedule 2: Assigned to Officer 1
    scheduleActive2 = await VerificationSchedule.findOne({ scheduleNumber: 'SCH-P7-TEST-002' });
    if (!scheduleActive2) {
      scheduleActive2 = new VerificationSchedule({
        scheduleNumber: 'SCH-P7-TEST-002',
        application: appScheduled2._id,
        instrument: instrument2._id,
        stakeholder: stakeholder1._id,
        assignedOfficer: officer1._id,
        verificationCenter: center1._id,
        scheduledDate: new Date(Date.now() + 86400000),
        timeSlot: '12:00 - 13:30',
        startTime: '12:00',
        endTime: '13:30',
        locationType: 'ON_SITE_PREMISES',
        locationAddress: 'Plot 101 MIDC Andheri, Mumbai',
        status: SCHEDULE_STATUSES.SCHEDULED,
        createdBy: officer1._id,
      });
      await scheduleActive2.save();
    } else {
      scheduleActive2.status = SCHEDULE_STATUSES.SCHEDULED;
      await scheduleActive2.save();
    }

    // Cancelled Schedule
    scheduleCancelled = await VerificationSchedule.findOne({ scheduleNumber: 'SCH-P7-CANCELLED' });
    if (!scheduleCancelled) {
      scheduleCancelled = new VerificationSchedule({
        scheduleNumber: 'SCH-P7-CANCELLED',
        application: appCancelled._id,
        instrument: instrument1._id,
        stakeholder: stakeholder1._id,
        assignedOfficer: officer1._id,
        scheduledDate: new Date(),
        timeSlot: '14:00 - 15:00',
        startTime: '14:00',
        endTime: '15:00',
        locationAddress: 'Old Customs House, Mumbai',
        status: SCHEDULE_STATUSES.CANCELLED,
        cancellationReason: 'Cancelled by applicant',
        createdBy: officer1._id,
      });
      await scheduleCancelled.save();
    }

    // Completed Schedule
    scheduleCompleted = await VerificationSchedule.findOne({ scheduleNumber: 'SCH-P7-COMPLETED' });
    if (!scheduleCompleted) {
      scheduleCompleted = new VerificationSchedule({
        scheduleNumber: 'SCH-P7-COMPLETED',
        application: appCompleted._id,
        instrument: instrument1._id,
        stakeholder: stakeholder1._id,
        assignedOfficer: officer1._id,
        scheduledDate: new Date(),
        timeSlot: '15:00 - 16:00',
        startTime: '15:00',
        endTime: '16:00',
        locationAddress: 'Old Customs House, Mumbai',
        status: SCHEDULE_STATUSES.COMPLETED,
        createdBy: officer1._id,
      });
      await scheduleCompleted.save();
    }

    console.log('✅ Setup completed: Test entities authenticated and verified.\n');

    // =========================================================================
    // SECTION 1: Inspection Start & Schedule Integration (Tests 1 - 10)
    // =========================================================================

    // Test 1: Assigned Officer can start inspection for an active SCHEDULED schedule
    const startRes1 = await fetch(`${BASE_URL}/api/inspections/${scheduleActive1._id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    const startData1 = await startRes1.json();
    inspectionPrimary = startData1.data;
    recordTest(
      1,
      'Assigned Officer can start inspection for active schedule (201 Created)',
      startRes1.status === 201 &&
        inspectionPrimary?.inspectionStatus === INSPECTION_STATUSES.IN_PROGRESS &&
        Boolean(inspectionPrimary?.inspectionNumber) &&
        Boolean(inspectionPrimary?.startTime),
      `Status: ${startRes1.status}, InspNumber: ${inspectionPrimary?.inspectionNumber}`
    );

    // Test 2: Inspection start moves application to INSPECTION state in real MongoDB
    const appAfterStart = await VerificationApplication.findById(appScheduled1._id);
    recordTest(
      2,
      'Inspection start transitions Application to INSPECTION in MongoDB',
      appAfterStart.currentStatus === APPLICATION_STATUSES.INSPECTION &&
        appAfterStart.statusHistory.some((h) => h.toStatus === APPLICATION_STATUSES.INSPECTION),
      `Application Status: ${appAfterStart.currentStatus}`
    );

    // Test 3: Inspection start moves schedule to IN_PROGRESS state in real MongoDB
    const schAfterStart = await VerificationSchedule.findById(scheduleActive1._id);
    recordTest(
      3,
      'Inspection start transitions Schedule to IN_PROGRESS in MongoDB',
      schAfterStart.status === SCHEDULE_STATUSES.IN_PROGRESS,
      `Schedule Status: ${schAfterStart.status}`
    );

    // Test 4: Cannot start inspection for a CANCELLED schedule -> 400
    const cancelStartRes = await fetch(`${BASE_URL}/api/inspections/${scheduleCancelled._id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    recordTest(
      4,
      'Cannot start inspection on CANCELLED schedule (returns 400)',
      cancelStartRes.status === 400,
      `Status: ${cancelStartRes.status}`
    );

    // Test 5: Cannot start inspection for an already COMPLETED schedule -> 400
    const compStartRes = await fetch(`${BASE_URL}/api/inspections/${scheduleCompleted._id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    recordTest(
      5,
      'Cannot start inspection on COMPLETED schedule (returns 400)',
      compStartRes.status === 400,
      `Status: ${compStartRes.status}`
    );

    // Test 6: Cannot start inspection if application is in DRAFT status -> 400
    const tempDraftSch = new VerificationSchedule({
      scheduleNumber: 'SCH-P7-DRAFT-APP',
      application: appDraft._id,
      instrument: instrument1._id,
      stakeholder: stakeholder1._id,
      assignedOfficer: officer1._id,
      scheduledDate: new Date(),
      locationAddress: 'Old Customs House, Mumbai',
      status: SCHEDULE_STATUSES.SCHEDULED,
      createdBy: officer1._id,
    });
    await tempDraftSch.save();
    const draftAppStartRes = await fetch(`${BASE_URL}/api/inspections/${tempDraftSch._id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    recordTest(
      6,
      'Cannot start inspection for DRAFT application (returns 400)',
      draftAppStartRes.status === 400,
      `Status: ${draftAppStartRes.status}`
    );

    // Test 7: Cannot start inspection if application is in SUBMITTED (not approved) -> 400
    const tempSubSch = new VerificationSchedule({
      scheduleNumber: 'SCH-P7-SUB-APP',
      application: appSubmitted._id,
      instrument: instrument1._id,
      stakeholder: stakeholder1._id,
      assignedOfficer: officer1._id,
      scheduledDate: new Date(),
      locationAddress: 'Old Customs House, Mumbai',
      status: SCHEDULE_STATUSES.SCHEDULED,
      createdBy: officer1._id,
    });
    await tempSubSch.save();
    const subAppStartRes = await fetch(`${BASE_URL}/api/inspections/${tempSubSch._id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    recordTest(
      7,
      'Cannot start inspection for unapproved SUBMITTED application (returns 400)',
      subAppStartRes.status === 400,
      `Status: ${subAppStartRes.status}`
    );

    // Clean up temporary test schedules
    await VerificationSchedule.findByIdAndDelete(tempDraftSch._id);
    await VerificationSchedule.findByIdAndDelete(tempSubSch._id);

    // Test 8: Unauthorized officer (not assigned to this schedule and not admin) cannot start inspection -> 403
    const unauthOfficerStartRes = await fetch(`${BASE_URL}/api/inspections/${scheduleActive2._id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer2Token}`, // Officer 2 is not assigned to schedule 2
      },
    });
    recordTest(
      8,
      'Unassigned officer cannot start inspection on another officer schedule (returns 403)',
      unauthOfficerStartRes.status === 403,
      `Status: ${unauthOfficerStartRes.status}`
    );

    // Test 9: BUSINESS_USER cannot start inspection -> 403
    const traderStartRes = await fetch(`${BASE_URL}/api/inspections/${scheduleActive2._id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${businessUser1Token}`,
      },
    });
    recordTest(
      9,
      'Business User cannot start official inspection (returns 403)',
      traderStartRes.status === 403,
      `Status: ${traderStartRes.status}`
    );

    // Test 10: Cannot start duplicate active inspection for the same schedule -> 409 Conflict
    const dupStartRes = await fetch(`${BASE_URL}/api/inspections/${scheduleActive1._id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    recordTest(
      10,
      'Duplicate active inspection start attempt returns 409 Conflict',
      dupStartRes.status === 409,
      `Status: ${dupStartRes.status}`
    );

    // =========================================================================
    // SECTION 2: Inspection Draft & Structured Data Entry (Tests 11 - 20)
    // =========================================================================

    // Test 11: Assigned officer can save inspection draft with observations
    const draftPayload = {
      observations: 'Standard working weights inspected. No physical defects observed on load cell plate.',
      inspectorRemarks: 'Preliminary metrological visual check completed.',
      location: 'Mumbai Central Metrological Laboratory Room 4',
      latitude: 18.922,
      longitude: 72.834,
      instrumentCondition: {
        visualCheckPassed: true,
        levelingBubbleCentered: true,
        modelApprovalPlateIntact: true,
        zeroTrackingOperational: true,
        notes: 'Spirit level bubble perfectly centered within ring marker',
      },
    };
    const draftRes1 = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify(draftPayload),
    });
    const draftData1 = await draftRes1.json();
    recordTest(
      11,
      'Assigned officer can save inspection draft with observations (returns 200)',
      draftRes1.status === 200 &&
        draftData1.data?.observations?.includes('Standard working weights inspected') &&
        draftData1.data?.instrumentCondition?.levelingBubbleCentered === true,
      `Status: ${draftRes1.status}`
    );

    // Test 12: Assigned officer can record structured instrumentReadings with auto-computed deviation
    const readingsPayload = {
      instrumentReadings: [
        {
          testName: 'Zero Tare Repeatability',
          standardValue: 0.0,
          observedValue: 0.0,
          unit: 'kg',
          tolerance: 0.002,
          result: 'PASS',
        },
        {
          testName: 'Linearity Test - Mid Load',
          standardValue: 5.0,
          observedValue: 5.001,
          unit: 'kg',
          tolerance: 0.005,
          result: 'PASS',
        },
        {
          testName: 'Linearity Test - Max Load',
          standardValue: 15.0,
          observedValue: 15.002,
          unit: 'kg',
          tolerance: 0.005,
          result: 'PASS',
        },
      ],
    };
    const readingsRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify(readingsPayload),
    });
    const readingsData = await readingsRes.json();
    const midLoadReading = readingsData.data?.instrumentReadings?.find((r) => r.standardValue === 5.0);
    recordTest(
      12,
      'Assigned officer can record structured instrumentReadings with auto-computed deviation',
      readingsRes.status === 200 &&
        readingsData.data?.instrumentReadings?.length === 3 &&
        midLoadReading?.deviation !== undefined &&
        Math.abs(midLoadReading.deviation - 0.001) < 0.0001,
      `Deviation: ${midLoadReading?.deviation}, Count: ${readingsData.data?.instrumentReadings?.length}`
    );

    // Test 13: Assigned officer can record accuracyChecks and complianceChecks
    const checksPayload = {
      accuracyChecks: [
        {
          checkName: 'Eccentricity Corner Test 1',
          expectedValue: 5.0,
          observedValue: 5.001,
          tolerance: 0.005,
          status: 'PASS',
        },
        {
          checkName: 'Eccentricity Corner Test 2',
          expectedValue: 5.0,
          observedValue: 5.0,
          tolerance: 0.005,
          status: 'PASS',
        },
      ],
      complianceChecks: [
        { checkName: 'Statutory Verification Mark Stamp Presence', status: 'PASS' },
        { checkName: 'Security Sealing Wire Hole Alignment', status: 'PASS' },
      ],
    };
    const checksRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify(checksPayload),
    });
    const checksData = await checksRes.json();
    recordTest(
      13,
      'Assigned officer can record accuracyChecks and statutory complianceChecks',
      checksRes.status === 200 &&
        checksData.data?.accuracyChecks?.length === 2 &&
        checksData.data?.complianceChecks?.length === 2,
      `Accuracy checks: ${checksData.data?.accuracyChecks?.length}, Compliance checks: ${checksData.data?.complianceChecks?.length}`
    );

    // Test 14: Assigned officer can record identified defects with severity & correctiveAction
    const defectsPayload = {
      defects: [
        {
          defectType: 'LABEL_OBSCURITY',
          severity: 'LOW',
          description: 'Manufacturer stamping plate has minor surface scratch near corner',
          relatedRequirement: 'Legal Metrology (General) Rules, Schedule VI',
          correctiveAction: 'Clean and seal plate with transparent protective laminate',
          status: 'IDENTIFIED',
        },
      ],
    };
    const defectsRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify(defectsPayload),
    });
    const defectsData = await defectsRes.json();
    recordTest(
      14,
      'Assigned officer can record defects with severity and corrective action',
      defectsRes.status === 200 &&
        defectsData.data?.defects?.[0]?.severity === 'LOW' &&
        defectsData.data?.defects?.[0]?.status === 'IDENTIFIED',
      `Defect: ${defectsData.data?.defects?.[0]?.defectType}`
    );

    // Test 15: Assigned officer can record stampingAndSealing details
    const sealingPayload = {
      stampingAndSealing: {
        leadSealsApplied: 2,
        hologramStickerNumber: 'MH-DOCA-2026-99128',
        stampingYearMark: '2026-Q1',
        sealingPlugsIntact: true,
      },
    };
    const sealingRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify(sealingPayload),
    });
    const sealingData = await sealingRes.json();
    recordTest(
      15,
      'Assigned officer can record statutory stampingAndSealing details',
      sealingRes.status === 200 &&
        sealingData.data?.stampingAndSealing?.hologramStickerNumber === 'MH-DOCA-2026-99128' &&
        sealingData.data?.stampingAndSealing?.leadSealsApplied === 2,
      `Hologram: ${sealingData.data?.stampingAndSealing?.hologramStickerNumber}`
    );

    // Test 16: Invalid latitude (> 90) in draft is rejected -> 400
    const invLatRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify({ latitude: 125.5 }),
    });
    recordTest(
      16,
      'Invalid latitude (> 90) is rejected (returns 400)',
      invLatRes.status === 400,
      `Status: ${invLatRes.status}`
    );

    // Test 17: Invalid longitude (< -180) in draft is rejected -> 400
    const invLonRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify({ longitude: -210.0 }),
    });
    recordTest(
      17,
      'Invalid longitude (< -180) is rejected (returns 400)',
      invLonRes.status === 400,
      `Status: ${invLonRes.status}`
    );

    // Test 18: Unassigned officer cannot update draft inspection -> 403
    const unauthDraftRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer2Token}`, // Officer 2 is unassigned
      },
      body: JSON.stringify({ observations: 'Attempted modification by unassigned officer' }),
    });
    recordTest(
      18,
      'Unassigned officer cannot update draft inspection (returns 403)',
      unauthDraftRes.status === 403,
      `Status: ${unauthDraftRes.status}`
    );

    // Test 19: BUSINESS_USER cannot update draft inspection -> 403
    const traderDraftRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${businessUser1Token}`,
      },
      body: JSON.stringify({ observations: 'Trader attempt to forge inspection findings' }),
    });
    recordTest(
      19,
      'Business User cannot update draft inspection (returns 403)',
      traderDraftRes.status === 403,
      `Status: ${traderDraftRes.status}`
    );

    // Test 20: Missing JWT authentication on draft update returns 401
    const noAuthDraftRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observations: 'Anonymous update' }),
    });
    recordTest(
      20,
      'Missing JWT authentication on draft update returns 401',
      noAuthDraftRes.status === 401,
      `Status: ${noAuthDraftRes.status}`
    );

    // =========================================================================
    // SECTION 3: Evidence & Media Upload (Tests 21 - 24)
    // =========================================================================

    // Test 21: Assigned officer can upload photo/evidence file for an inspection -> 201 Created
    const formData = new FormData();
    const mockFileBlob = new Blob(['PNG_TEST_BINARY_STREAM_LEGAL_METROLOGY_EVIDENCE'], { type: 'image/png' });
    formData.append('file', mockFileBlob, 'scale_verification_seal.png');
    formData.append('caption', 'Field Verification Stamp and Load Cell Close-up');

    const uploadRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/evidence`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${officer1Token}`,
      },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    recordTest(
      21,
      'Assigned officer can upload photo evidence (201 Created)',
      uploadRes.status === 201 && Boolean(uploadData.data?.fileUrl),
      `Status: ${uploadRes.status}, File: ${uploadData.data?.fileUrl}`
    );

    // Test 22: Evidence metadata is saved in inspection record in MongoDB
    const inspWithPhoto = await VerificationInspection.findById(inspectionPrimary._id);
    recordTest(
      22,
      'Evidence metadata is persisted in MongoDB inspection record',
      inspWithPhoto.photographs?.length >= 1 &&
        inspWithPhoto.photographs[0]?.caption === 'Field Verification Stamp and Load Cell Close-up',
      `Persisted Photographs: ${inspWithPhoto.photographs?.length}`
    );

    // Test 23: BUSINESS_USER cannot upload official inspection evidence -> 403
    const traderUploadRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/evidence`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${businessUser1Token}`,
      },
      body: formData,
    });
    recordTest(
      23,
      'Business User cannot upload official inspection evidence (returns 403)',
      traderUploadRes.status === 403,
      `Status: ${traderUploadRes.status}`
    );

    // Test 24: Unassigned officer cannot upload evidence -> 403
    const unauthUploadRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/evidence`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${officer2Token}`,
      },
      body: formData,
    });
    recordTest(
      24,
      'Unassigned officer cannot upload evidence to this inspection (returns 403)',
      unauthUploadRes.status === 403,
      `Status: ${unauthUploadRes.status}`
    );

    // =========================================================================
    // SECTION 4: Inspection Submission (Tests 25 - 29)
    // =========================================================================

    // Start a fresh secondary inspection to test empty submission validation
    const startSecRes = await fetch(`${BASE_URL}/api/inspections/${scheduleActive2._id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    const startSecData = await startSecRes.json();
    inspectionSecondary = startSecData.data;

    // Test 25: Submitting completely empty inspection (no observations, readings, or checks) -> 400
    const emptySubRes = await fetch(`${BASE_URL}/api/inspections/${inspectionSecondary._id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    recordTest(
      25,
      'Submitting empty inspection without readings or observations is rejected (returns 400)',
      emptySubRes.status === 400,
      `Status: ${emptySubRes.status}`
    );

    // Test 26: Assigned officer can submit inspection with completed readings -> 200, status becomes SUBMITTED
    const submitPrimaryRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    const submitPrimaryData = await submitPrimaryRes.json();
    recordTest(
      26,
      'Assigned officer can submit inspection with completed data (status: SUBMITTED)',
      submitPrimaryRes.status === 200 &&
        submitPrimaryData.data?.inspectionStatus === INSPECTION_STATUSES.SUBMITTED &&
        Boolean(submitPrimaryData.data?.submittedAt),
      `Status: ${submitPrimaryRes.status}, InspectionStatus: ${submitPrimaryData.data?.inspectionStatus}`
    );

    // Test 27: Submitting an already SUBMITTED inspection is rejected -> 400
    const reSubmitRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });
    recordTest(
      27,
      'Submitting already SUBMITTED inspection returns 400 Bad Request',
      reSubmitRes.status === 400,
      `Status: ${reSubmitRes.status}`
    );

    // Test 28: BUSINESS_USER cannot submit inspection -> 403
    const traderSubRes = await fetch(`${BASE_URL}/api/inspections/${inspectionSecondary._id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${businessUser1Token}`,
      },
    });
    recordTest(
      28,
      'Business User cannot submit inspection record (returns 403)',
      traderSubRes.status === 403,
      `Status: ${traderSubRes.status}`
    );

    // Test 29: Unassigned officer cannot submit inspection -> 403
    const unauthSubRes = await fetch(`${BASE_URL}/api/inspections/${inspectionSecondary._id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer2Token}`,
      },
    });
    recordTest(
      29,
      'Unassigned officer cannot submit inspection record (returns 403)',
      unauthSubRes.status === 403,
      `Status: ${unauthSubRes.status}`
    );

    // =========================================================================
    // SECTION 5: Finalization & Statutory Verification Verdict (Tests 30 - 38)
    // =========================================================================

    // Add readings to secondary inspection so it can be submitted and tested for failure verdict
    await fetch(`${BASE_URL}/api/inspections/${inspectionSecondary._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify({
        observations: 'Fuel dispenser test indicates intrinsic error exceeds statutory MPE tolerance (+12mL vs allowable +5mL)',
        instrumentReadings: [
          {
            testName: 'Flow rate 50L/min test',
            standardValue: 20.0,
            observedValue: 20.015,
            unit: 'L',
            tolerance: 0.005,
            result: 'FAIL',
          },
        ],
      }),
    });
    await fetch(`${BASE_URL}/api/inspections/${inspectionSecondary._id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
    });

    // Test 30: FIELD_VERIFICATION_OFFICER cannot finalize verification verdict (must be LMO/Admin) -> 403
    const fvoFinalizeRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fvoToken}`,
      },
      body: JSON.stringify({
        result: 'VERIFIED',
        officerRemarks: 'Attempt by FVO to finalize official certificate',
      }),
    });
    recordTest(
      30,
      'FVO cannot finalize verification verdict (requires LMO or Admin) -> returns 403',
      fvoFinalizeRes.status === 403,
      `Status: ${fvoFinalizeRes.status}`
    );

    // Test 31: BUSINESS_USER cannot finalize verification verdict -> 403
    const traderFinalizeRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${businessUser1Token}`,
      },
      body: JSON.stringify({
        result: 'VERIFIED',
      }),
    });
    recordTest(
      31,
      'Business User cannot finalize verification verdict -> returns 403',
      traderFinalizeRes.status === 403,
      `Status: ${traderFinalizeRes.status}`
    );

    // Test 32: Rejection verdict without rejection reason is rejected -> 400
    const noReasonFailRes = await fetch(`${BASE_URL}/api/inspections/${inspectionSecondary._id}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify({
        result: 'REJECTED',
        // missing 'reason'
      }),
    });
    recordTest(
      32,
      'Rejection verdict without explicit rejection reason is rejected -> returns 400',
      noReasonFailRes.status === 400,
      `Status: ${noReasonFailRes.status}`
    );

    // Test 33: Authorized LMO can finalize inspection with REJECTED verdict with reason -> 200
    const failVerdictRes = await fetch(`${BASE_URL}/api/inspections/${inspectionSecondary._id}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify({
        result: 'REJECTED',
        reason: 'Fuel delivery error exceeds Maximum Permissible Error (MPE) under Legal Metrology Rules, Sixth Schedule.',
        officerRemarks: 'Meter requires recalibration and seal replacement by authorized repairer.',
      }),
    });
    const failVerdictData = await failVerdictRes.json();
    recordTest(
      33,
      'Authorized LMO can finalize inspection with REJECTED verdict and reason (returns 200)',
      failVerdictRes.status === 200 &&
        failVerdictData.data?.verdict === 'REJECTED' &&
        failVerdictData.data?.inspection?.inspectionStatus === INSPECTION_STATUSES.FAILED,
      `Verdict: ${failVerdictData.data?.verdict}, InspStatus: ${failVerdictData.data?.inspection?.inspectionStatus}`
    );

    // Test 34: On REJECTED verdict, Application becomes FAILED, Instrument becomes REJECTED, and NO certificate is generated
    const [appFailed, instRejected, failResult] = await Promise.all([
      VerificationApplication.findById(appScheduled2._id),
      Instrument.findById(instrument2._id),
      VerificationResult.findOne({ application: appScheduled2._id }),
    ]);
    recordTest(
      34,
      'On REJECTED verdict, Application is FAILED, Instrument is REJECTED in MongoDB, and NO certificate is issued',
      appFailed.currentStatus === APPLICATION_STATUSES.FAILED &&
        instRejected.status === INSTRUMENT_STATUSES.REJECTED &&
        failResult?.result === VERIFICATION_VERDICTS.FAIL &&
        !failVerdictData.data?.certificate,
      `App: ${appFailed.currentStatus}, Inst: ${instRejected.status}, Result: ${failResult?.result}`
    );

    // Test 35: Authorized LMO can finalize inspection with VERIFIED verdict -> 200
    const passVerdictRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify({
        result: 'VERIFIED',
        officerRemarks: 'All test loads verified within legal tolerances. Hologram sticker applied.',
        complianceInformation: {
          allMpeCompliant: true,
          statutorySealAffixed: true,
        },
      }),
    });
    const passVerdictData = await passVerdictRes.json();
    recordTest(
      35,
      'Authorized LMO can finalize inspection with VERIFIED verdict (returns 200)',
      passVerdictRes.status === 200 &&
        passVerdictData.data?.verdict === 'VERIFIED' &&
        passVerdictData.data?.inspection?.inspectionStatus === INSPECTION_STATUSES.PASSED,
      `Verdict: ${passVerdictData.data?.verdict}, InspStatus: ${passVerdictData.data?.inspection?.inspectionStatus}`
    );

    // Test 36: On VERIFIED verdict, Application becomes VERIFIED / CERTIFICATE_GENERATED, Instrument becomes ACTIVE_VERIFIED, Schedule is COMPLETED
    const [appVerified, instVerified, schCompleted] = await Promise.all([
      VerificationApplication.findById(appScheduled1._id),
      Instrument.findById(instrument1._id),
      VerificationSchedule.findById(scheduleActive1._id),
    ]);
    recordTest(
      36,
      'On VERIFIED verdict, Application is VERIFIED/CERTIFICATE_GENERATED, Instrument is ACTIVE_VERIFIED, Schedule is COMPLETED',
      (appVerified.currentStatus === APPLICATION_STATUSES.VERIFIED ||
        appVerified.currentStatus === APPLICATION_STATUSES.CERTIFICATE_GENERATED) &&
        instVerified.status === INSTRUMENT_STATUSES.ACTIVE_VERIFIED &&
        schCompleted.status === SCHEDULE_STATUSES.COMPLETED,
      `App: ${appVerified.currentStatus}, Inst: ${instVerified.status}, Sch: ${schCompleted.status}`
    );

    // Test 37: On VERIFIED verdict, VerificationResult record is created with result PASS in MongoDB
    const passResult = await VerificationResult.findOne({ application: appScheduled1._id });
    recordTest(
      37,
      'VerificationResult record with result PASS is persisted in MongoDB',
      passResult &&
        passResult.result === VERIFICATION_VERDICTS.PASS &&
        passResult.complianceInformation?.allMpeCompliant === true,
      `Result ID: ${passResult?._id}, Verdict: ${passResult?.result}`
    );

    // Test 38: Cannot re-finalize an already finalized inspection without reopening -> 400
    const reFinalizeRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify({
        result: 'REJECTED',
        reason: 'Attempting to change verdict on finalized record',
      }),
    });
    recordTest(
      38,
      'Cannot re-finalize an already finalized inspection (returns 400)',
      reFinalizeRes.status === 400,
      `Status: ${reFinalizeRes.status}`
    );

    // =========================================================================
    // SECTION 6: Immutability, Reopen, Visibility & Metrics (Tests 39 - 48)
    // =========================================================================

    // Test 39: Finalized inspection is immutable against direct draft updates (PUT rejected) -> 400
    const immutableDraftRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify({ observations: 'Attempted modification after finalization' }),
    });
    recordTest(
      39,
      'Finalized inspection is immutable against direct draft updates (returns 400)',
      immutableDraftRes.status === 400,
      `Status: ${immutableDraftRes.status}`
    );

    // Test 40: Cannot upload evidence to a finalized inspection -> 400
    const immutableUploadRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/evidence`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${officer1Token}`,
      },
      body: formData,
    });
    recordTest(
      40,
      'Cannot upload evidence to a finalized inspection (returns 400)',
      immutableUploadRes.status === 400,
      `Status: ${immutableUploadRes.status}`
    );

    // Test 41: Non-admin (Officer or Trader) cannot reopen finalized inspection -> 403
    const officerReopenRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify({ reason: 'Officer attempting unauthorized reopen' }),
    });
    recordTest(
      41,
      'Field officers cannot reopen finalized inspections (requires Admin) -> returns 403',
      officerReopenRes.status === 403,
      `Status: ${officerReopenRes.status}`
    );

    // Test 42: Reopening requires a justification reason -> 400
    const emptyReasonReopenRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ reason: '' }),
    });
    recordTest(
      42,
      'Administrative reopen requires a justification reason (returns 400)',
      emptyReasonReopenRes.status === 400,
      `Status: ${emptyReasonReopenRes.status}`
    );

    // Test 43: Authorized ADMIN can reopen finalized inspection -> 200, status becomes UNDER_REVIEW
    const adminReopenRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        reason: 'Reopened by Controller of Legal Metrology for re-verification audit check.',
      }),
    });
    const adminReopenData = await adminReopenRes.json();
    recordTest(
      43,
      'Authorized ADMIN can reopen finalized inspection (status becomes UNDER_REVIEW)',
      adminReopenRes.status === 200 &&
        adminReopenData.data?.inspectionStatus === INSPECTION_STATUSES.UNDER_REVIEW,
      `Status: ${adminReopenRes.status}, InspectionStatus: ${adminReopenData.data?.inspectionStatus}`
    );

    // Test 44: BUSINESS_USER can view own inspection details -> 200
    const traderViewOwnRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      headers: {
        Authorization: `Bearer ${businessUser1Token}`,
      },
    });
    const traderViewOwnData = await traderViewOwnRes.json();
    recordTest(
      44,
      'Business User can view own inspection details (returns 200)',
      traderViewOwnRes.status === 200 &&
        Boolean(traderViewOwnData.data?.inspectionNumber),
      `Status: ${traderViewOwnRes.status}`
    );

    // Test 45: BUSINESS_USER cannot view another stakeholder's inspection details -> 403
    const traderViewOtherRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      headers: {
        Authorization: `Bearer ${businessUser2Token}`, // User 2 is from another stakeholder
      },
    });
    recordTest(
      45,
      'Business User cannot view another stakeholder inspection details (returns 403)',
      traderViewOtherRes.status === 403,
      `Status: ${traderViewOtherRes.status}`
    );

    // Test 46: Unassigned officer cannot view another officer's inspection -> 403
    const unauthOfficerGetRes = await fetch(`${BASE_URL}/api/inspections/${inspectionPrimary._id}`, {
      headers: {
        Authorization: `Bearer ${officer2Token}`, // Officer 2 is unassigned
      },
    });
    recordTest(
      46,
      'Unassigned officer cannot view another officer inspection (returns 403)',
      unauthOfficerGetRes.status === 403,
      `Status: ${unauthOfficerGetRes.status}`
    );

    // Test 47: Audit logs are recorded for inspection lifecycle
    const auditLogs = await AuditLog.find({
      entity: 'VerificationInspection',
      entityId: inspectionPrimary._id,
    });
    const hasStartedLog = auditLogs.some((l) => l.action.includes('INSPECTION_STARTED') || l.action.includes('INSPECTION_RECORDED'));
    const hasFinalizedLog = auditLogs.some((l) => l.action.includes('INSPECTION_FINALIZED') || l.action.includes('RESULT'));
    const hasReopenedLog = auditLogs.some((l) => l.action.includes('INSPECTION_REOPENED'));
    recordTest(
      47,
      'Audit logs track full inspection lifecycle (STARTED, FINALIZED, REOPENED)',
      auditLogs.length >= 3 && hasStartedLog && hasFinalizedLog && hasReopenedLog,
      `Total Inspection Audit Logs: ${auditLogs.length}`
    );

    // Test 48: Real Officer Dashboard inspection metrics computed directly from MongoDB
    const metricsRes = await fetch(`${BASE_URL}/api/inspections/dashboard/metrics`, {
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });
    const metricsData = await metricsRes.json();
    recordTest(
      48,
      'Real Officer Dashboard inspection metrics calculated from MongoDB (zero fake values)',
      metricsRes.status === 200 &&
        typeof metricsData.data?.totalInspections === 'number' &&
        metricsData.data?.totalInspections >= 2 &&
        typeof metricsData.data?.completedInspections === 'number',
      `Total: ${metricsData.data?.totalInspections}, Completed: ${metricsData.data?.completedInspections}`
    );

    // Clean up test inspections created during this suite run
    await VerificationInspection.findByIdAndDelete(inspectionPrimary._id);
    await VerificationInspection.findByIdAndDelete(inspectionSecondary._id);

    console.log('\n===============================================================');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`Phase 7 Test Results: ${passedCount}/${results.length} PASSED`);
    if (passedCount === results.length) {
      console.log('🎉 ALL 48 PHASE 7 TEST CRITERIA PASSED WITH ZERO DEFECTS!');
    } else {
      console.log(`⚠️ Some tests failed: ${results.length - passedCount} failures`);
    }
    console.log('===============================================================\n');

    await disconnectDB();
    process.exit(passedCount === results.length ? 0 : 1);
  } catch (error) {
    console.error('💥 Test suite encountered unhandled exception:', error);
    await disconnectDB();
    process.exit(1);
  }
}

runAllTests();
