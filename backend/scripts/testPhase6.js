/**
 * Phase 6: Advanced Scheduling & Allocation Engine - Comprehensive Test Suite
 * Validates real MongoDB operations, statutory conflict detection, capacity limits,
 * role-based access control, calendar events, availability calculations, and audit trails.
 */

import { ENV } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationCenter } from '../models/VerificationCenter.js';
import { GATC } from '../models/GATC.js';
import { AuditLog } from '../models/AuditLog.js';
import {
  USER_ROLES,
  APPLICATION_STATUSES,
  SCHEDULE_STATUSES,
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
  console.log('🧪 Starting Phase 6: Advanced Scheduling & Allocation Test Suite');
  console.log('===============================================================\n');

  await connectDB();

  const adminEmail = ENV.ADMIN_INITIAL_EMAIL;
  const adminPassword = ENV.ADMIN_INITIAL_PASSWORD;

  let superAdminToken = '';
  let businessUser1Token = '';
  let businessUser2Token = '';
  let officerToken = '';
  let fvoToken = '';

  let user1 = null;
  let user2 = null;
  let officer1 = null;
  let officer2 = null;
  let fvoUser = null;
  let inactiveOfficer = null;

  let stakeholder1 = null;
  let stakeholder2 = null;

  let instrument1 = null;
  let instrument2 = null;
  let instrument3 = null;

  let approvedApp1 = null;
  let approvedApp2 = null;
  let submittedApp = null;
  let draftApp = null;

  let center1 = null;
  let inactiveCenter = null;
  let capacityCenter = null;
  let gatc1 = null;
  let inactiveGATC = null;

  let primarySchedule = null;

  try {
    // -------------------------------------------------------------
    // Setup 0: Authenticate & Provision Test Entities
    // -------------------------------------------------------------
    // Login Super Admin
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    superAdminToken = adminLoginData.data?.token;

    // Create / Find Inspecting Officer 1
    officer1 = await User.findOne({ email: 'phase6_lmo1@doca.gov.in' });
    if (!officer1) {
      officer1 = new User({
        name: 'Phase 6 Inspector Sharma',
        email: 'phase6_lmo1@doca.gov.in',
        phone: '9811223344',
        role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
        designation: 'Senior Legal Metrology Officer',
        jurisdiction: { state: 'Delhi', district: 'New Delhi', zone: 'North' },
        isActive: true,
      });
      officer1.password = 'Inspector@123';
      await officer1.save();
    }
    const offLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase6_lmo1@doca.gov.in', password: 'Inspector@123' }),
    });
    const offLoginData = await offLoginRes.json();
    officerToken = offLoginData.data?.token;

    // Create / Find Inspecting Officer 2
    officer2 = await User.findOne({ email: 'phase6_lmo2@doca.gov.in' });
    if (!officer2) {
      officer2 = new User({
        name: 'Phase 6 Inspector Verma',
        email: 'phase6_lmo2@doca.gov.in',
        phone: '9811223345',
        role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
        designation: 'Legal Metrology Officer',
        jurisdiction: { state: 'Delhi', district: 'New Delhi', zone: 'North' },
        isActive: true,
      });
      officer2.password = 'Inspector@123';
      await officer2.save();
    }

    // Create / Find Inactive Officer
    inactiveOfficer = await User.findOne({ email: 'phase6_inactive_lmo@doca.gov.in' });
    if (!inactiveOfficer) {
      inactiveOfficer = new User({
        name: 'Suspended Officer',
        email: 'phase6_inactive_lmo@doca.gov.in',
        phone: '9811223399',
        role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
        isActive: false,
      });
      inactiveOfficer.password = 'Suspended@123';
      await inactiveOfficer.save();
    }

    // Create / Find Field Verification Officer (FVO)
    fvoUser = await User.findOne({ email: 'phase6_fvo@doca.gov.in' });
    if (!fvoUser) {
      fvoUser = new User({
        name: 'Phase 6 Field Officer Rao',
        email: 'phase6_fvo@doca.gov.in',
        phone: '9811223346',
        role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
        designation: 'Field Verification Officer',
        jurisdiction: { state: 'Delhi', district: 'New Delhi' },
        isActive: true,
      });
      fvoUser.password = 'FieldOfficer@123';
      await fvoUser.save();
    }
    const fvoLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase6_fvo@doca.gov.in', password: 'FieldOfficer@123' }),
    });
    const fvoLoginData = await fvoLoginRes.json();
    fvoToken = fvoLoginData.data?.token;

    // Create / Find Business User 1
    user1 = await User.findOne({ email: 'phase6_trader1@example.com' });
    if (!user1) {
      user1 = new User({
        name: 'Phase 6 Trader One',
        email: 'phase6_trader1@example.com',
        phone: '9876543211',
        role: USER_ROLES.BUSINESS_USER,
        isActive: true,
      });
      user1.password = 'Trader@123456';
      await user1.save();
    }
    const u1Login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase6_trader1@example.com', password: 'Trader@123456' }),
    });
    businessUser1Token = (await u1Login.json()).data?.token;

    stakeholder1 = await Stakeholder.findOne({ user: user1._id });
    if (!stakeholder1) {
      stakeholder1 = await Stakeholder.create({
        user: user1._id,
        businessName: 'Phase 6 Precision Instruments Ltd',
        tradeLicenseNumber: 'TRD-P6-001',
        businessType: 'MANUFACTURER',
        constitution: 'PRIVATE_LIMITED',
        category: 'MANUFACTURER',
        contactPerson: {
          name: 'Trader One Manager',
          email: user1.email,
          phone: user1.phone,
        },
        registeredAddress: {
          street: 'Plot 10, Okhla Industrial Area',
          city: 'New Delhi',
          district: 'New Delhi',
          state: 'Delhi',
          postalCode: '110020',
          pincode: '110020',
        },
        gstin: '07AAAAA1234A1Z1',
        kycStatus: 'VERIFIED',
      });
    }

    // Create / Find Business User 2
    user2 = await User.findOne({ email: 'phase6_trader2@example.com' });
    if (!user2) {
      user2 = new User({
        name: 'Phase 6 Trader Two',
        email: 'phase6_trader2@example.com',
        phone: '9876543212',
        role: USER_ROLES.BUSINESS_USER,
        isActive: true,
      });
      user2.password = 'Trader@123456';
      await user2.save();
    }
    const u2Login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase6_trader2@example.com', password: 'Trader@123456' }),
    });
    businessUser2Token = (await u2Login.json()).data?.token;

    stakeholder2 = await Stakeholder.findOne({ user: user2._id });
    if (!stakeholder2) {
      stakeholder2 = await Stakeholder.create({
        user: user2._id,
        businessName: 'Phase 6 Weighing Solutions LLP',
        tradeLicenseNumber: 'TRD-P6-002',
        businessType: 'DEALER',
        constitution: 'PARTNERSHIP',
        category: 'DEALER',
        contactPerson: {
          name: 'Trader Two Partner',
          email: user2.email,
          phone: user2.phone,
        },
        registeredAddress: {
          street: '45 Connaught Place',
          city: 'New Delhi',
          district: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          pincode: '110001',
        },
        gstin: '07BBBBB1234B1Z2',
        kycStatus: 'VERIFIED',
      });
    }

    // Create Instruments
    const randomSerial1 = `P6-INST-${Math.floor(Math.random() * 900000 + 100000)}`;
    instrument1 = await Instrument.create({
      instrumentId: `LM-P6-${Math.floor(Math.random() * 900000 + 100000)}`,
      stakeholder: stakeholder1._id,
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'PRECISION_BALANCE',
      modelNumber: 'PB-Micro-200',
      serialNumber: randomSerial1,
      manufacturer: 'DoCA Certified Scales',
      capacity: { value: 500, unit: 'g' },
      verificationScaleInterval_e: '0.01g',
      verificationIntervalMonths: 12,
      accuracyClass: ACCURACY_CLASSES.CLASS_I_SPECIAL,
      status: 'PENDING_VERIFICATION',
      installationAddress: {
        premiseName: 'Okhla Lab Room 4',
        addressLine: 'Plot 10, Okhla Industrial Area',
        city: 'New Delhi',
        state: 'Delhi',
        district: 'New Delhi',
        pincode: '110020',
      },
      createdBy: user1._id,
      isActive: true,
    });

    const randomSerial2 = `P6-INST-${Math.floor(Math.random() * 900000 + 100000)}`;
    instrument2 = await Instrument.create({
      instrumentId: `LM-P6-${Math.floor(Math.random() * 900000 + 100000)}`,
      stakeholder: stakeholder1._id,
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'COUNTER_SCALE',
      modelNumber: 'CS-Digital-50',
      serialNumber: randomSerial2,
      manufacturer: 'National Scale Works',
      capacity: { value: 50, unit: 'kg' },
      verificationScaleInterval_e: '5g',
      verificationIntervalMonths: 12,
      accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
      status: 'PENDING_VERIFICATION',
      installationAddress: {
        premiseName: 'Okhla Warehouse 2',
        addressLine: 'Plot 12, Okhla Phase 2',
        city: 'New Delhi',
        state: 'Delhi',
        district: 'New Delhi',
        pincode: '110020',
      },
      createdBy: user1._id,
      isActive: true,
    });

    const randomSerial3 = `P6-INST-${Math.floor(Math.random() * 900000 + 100000)}`;
    instrument3 = await Instrument.create({
      instrumentId: `LM-P6-${Math.floor(Math.random() * 900000 + 100000)}`,
      stakeholder: stakeholder2._id,
      category: INSTRUMENT_CATEGORIES.AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'AUTOMATIC_CATCHWEIGHER',
      modelNumber: 'FD-FlowMaster',
      serialNumber: randomSerial3,
      manufacturer: 'PetroTech Metrology',
      capacity: { value: 100, unit: 'kg' },
      verificationScaleInterval_e: '20g',
      verificationIntervalMonths: 12,
      accuracyClass: ACCURACY_CLASSES.CLASS_II_HIGH,
      status: 'PENDING_VERIFICATION',
      installationAddress: {
        premiseName: 'Fuel Retail Outlet CP',
        addressLine: '45 Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        district: 'New Delhi',
        pincode: '110001',
      },
      createdBy: user2._id,
      isActive: true,
    });

    // Create Verification Centers
    center1 = await VerificationCenter.findOne({ code: 'P6-DLM-NDLS' });
    if (!center1) {
      center1 = await VerificationCenter.create({
        code: 'P6-DLM-NDLS',
        name: 'District Legal Metrology Testing Lab New Delhi',
        type: 'DISTRICT_LEGAL_METROLOGY_LAB',
        jurisdiction: { state: 'Delhi', district: 'New Delhi' },
        address: 'Pusa Road Metrology Complex, New Delhi',
        capacityPerDay: 20,
        isActive: true,
      });
    }

    inactiveCenter = await VerificationCenter.findOne({ code: 'P6-INACTIVE-LAB' });
    if (!inactiveCenter) {
      inactiveCenter = await VerificationCenter.create({
        code: 'P6-INACTIVE-LAB',
        name: 'Old Renovation Metrology Lab',
        type: 'DISTRICT_LEGAL_METROLOGY_LAB',
        jurisdiction: { state: 'Delhi', district: 'North Delhi' },
        address: 'Old Secretariat, Delhi',
        capacityPerDay: 5,
        isActive: false,
      });
    }

    capacityCenter = await VerificationCenter.findOne({ code: 'P6-LOW-CAP-LAB' });
    if (!capacityCenter) {
      capacityCenter = await VerificationCenter.create({
        code: 'P6-LOW-CAP-LAB',
        name: 'Micro Specialized Metrology Facility',
        type: 'DISTRICT_LEGAL_METROLOGY_LAB',
        jurisdiction: { state: 'Delhi', district: 'New Delhi' },
        address: 'Science Centre Complex, Delhi',
        capacityPerDay: 1, // Only 1 schedule per day capacity for testing limit!
        isActive: true,
      });
    }

    // Create GATC
    gatc1 = await GATC.findOne({ gatcCode: 'GATC-DEL-P6' });
    if (!gatc1) {
      gatc1 = await GATC.create({
        gatcCode: 'GATC-DEL-P6',
        name: 'DoCA Approved Test Centre North India',
        accreditationNumber: 'ACCR-P6-9090',
        accreditationValidUntil: new Date('2029-12-31'),
        state: 'Delhi',
        district: 'New Delhi',
        address: 'Industrial Metrology Park, Delhi',
        contactPerson: { name: 'Dr. A. Verma', phone: '9811009988', email: 'gatc_p6@example.com' },
        isActive: true,
      });
    }

    inactiveGATC = await GATC.findOne({ gatcCode: 'GATC-INACTIVE-P6' });
    if (!inactiveGATC) {
      inactiveGATC = await GATC.create({
        gatcCode: 'GATC-INACTIVE-P6',
        name: 'Suspended Test Facility',
        accreditationNumber: 'ACCR-P6-SUSP',
        accreditationValidUntil: new Date('2024-01-01'),
        state: 'Delhi',
        district: 'New Delhi',
        address: 'Defunct Lane, Delhi',
        contactPerson: { name: 'Suspended Person', phone: '9811009900', email: 'defunct@example.com' },
        isActive: false,
      });
    }

    // Create Applications in various states
    // 1. APPROVED application for trader 1 (Ready for scheduling)
    approvedApp1 = await VerificationApplication.create({
      applicationNumber: `LM-2026-${Math.floor(Math.random() * 900000 + 100000)}`,
      stakeholder: stakeholder1._id,
      instrument: instrument1._id,
      applicationType: 'NEW_VERIFICATION',
      currentStatus: APPLICATION_STATUSES.APPROVED,
      verificationLocation: {
        locationType: 'ON_SITE_PREMISES',
        address: 'Okhla Lab Room 4',
        district: 'New Delhi',
      },
      statusHistory: [
        { fromStatus: APPLICATION_STATUSES.DRAFT, toStatus: APPLICATION_STATUSES.DRAFT, changedBy: user1._id },
        { fromStatus: APPLICATION_STATUSES.DRAFT, toStatus: APPLICATION_STATUSES.SUBMITTED, changedBy: user1._id },
        { fromStatus: APPLICATION_STATUSES.SUBMITTED, toStatus: APPLICATION_STATUSES.UNDER_REVIEW, changedBy: officer1._id },
        { fromStatus: APPLICATION_STATUSES.UNDER_REVIEW, toStatus: APPLICATION_STATUSES.APPROVED, changedBy: officer1._id },
      ],
      createdBy: user1._id,
    });

    // 2. Another APPROVED application for trader 1
    approvedApp2 = await VerificationApplication.create({
      applicationNumber: `LM-2026-${Math.floor(Math.random() * 900000 + 100000)}`,
      stakeholder: stakeholder1._id,
      instrument: instrument2._id,
      applicationType: 'NEW_VERIFICATION',
      currentStatus: APPLICATION_STATUSES.APPROVED,
      verificationLocation: {
        locationType: 'ON_SITE_PREMISES',
        address: 'Okhla Warehouse 2',
        district: 'New Delhi',
      },
      createdBy: user1._id,
    });

    // 3. SUBMITTED application
    submittedApp = await VerificationApplication.create({
      applicationNumber: `LM-2026-${Math.floor(Math.random() * 900000 + 100000)}`,
      stakeholder: stakeholder2._id,
      instrument: instrument3._id,
      applicationType: 'NEW_VERIFICATION',
      currentStatus: APPLICATION_STATUSES.SUBMITTED,
      createdBy: user2._id,
    });

    // 4. DRAFT application
    draftApp = await VerificationApplication.create({
      applicationNumber: `LM-2026-${Math.floor(Math.random() * 900000 + 100000)}`,
      stakeholder: stakeholder2._id,
      instrument: instrument3._id,
      applicationType: 'NEW_VERIFICATION',
      currentStatus: APPLICATION_STATUSES.DRAFT,
      createdBy: user2._id,
    });

    // -------------------------------------------------------------
    // Schedule Creation Tests (1 - 6)
    // -------------------------------------------------------------
    const testDate = '2026-10-15';

    // Test 1: Authorized ADMIN creates schedule
    const res1 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: approvedApp1._id,
        assignedOfficer: officer1._id,
        scheduledDate: testDate,
        startTime: '09:00',
        endTime: '11:00',
        verificationCenterId: center1._id,
        locationAddress: 'Okhla Lab Room 4, New Delhi',
        specialInstructions: 'Handle Class I special microbalance carefully',
      }),
    });
    const data1 = await res1.json();
    primarySchedule = data1.data;
    recordTest(
      1,
      'Authorized ADMIN creates schedule',
      res1.status === 201 && data1.success === true && Boolean(primarySchedule?._id),
      `Status: ${res1.status}, ScheduleID: ${primarySchedule?._id}`
    );

    // Test 2: APPROVED application status transitions to SCHEDULED
    const updatedApp1 = await VerificationApplication.findById(approvedApp1._id);
    recordTest(
      2,
      'APPROVED application becomes SCHEDULED in database',
      updatedApp1.currentStatus === APPLICATION_STATUSES.SCHEDULED &&
        String(updatedApp1.assignedLMO) === String(officer1._id),
      `Status: ${updatedApp1.currentStatus}, AssignedLMO: ${updatedApp1.assignedLMO}`
    );

    // Test 3: SUBMITTED application cannot be scheduled
    const res3 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: submittedApp._id,
        assignedOfficer: officer1._id,
        scheduledDate: testDate,
        startTime: '14:00',
        endTime: '16:00',
      }),
    });
    recordTest(
      3,
      'SUBMITTED application cannot be scheduled -> 400',
      res3.status === 400,
      `Status: ${res3.status}`
    );

    // Test 4: DRAFT application cannot be scheduled
    const res4 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: draftApp._id,
        assignedOfficer: officer1._id,
        scheduledDate: testDate,
        startTime: '14:00',
        endTime: '16:00',
      }),
    });
    recordTest(
      4,
      'DRAFT application cannot be scheduled -> 400',
      res4.status === 400,
      `Status: ${res4.status}`
    );

    // Test 5: BUSINESS_USER cannot create schedule
    const res5 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${businessUser1Token}`,
      },
      body: JSON.stringify({
        applicationId: approvedApp2._id,
        assignedOfficer: officer1._id,
        scheduledDate: testDate,
        startTime: '14:00',
        endTime: '16:00',
      }),
    });
    recordTest(
      5,
      'BUSINESS_USER cannot create schedule -> 403',
      res5.status === 403,
      `Status: ${res5.status}`
    );

    // Test 6: Unauthorized role (FVO) cannot create schedule
    const res6 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fvoToken}`,
      },
      body: JSON.stringify({
        applicationId: approvedApp2._id,
        assignedOfficer: officer1._id,
        scheduledDate: testDate,
        startTime: '14:00',
        endTime: '16:00',
      }),
    });
    recordTest(
      6,
      'Unauthorized officer role (FVO) cannot create schedule -> 403',
      res6.status === 403,
      `Status: ${res6.status}`
    );

    // -------------------------------------------------------------
    // Officer Allocation Tests (7 - 12)
    // -------------------------------------------------------------

    // Test 7: Valid Legal Metrology Officer can be assigned by another officer
    const res7 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        applicationId: approvedApp2._id,
        assignedOfficer: officer2._id,
        scheduledDate: testDate,
        startTime: '09:00',
        endTime: '11:00',
        locationAddress: 'Okhla Warehouse 2, New Delhi',
      }),
    });
    const data7 = await res7.json();
    recordTest(
      7,
      'Valid officer can be assigned -> 201',
      res7.status === 201 && data7.success === true,
      `Status: ${res7.status}, Assigned: ${officer2.name}`
    );

    // Reset approvedApp2 for subsequent tests
    if (data7.data?._id) {
      await VerificationSchedule.findByIdAndDelete(data7.data._id);
      await VerificationApplication.findByIdAndUpdate(approvedApp2._id, {
        currentStatus: APPLICATION_STATUSES.APPROVED,
      });
    }

    // Test 8: Inactive officer cannot be assigned -> 400
    const res8 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: approvedApp2._id,
        assignedOfficer: inactiveOfficer._id,
        scheduledDate: testDate,
        startTime: '14:00',
        endTime: '16:00',
      }),
    });
    recordTest(
      8,
      'Inactive officer cannot be assigned -> 400',
      res8.status === 400,
      `Status: ${res8.status}`
    );

    // Test 9: Invalid officer role (e.g. BUSINESS_USER) rejected -> 400
    const res9 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: approvedApp2._id,
        assignedOfficer: user1._id, // trader user
        scheduledDate: testDate,
        startTime: '14:00',
        endTime: '16:00',
      }),
    });
    recordTest(
      9,
      'Invalid officer role (BUSINESS_USER) rejected -> 400',
      res9.status === 400,
      `Status: ${res9.status}`
    );

    // Test 10: Officer overlapping schedule returns 409
    // Officer 1 already has primarySchedule on testDate from 09:00 to 11:00.
    // Try booking Officer 1 from 10:00 to 12:00 (overlaps!)
    const res10 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: approvedApp2._id,
        assignedOfficer: officer1._id,
        scheduledDate: testDate,
        startTime: '10:00',
        endTime: '12:00',
      }),
    });
    recordTest(
      10,
      'Officer overlapping schedule returns 409',
      res10.status === 409,
      `Status: ${res10.status}`
    );

    // Test 11: Field officer allocation validates role (reject non-FVO)
    const res11 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: approvedApp2._id,
        assignedOfficer: officer2._id,
        assignedFieldOfficerId: officer1._id, // Officer1 is LMO, not FVO!
        scheduledDate: testDate,
        startTime: '12:00',
        endTime: '14:00',
      }),
    });
    recordTest(
      11,
      'Field officer allocation validates role (rejects non-FVO) -> 400',
      res11.status === 400,
      `Status: ${res11.status}`
    );

    // Test 12: Field officer overlapping schedule returns 409
    // First, book a schedule with fvoUser from 13:00 to 15:00
    const scheduleWithFVO = await VerificationSchedule.create({
      application: approvedApp2._id,
      instrument: instrument2._id,
      stakeholder: stakeholder1._id,
      assignedOfficer: officer2._id,
      assignedFieldOfficer: fvoUser._id,
      scheduledDate: new Date(testDate),
      startTime: '13:00',
      endTime: '15:00',
      timeSlot: '13:00 - 15:00',
      locationAddress: 'Okhla Warehouse 2',
      status: SCHEDULE_STATUSES.SCHEDULED,
      createdBy: officer2._id,
    });

    // Create another approved app for test 12
    const tempAppForFVO = await VerificationApplication.create({
      applicationNumber: `LM-2026-${Math.floor(Math.random() * 900000 + 100000)}`,
      stakeholder: stakeholder2._id,
      instrument: instrument3._id,
      applicationType: 'NEW_VERIFICATION',
      currentStatus: APPLICATION_STATUSES.APPROVED,
      createdBy: user2._id,
    });

    // Try booking fvoUser from 14:00 to 16:00 (overlaps with 13:00-15:00!)
    const res12 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: tempAppForFVO._id,
        assignedOfficer: officer2._id,
        assignedFieldOfficerId: fvoUser._id,
        scheduledDate: testDate,
        startTime: '14:00',
        endTime: '16:00',
      }),
    });
    recordTest(
      12,
      'Field officer overlapping schedule returns 409',
      res12.status === 409,
      `Status: ${res12.status}`
    );

    // Clean up scheduleWithFVO
    await VerificationSchedule.findByIdAndDelete(scheduleWithFVO._id);

    // -------------------------------------------------------------
    // Instrument / Application Conflict Tests (13 - 14)
    // -------------------------------------------------------------

    // Test 13: Same application cannot have duplicate active schedule
    // approvedApp1 already has primarySchedule in SCHEDULED status
    const res13 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: approvedApp1._id,
        assignedOfficer: officer2._id, // different officer
        scheduledDate: '2026-10-20', // different date
        startTime: '10:00',
        endTime: '12:00',
      }),
    });
    recordTest(
      13,
      'Same application cannot have duplicate active schedule -> 400 or 409',
      res13.status === 400 || res13.status === 409,
      `Status: ${res13.status}`
    );

    // Test 14: Same instrument overlapping schedule returns 409
    // primarySchedule is on testDate (09:00-11:00) with instrument1.
    // Try to book tempAppForFVO with instrument1 on testDate (10:00-12:00)
    await VerificationApplication.findByIdAndUpdate(tempAppForFVO._id, {
      instrument: instrument1._id,
    });
    const res14 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: tempAppForFVO._id,
        assignedOfficer: officer2._id, // different officer
        scheduledDate: testDate,
        startTime: '10:00',
        endTime: '12:00',
      }),
    });
    recordTest(
      14,
      'Same instrument overlapping schedule returns 409',
      res14.status === 409,
      `Status: ${res14.status}`
    );

    // Restore tempAppForFVO instrument to instrument3
    await VerificationApplication.findByIdAndUpdate(tempAppForFVO._id, {
      instrument: instrument3._id,
    });

    // -------------------------------------------------------------
    // Center / GATC Tests (15 - 18)
    // -------------------------------------------------------------

    // Test 15: Invalid center ID rejected
    const res15 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: tempAppForFVO._id,
        assignedOfficer: officer2._id,
        verificationCenterId: '6a9e00000000000000000000', // Non-existent
        scheduledDate: testDate,
        startTime: '15:00',
        endTime: '17:00',
      }),
    });
    recordTest(
      15,
      'Invalid verification center ID rejected -> 404 or 400',
      res15.status === 404 || res15.status === 400,
      `Status: ${res15.status}`
    );

    // Test 16: Inactive verification center rejected -> 400
    const res16 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: tempAppForFVO._id,
        assignedOfficer: officer2._id,
        verificationCenterId: inactiveCenter._id,
        scheduledDate: testDate,
        startTime: '15:00',
        endTime: '17:00',
      }),
    });
    recordTest(
      16,
      'Inactive verification center rejected -> 400',
      res16.status === 400,
      `Status: ${res16.status}`
    );

    // Test 17: Center conflict/capacity correctly detected
    // capacityCenter has capacityPerDay: 1.
    // First, book 1 schedule for capacityCenter on testDate
    const capSchedule1 = await VerificationSchedule.create({
      application: approvedApp2._id,
      instrument: instrument2._id,
      stakeholder: stakeholder1._id,
      assignedOfficer: officer2._id,
      verificationCenter: capacityCenter._id,
      scheduledDate: new Date(testDate),
      startTime: '11:00',
      endTime: '13:00',
      timeSlot: '11:00 - 13:00',
      locationAddress: capacityCenter.address,
      status: SCHEDULE_STATUSES.SCHEDULED,
      createdBy: officer2._id,
    });

    // Now attempt a 2nd schedule on capacityCenter on the same date (capacity = 1 exceeded!)
    const res17 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: tempAppForFVO._id,
        assignedOfficer: officer2._id,
        verificationCenterId: capacityCenter._id,
        scheduledDate: testDate,
        startTime: '15:00',
        endTime: '17:00',
      }),
    });
    recordTest(
      17,
      'Center daily capacity limit exceeded returns 409',
      res17.status === 409,
      `Status: ${res17.status}`
    );

    // Clean up capSchedule1
    await VerificationSchedule.findByIdAndDelete(capSchedule1._id);

    // Test 18: Inactive GATC rejected -> 400
    const res18 = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        applicationId: tempAppForFVO._id,
        assignedOfficer: officer2._id,
        gatcId: inactiveGATC._id,
        scheduledDate: testDate,
        startTime: '15:00',
        endTime: '17:00',
      }),
    });
    recordTest(
      18,
      'Inactive GATC rejected -> 400',
      res18.status === 400,
      `Status: ${res18.status}`
    );

    // -------------------------------------------------------------
    // Rescheduling Tests (19 - 23)
    // -------------------------------------------------------------

    // Test 19: Authorized user can reschedule
    const rescheduleDate = '2026-10-18';
    const res19 = await fetch(`${BASE_URL}/api/schedules/${primarySchedule._id}/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        scheduledDate: rescheduleDate,
        startTime: '14:00',
        endTime: '16:00',
        reason: 'District Metrology Laboratory maintenance and recalibration',
      }),
    });
    const data19 = await res19.json();
    recordTest(
      19,
      'Authorized user can reschedule -> 200, status RESCHEDULED',
      res19.status === 200 && data19.data?.status === SCHEDULE_STATUSES.RESCHEDULED,
      `Status: ${res19.status}, ScheduleStatus: ${data19.data?.status}`
    );

    // Test 20: Rescheduling conflict on new timeslot returns 409
    // Officer 2 is assigned to another schedule on 2026-10-22 10:00-12:00
    const clashSchedule = await VerificationSchedule.create({
      application: tempAppForFVO._id,
      instrument: instrument3._id,
      stakeholder: stakeholder2._id,
      assignedOfficer: officer1._id,
      scheduledDate: new Date('2026-10-22'),
      startTime: '10:00',
      endTime: '12:00',
      timeSlot: '10:00 - 12:00',
      locationAddress: 'Retail Outlet',
      status: SCHEDULE_STATUSES.SCHEDULED,
      createdBy: officer1._id,
    });

    // Try to reschedule primarySchedule (which has officer1) to 2026-10-22 11:00-13:00 (conflict!)
    const res20 = await fetch(`${BASE_URL}/api/schedules/${primarySchedule._id}/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        scheduledDate: '2026-10-22',
        startTime: '11:00',
        endTime: '13:00',
        reason: 'Attempted clash shift',
      }),
    });
    recordTest(
      20,
      'Rescheduling conflict returns 409',
      res20.status === 409,
      `Status: ${res20.status}`
    );

    await VerificationSchedule.findByIdAndDelete(clashSchedule._id);

    // Test 21: Completed schedule cannot be rescheduled -> 400
    const completedSched = await VerificationSchedule.create({
      application: tempAppForFVO._id,
      instrument: instrument3._id,
      stakeholder: stakeholder2._id,
      assignedOfficer: officer2._id,
      scheduledDate: new Date('2026-10-01'),
      startTime: '09:00',
      endTime: '11:00',
      timeSlot: '09:00 - 11:00',
      locationAddress: 'Completed Lab',
      status: SCHEDULE_STATUSES.COMPLETED,
      createdBy: officer2._id,
    });
    const res21 = await fetch(`${BASE_URL}/api/schedules/${completedSched._id}/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        scheduledDate: '2026-10-25',
        reason: 'Cannot reschedule completed',
      }),
    });
    recordTest(
      21,
      'Completed schedule cannot be rescheduled -> 400',
      res21.status === 400,
      `Status: ${res21.status}`
    );
    await VerificationSchedule.findByIdAndDelete(completedSched._id);

    // Test 22: Cancelled schedule cannot be rescheduled -> 400
    const cancelledSched = await VerificationSchedule.create({
      application: tempAppForFVO._id,
      instrument: instrument3._id,
      stakeholder: stakeholder2._id,
      assignedOfficer: officer2._id,
      scheduledDate: new Date('2026-10-01'),
      startTime: '09:00',
      endTime: '11:00',
      timeSlot: '09:00 - 11:00',
      locationAddress: 'Cancelled Lab',
      status: SCHEDULE_STATUSES.CANCELLED,
      createdBy: officer2._id,
    });
    const res22 = await fetch(`${BASE_URL}/api/schedules/${cancelledSched._id}/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        scheduledDate: '2026-10-25',
        reason: 'Cannot reschedule cancelled',
      }),
    });
    recordTest(
      22,
      'Cancelled schedule cannot be rescheduled -> 400',
      res22.status === 400,
      `Status: ${res22.status}`
    );
    await VerificationSchedule.findByIdAndDelete(cancelledSched._id);

    // Test 23: Reschedule history is preserved with previousDate, newDate, reason, rescheduledBy
    const schedInDB = await VerificationSchedule.findById(primarySchedule._id);
    const lastHistory = schedInDB.rescheduleHistory[schedInDB.rescheduleHistory.length - 1];
    recordTest(
      23,
      'Reschedule history is stored and tracked in MongoDB',
      schedInDB.rescheduleHistory?.length > 0 &&
        Boolean(lastHistory?.reason) &&
        Boolean(lastHistory?.rescheduledBy),
      `History Entries: ${schedInDB.rescheduleHistory.length}, Reason: ${lastHistory?.reason}`
    );

    // -------------------------------------------------------------
    // Cancellation Tests (24 - 26)
    // -------------------------------------------------------------

    // Test 24: Authorized user can cancel
    const cancelReason = 'Trader requested postponement due to factory annual power shutdown';
    const res24 = await fetch(`${BASE_URL}/api/schedules/${primarySchedule._id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        cancellationReason: cancelReason,
      }),
    });
    const data24 = await res24.json();
    recordTest(
      24,
      'Authorized user can cancel schedule -> 200, status CANCELLED',
      res24.status === 200 && data24.data?.status === SCHEDULE_STATUSES.CANCELLED,
      `Status: ${res24.status}, ScheduleStatus: ${data24.data?.status}`
    );

    // Test 25: Cancellation requires reason
    const newSchedForCancelTest = await VerificationSchedule.create({
      application: tempAppForFVO._id,
      instrument: instrument3._id,
      stakeholder: stakeholder2._id,
      assignedOfficer: officer2._id,
      scheduledDate: new Date('2026-10-28'),
      startTime: '10:00',
      endTime: '12:00',
      timeSlot: '10:00 - 12:00',
      locationAddress: 'Test Cancellation Reason',
      status: SCHEDULE_STATUSES.SCHEDULED,
      createdBy: officer2._id,
    });
    const res25 = await fetch(`${BASE_URL}/api/schedules/${newSchedForCancelTest._id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        cancellationReason: '', // Empty reason!
      }),
    });
    recordTest(
      25,
      'Cancellation requires a reason -> 400',
      res25.status === 400,
      `Status: ${res25.status}`
    );
    await VerificationSchedule.findByIdAndDelete(newSchedForCancelTest._id);

    // Test 26: Cancelled schedule remains in MongoDB (soft cancel, not deleted)
    const cancelledDocInDB = await VerificationSchedule.findById(primarySchedule._id);
    recordTest(
      26,
      'Cancelled schedule document persists in MongoDB',
      cancelledDocInDB !== null &&
        cancelledDocInDB.status === SCHEDULE_STATUSES.CANCELLED &&
        cancelledDocInDB.cancellationReason === cancelReason,
      `Persisted in DB: true, Status: ${cancelledDocInDB?.status}, Reason: ${cancelledDocInDB?.cancellationReason}`
    );

    // -------------------------------------------------------------
    // Ownership / Data Isolation Tests (27 - 30)
    // -------------------------------------------------------------

    // Create fresh application for Trader 1's schedule
    const trader1App = await VerificationApplication.create({
      applicationNumber: `LM-2026-${Math.floor(Math.random() * 900000 + 100000)}`,
      stakeholder: stakeholder1._id,
      instrument: instrument1._id,
      applicationType: 'NEW_VERIFICATION',
      currentStatus: APPLICATION_STATUSES.APPROVED,
      createdBy: user1._id,
    });

    // Create a schedule belonging to Trader 1
    const trader1Schedule = await VerificationSchedule.create({
      application: trader1App._id,
      instrument: instrument1._id,
      stakeholder: stakeholder1._id,
      assignedOfficer: officer1._id,
      scheduledDate: new Date('2026-11-05'),
      startTime: '09:00',
      endTime: '11:00',
      timeSlot: '09:00 - 11:00',
      locationAddress: 'Okhla Lab 4',
      status: SCHEDULE_STATUSES.SCHEDULED,
      createdBy: officer1._id,
    });

    // Create a schedule belonging to Trader 2
    const trader2Schedule = await VerificationSchedule.create({
      application: tempAppForFVO._id,
      instrument: instrument3._id,
      stakeholder: stakeholder2._id,
      assignedOfficer: officer2._id,
      assignedFieldOfficer: fvoUser._id,
      scheduledDate: new Date('2026-11-06'),
      startTime: '10:00',
      endTime: '12:00',
      timeSlot: '10:00 - 12:00',
      locationAddress: 'CP Outlet',
      status: SCHEDULE_STATUSES.SCHEDULED,
      createdBy: officer2._id,
    });

    // Test 27: BUSINESS_USER can only view own schedules
    const res27 = await fetch(`${BASE_URL}/api/schedules`, {
      headers: { Authorization: `Bearer ${businessUser1Token}` },
    });
    const data27 = await res27.json();
    const trader1List = data27.data?.items || data27.data || [];
    const leakedOtherStakeholder = trader1List.some(
      (s) => String(s.stakeholder?._id || s.stakeholder) !== String(stakeholder1._id)
    );
    recordTest(
      27,
      'BUSINESS_USER can only view own schedules in list',
      res27.status === 200 && !leakedOtherStakeholder,
      `Returned count: ${trader1List.length}, Leaked other stakeholder: ${leakedOtherStakeholder}`
    );

    // Test 28: BUSINESS_USER cannot access another user's schedule -> 403
    const res28 = await fetch(`${BASE_URL}/api/schedules/${trader2Schedule._id}`, {
      headers: { Authorization: `Bearer ${businessUser1Token}` },
    });
    recordTest(
      28,
      'BUSINESS_USER cannot access another user schedule by ID -> 403',
      res28.status === 403,
      `Status: ${res28.status}`
    );

    // Test 29: Officer cannot access unauthorized schedule (FVO accessing schedule not assigned to them)
    // trader1Schedule is assigned to officer1 (LMO), not fvoUser.
    const res29 = await fetch(`${BASE_URL}/api/schedules/${trader1Schedule._id}`, {
      headers: { Authorization: `Bearer ${fvoToken}` },
    });
    recordTest(
      29,
      'Field officer cannot access unassigned schedule -> 403',
      res29.status === 403,
      `Status: ${res29.status}`
    );

    // Test 30: Missing JWT returns 401
    const res30 = await fetch(`${BASE_URL}/api/schedules`);
    recordTest(
      30,
      'Missing JWT authentication returns 401',
      res30.status === 401,
      `Status: ${res30.status}`
    );

    // -------------------------------------------------------------
    // Calendar & Availability Tests (31 - 33)
    // -------------------------------------------------------------

    // Test 31: Calendar API returns real MongoDB schedules
    const res31 = await fetch(
      `${BASE_URL}/api/schedules/calendar?startDate=2026-11-01&endDate=2026-11-30`,
      {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      }
    );
    const data31 = await res31.json();
    const calendarEvents = data31.data || [];
    const hasFormattedEvents =
      calendarEvents.length >= 2 &&
      calendarEvents.every((e) => e.id && e.title && e.start && e.end && e.status);
    recordTest(
      31,
      'Calendar API returns real MongoDB schedules with formatted event objects',
      res31.status === 200 && hasFormattedEvents,
      `Events Count: ${calendarEvents.length}, Sample Title: ${calendarEvents[0]?.title}`
    );

    // Test 32: Availability API calculates real conflicts from MongoDB
    // Check availability for officer1 on 2026-11-05 between 09:30 and 11:30 (overlaps with trader1Schedule 09:00-11:00!)
    const res32 = await fetch(
      `${BASE_URL}/api/schedules/availability?date=2026-11-05&startTime=09:30&endTime=11:30&officerId=${officer1._id}&instrumentId=${instrument1._id}`,
      {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      }
    );
    const data32 = await res32.json();
    const avail = data32.data;
    recordTest(
      32,
      'Availability API calculates real conflicts from MongoDB',
      res32.status === 200 &&
        avail.officerAvailable === false &&
        avail.instrumentAvailable === false &&
        avail.conflicts?.length >= 2,
      `OfficerAvailable: ${avail?.officerAvailable}, InstrumentAvailable: ${avail?.instrumentAvailable}, Conflicts: ${avail?.conflicts?.length}`
    );

    // Test 33: Centralized state transition engine (SCHEDULED -> IN_PROGRESS -> COMPLETED)
    // Valid transition: trader2Schedule from SCHEDULED to IN_PROGRESS
    const res33a = await fetch(`${BASE_URL}/api/schedules/${trader2Schedule._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({ status: SCHEDULE_STATUSES.IN_PROGRESS, remarks: 'Commencing testing' }),
    });
    const data33a = await res33a.json();

    // Invalid transition: Try transitioning directly from IN_PROGRESS to PENDING (Forbidden by state machine)
    const res33b = await fetch(`${BASE_URL}/api/schedules/${trader2Schedule._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({ status: SCHEDULE_STATUSES.PENDING }),
    });

    recordTest(
      33,
      'Centralized state machine validates schedule lifecycle transitions',
      res33a.status === 200 &&
        data33a.data?.status === SCHEDULE_STATUSES.IN_PROGRESS &&
        res33b.status === 400,
      `Valid Status: ${data33a.data?.status}, Invalid HTTP Status: ${res33b.status}`
    );

    // Clean up temporary schedules
    await VerificationSchedule.findByIdAndDelete(trader1Schedule._id);
    await VerificationSchedule.findByIdAndDelete(trader2Schedule._id);
    await VerificationApplication.findByIdAndDelete(tempAppForFVO._id);
    await VerificationApplication.findByIdAndDelete(trader1App._id);

    console.log('\n===============================================================');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`Phase 6 Test Results: ${passedCount}/${results.length} PASSED`);
    if (passedCount === results.length) {
      console.log('🎉 ALL 33 PHASE 6 TEST CRITERIA PASSED WITH ZERO DEFECTS!');
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
