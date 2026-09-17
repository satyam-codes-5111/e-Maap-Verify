import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { AuditLog } from '../models/AuditLog.js';
import {
  USER_ROLES,
  INSTRUMENT_CATEGORIES,
  ACCURACY_CLASSES,
  INSTRUMENT_STATUSES,
  APPLICATION_STATUSES,
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
  console.log('🧪 Starting Phase 5: Application Workflow & Scheduling Test Suite');
  console.log('===============================================================\n');

  await connectDB();

  const adminEmail = ENV.ADMIN_INITIAL_EMAIL;
  const adminPassword = ENV.ADMIN_INITIAL_PASSWORD;

  let superAdminToken = '';
  let lmoToken = '';
  let fvoToken = '';
  let user1Token = '';
  let user2Token = '';

  let lmoUser = null;
  let fvoUser = null;
  let user1 = null;
  let user2 = null;
  let stakeholder1 = null;
  let stakeholder2 = null;
  let instrument1 = null;
  let instrument2 = null;
  let inactiveInstrument = null;

  let draftApp1 = null;
  let draftApp2 = null;
  let appToReject = null;
  let appToSchedule = null;
  let createdSchedule = null;

  try {
    // 0. Setup test users and tokens
    // Login Super Admin
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const loginData = await loginRes.json();
    if (!loginData.data?.token) {
      throw new Error('Super Admin login failed in test setup');
    }
    superAdminToken = loginData.data.token;

    // Create or find LMO Officer
    lmoUser = await User.findOne({ email: 'phase5_lmo@doca.gov.in' });
    if (!lmoUser) {
      lmoUser = new User({
        name: 'Phase 5 Legal Metrology Officer',
        email: 'phase5_lmo@doca.gov.in',
        password: 'Password@123',
        role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
        phone: '9876543290',
        designation: 'Senior Inspector of Legal Metrology',
        jurisdiction: 'New Delhi North',
        isActive: true,
      });
      await lmoUser.save();
    }
    lmoToken = jwt.sign(
      { id: lmoUser._id, role: lmoUser.role, email: lmoUser.email },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create or find FVO Officer
    fvoUser = await User.findOne({ email: 'phase5_fvo@doca.gov.in' });
    if (!fvoUser) {
      fvoUser = new User({
        name: 'Phase 5 Field Officer',
        email: 'phase5_fvo@doca.gov.in',
        password: 'Password@123',
        role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
        phone: '9876543291',
        designation: 'Field Officer',
        jurisdiction: 'New Delhi South',
        isActive: true,
      });
      await fvoUser.save();
    }
    fvoToken = jwt.sign(
      { id: fvoUser._id, role: fvoUser.role, email: fvoUser.email },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create or find Business User 1 & Stakeholder 1
    user1 = await User.findOne({ email: 'phase5_user1@business.com' });
    if (!user1) {
      user1 = new User({
        name: 'Phase 5 Trader One',
        email: 'phase5_user1@business.com',
        password: 'Password@123',
        role: USER_ROLES.BUSINESS_USER,
        phone: '9876543292',
        isActive: true,
      });
      await user1.save();
    }
    user1Token = jwt.sign(
      { id: user1._id, role: user1.role, email: user1.email },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );

    stakeholder1 = await Stakeholder.findOne({ user: user1._id });
    if (!stakeholder1) {
      stakeholder1 = new Stakeholder({
        user: user1._id,
        businessName: 'Phase 5 Alpha Weighing Solutions Ltd',
        tradeLicenseNumber: 'TL-PH5-ALPHA-01',
        gstin: '07AAAAA0000A1Z5',
        businessType: 'MANUFACTURER',
        contactPerson: { name: 'Alpha Manager', email: user1.email, phone: user1.phone },
        registeredAddress: {
          street: '101 Industrial Estate Okhla',
          city: 'New Delhi',
          district: 'South Delhi',
          state: 'Delhi',
          pincode: '110020',
        },
        isActive: true,
      });
      await stakeholder1.save();
    }

    // Create or find Business User 2 & Stakeholder 2
    user2 = await User.findOne({ email: 'phase5_user2@business.com' });
    if (!user2) {
      user2 = new User({
        name: 'Phase 5 Trader Two',
        email: 'phase5_user2@business.com',
        password: 'Password@123',
        role: USER_ROLES.BUSINESS_USER,
        phone: '9876543293',
        isActive: true,
      });
      await user2.save();
    }
    user2Token = jwt.sign(
      { id: user2._id, role: user2.role, email: user2.email },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );

    stakeholder2 = await Stakeholder.findOne({ user: user2._id });
    if (!stakeholder2) {
      stakeholder2 = new Stakeholder({
        user: user2._id,
        businessName: 'Phase 5 Beta Scale Logistics',
        tradeLicenseNumber: 'TL-PH5-BETA-02',
        gstin: '07BBBBB0000B1Z6',
        businessType: 'REPAIRER',
        contactPerson: { name: 'Beta Manager', email: user2.email, phone: user2.phone },
        registeredAddress: {
          street: '202 Mayapuri Industrial Area',
          city: 'New Delhi',
          district: 'West Delhi',
          state: 'Delhi',
          pincode: '110064',
        },
        isActive: true,
      });
      await stakeholder2.save();
    }

    // Create Instruments for testing
    instrument1 = await Instrument.findOne({ serialNumber: 'PH5-INST-SN-001' });
    if (!instrument1) {
      instrument1 = new Instrument({
        instrumentId: 'LM-PH5-000001',
        stakeholder: stakeholder1._id,
        category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
        instrumentType: 'ELECTRONIC_COUNTER_SCALE',
        manufacturer: 'Avery Weigh-Tronix',
        modelNumber: 'AW-5000',
        serialNumber: 'PH5-INST-SN-001',
        accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
        verificationScaleInterval_e: '5g',
        capacity: { value: 30, unit: 'kg' },
        verificationIntervalMonths: 12,
        status: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
        installationAddress: {
          premiseName: 'Alpha Factory Floor',
          addressLine: '101 Industrial Estate Okhla',
          city: 'New Delhi',
          district: 'South Delhi',
          state: 'Delhi',
          pincode: '110020',
        },
        isActive: true,
        createdBy: user1._id,
      });
      await instrument1.save();
    }

    instrument2 = await Instrument.findOne({ serialNumber: 'PH5-INST-SN-002' });
    if (!instrument2) {
      instrument2 = new Instrument({
        instrumentId: 'LM-PH5-000002',
        stakeholder: stakeholder2._id,
        category: INSTRUMENT_CATEGORIES.FUEL_DISPENSER,
        instrumentType: 'PETROL_DISPENSER',
        manufacturer: 'Gilbarco Veeder-Root',
        modelNumber: 'GVR-3000',
        serialNumber: 'PH5-INST-SN-002',
        accuracyClass: ACCURACY_CLASSES.CLASS_II_HIGH,
        verificationScaleInterval_e: '10ml',
        capacity: { value: 60, unit: 'L/min' },
        verificationIntervalMonths: 12,
        status: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
        installationAddress: {
          premiseName: 'Beta Retail Station',
          addressLine: '202 Mayapuri Industrial Area',
          city: 'New Delhi',
          district: 'West Delhi',
          state: 'Delhi',
          pincode: '110064',
        },
        isActive: true,
        createdBy: user2._id,
      });
      await instrument2.save();
    }

    // Inactive instrument for failure scenario
    inactiveInstrument = await Instrument.findOne({ serialNumber: 'PH5-INST-SN-INACTIVE' });
    if (!inactiveInstrument) {
      inactiveInstrument = new Instrument({
        instrumentId: 'LM-PH5-000003',
        stakeholder: stakeholder1._id,
        category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
        instrumentType: 'BENCH_SCALE',
        manufacturer: 'Mettler Toledo',
        modelNumber: 'MT-100',
        serialNumber: 'PH5-INST-SN-INACTIVE',
        accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
        verificationScaleInterval_e: '10g',
        capacity: { value: 50, unit: 'kg' },
        verificationIntervalMonths: 12,
        status: INSTRUMENT_STATUSES.OUT_OF_SERVICE,
        installationAddress: {
          premiseName: 'Alpha Warehouse Shelf',
          addressLine: '101 Industrial Estate Okhla',
          city: 'New Delhi',
          district: 'South Delhi',
          state: 'Delhi',
          pincode: '110020',
        },
        isActive: false,
        createdBy: user1._id,
      });
      await inactiveInstrument.save();
    }

    // Clean up test verification applications and schedules from previous test runs
    await VerificationSchedule.deleteMany({
      $or: [
        { stakeholder: { $in: [stakeholder1._id, stakeholder2._id] } },
        { assignedOfficer: lmoUser._id },
      ],
    });
    await VerificationApplication.deleteMany({
      stakeholder: { $in: [stakeholder1._id, stakeholder2._id] },
    });

    // -------------------------------------------------------------
    // Test 1: Business user creates draft verification application
    // -------------------------------------------------------------
    const createRes1 = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        instrumentId: instrument1._id.toString(),
        applicationType: 'NEW_VERIFICATION',
        verificationType: 'INITIAL',
        purpose: 'Annual statutory verification',
        remarks: 'Test draft submission',
      }),
    });
    const createData1 = await createRes1.json();
    if (createRes1.status !== 201) {
      console.log('DEBUG Test 1 failed with response:', JSON.stringify(createData1));
    }
    draftApp1 = createData1.data;
    recordTest(
      1,
      'Business user creates draft verification application',
      createRes1.status === 201 && draftApp1?.currentStatus === APPLICATION_STATUSES.DRAFT,
      `Status: ${createRes1.status}, AppStatus: ${draftApp1?.currentStatus}`
    );

    // -------------------------------------------------------------
    // Test 2: Draft application receives generated application number
    // -------------------------------------------------------------
    const hasValidAppNum = /^LM-\d{4}-\d+$/.test(draftApp1?.applicationNumber || '');
    recordTest(
      2,
      'Draft application receives generated application number',
      hasValidAppNum,
      `Application Number: ${draftApp1?.applicationNumber}`
    );

    // -------------------------------------------------------------
    // Test 3: Application number is unique
    // -------------------------------------------------------------
    const createRes2 = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        instrumentId: instrument1._id.toString(),
        applicationType: 'RE_VERIFICATION',
        purpose: 'Second test verification',
      }),
    });
    const createData2 = await createRes2.json();
    draftApp2 = createData2.data;
    const isUnique =
      createRes2.status === 201 &&
      draftApp2?.applicationNumber &&
      draftApp2?.applicationNumber !== draftApp1?.applicationNumber;
    recordTest(
      3,
      'Application number is unique',
      isUnique,
      `App1: ${draftApp1?.applicationNumber}, App2: ${draftApp2?.applicationNumber}`
    );

    // -------------------------------------------------------------
    // Test 4: Business user cannot create application for instrument belonging to another stakeholder
    // -------------------------------------------------------------
    const crossRes = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`, // User 1 targeting Instrument 2 (Stakeholder 2)
      },
      body: JSON.stringify({
        instrumentId: instrument2._id.toString(),
        applicationType: 'NEW_VERIFICATION',
      }),
    });
    recordTest(
      4,
      'Business user cannot create application for instrument belonging to another stakeholder',
      crossRes.status === 403,
      `HTTP Status: ${crossRes.status}`
    );

    // -------------------------------------------------------------
    // Test 5: Business user cannot create application for non-existent instrument
    // -------------------------------------------------------------
    const notFoundInstRes = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        instrumentId: '507f1f77bcf86cd799439011',
        applicationType: 'NEW_VERIFICATION',
      }),
    });
    recordTest(
      5,
      'Business user cannot create application for non-existent instrument',
      notFoundInstRes.status === 404,
      `HTTP Status: ${notFoundInstRes.status}`
    );

    // -------------------------------------------------------------
    // Test 6: Business user cannot create application for inactive instrument
    // -------------------------------------------------------------
    const inactiveRes = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        instrumentId: inactiveInstrument._id.toString(),
        applicationType: 'NEW_VERIFICATION',
      }),
    });
    recordTest(
      6,
      'Business user cannot create application for inactive instrument',
      inactiveRes.status === 400,
      `HTTP Status: ${inactiveRes.status}`
    );

    // -------------------------------------------------------------
    // Test 7: Business user updates draft application successfully
    // -------------------------------------------------------------
    const updateDraftRes = await fetch(`${BASE_URL}/api/applications/${draftApp1._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        purpose: 'Updated verification purpose by trader',
        remarks: 'Updated remarks in draft state',
      }),
    });
    const updateDraftData = await updateDraftRes.json();
    recordTest(
      7,
      'Business user updates draft application successfully',
      updateDraftRes.status === 200 && updateDraftData.data?.purpose === 'Updated verification purpose by trader',
      `HTTP Status: ${updateDraftRes.status}, Purpose: ${updateDraftData.data?.purpose}`
    );

    // -------------------------------------------------------------
    // Test 8 & 9: Business user submits draft application successfully, and cannot update afterwards
    // -------------------------------------------------------------
    // Submit draftApp1
    const submitRes = await fetch(`${BASE_URL}/api/applications/${draftApp1._id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
    });
    const submitData = await submitRes.json();
    recordTest(
      9,
      'Business user submits draft application successfully',
      submitRes.status === 200 && submitData.data?.currentStatus === APPLICATION_STATUSES.SUBMITTED,
      `HTTP Status: ${submitRes.status}, Status: ${submitData.data?.currentStatus}`
    );

    // Test 8: Attempt to update application after submission
    const updateAfterSubmitRes = await fetch(`${BASE_URL}/api/applications/${draftApp1._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        purpose: 'Attempted illicit modification after submission',
      }),
    });
    recordTest(
      8,
      'Business user cannot update application after submission',
      updateAfterSubmitRes.status === 403,
      `HTTP Status: ${updateAfterSubmitRes.status}`
    );

    // -------------------------------------------------------------
    // Test 10: Authorized officer reviews submitted application
    // -------------------------------------------------------------
    const reviewRes = await fetch(`${BASE_URL}/api/applications/${draftApp1._id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lmoToken}`,
      },
      body: JSON.stringify({
        remarks: 'Technical verification scrutiny initiated by LMO',
      }),
    });
    const reviewData = await reviewRes.json();
    recordTest(
      10,
      'Authorized officer reviews submitted application',
      reviewRes.status === 200 && reviewData.data?.currentStatus === APPLICATION_STATUSES.UNDER_REVIEW,
      `HTTP Status: ${reviewRes.status}, Status: ${reviewData.data?.currentStatus}`
    );

    // -------------------------------------------------------------
    // Test 11: Approval changes status correctly
    // -------------------------------------------------------------
    const approveRes = await fetch(`${BASE_URL}/api/applications/${draftApp1._id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lmoToken}`,
      },
      body: JSON.stringify({
        remarks: 'All documents valid and approved for verification scheduling',
      }),
    });
    const approveData = await approveRes.json();
    appToSchedule = approveData.data;
    recordTest(
      11,
      'Approval changes status correctly',
      approveRes.status === 200 && appToSchedule?.currentStatus === APPLICATION_STATUSES.APPROVED,
      `HTTP Status: ${approveRes.status}, Status: ${appToSchedule?.currentStatus}`
    );

    // -------------------------------------------------------------
    // Test 12 & 13: Rejection changes status correctly & requires reason
    // -------------------------------------------------------------
    // First submit draftApp2 so it is in SUBMITTED state
    await fetch(`${BASE_URL}/api/applications/${draftApp2._id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
    });

    // Test 13: Rejection requires a reason
    const rejectNoReasonRes = await fetch(`${BASE_URL}/api/applications/${draftApp2._id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lmoToken}`,
      },
      body: JSON.stringify({
        rejectionReason: '',
      }),
    });
    recordTest(
      13,
      'Rejection requires a reason',
      rejectNoReasonRes.status === 400,
      `HTTP Status: ${rejectNoReasonRes.status}`
    );

    // Test 12: Rejection with reason
    const rejectRes = await fetch(`${BASE_URL}/api/applications/${draftApp2._id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lmoToken}`,
      },
      body: JSON.stringify({
        rejectionReason: 'Missing calibration records and tamper seal is broken',
      }),
    });
    const rejectData = await rejectRes.json();
    appToReject = rejectData.data;
    recordTest(
      12,
      'Rejection changes status correctly',
      rejectRes.status === 200 && appToReject?.currentStatus === APPLICATION_STATUSES.REJECTED,
      `HTTP Status: ${rejectRes.status}, Status: ${appToReject?.currentStatus}, Reason: ${appToReject?.rejectionReason}`
    );

    // -------------------------------------------------------------
    // Test 14: Invalid status transition is rejected
    // -------------------------------------------------------------
    // Try to approve an already REJECTED application (terminal state)
    const invalidTransRes = await fetch(`${BASE_URL}/api/applications/${draftApp2._id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lmoToken}`,
      },
      body: JSON.stringify({
        remarks: 'Attempt illegal transition from REJECTED to APPROVED',
      }),
    });
    recordTest(
      14,
      'Invalid status transition is rejected',
      invalidTransRes.status === 400,
      `HTTP Status: ${invalidTransRes.status}`
    );

    // -------------------------------------------------------------
    // Test 15: Business user cannot approve an application
    // -------------------------------------------------------------
    const businessApproveRes = await fetch(`${BASE_URL}/api/applications/${draftApp1._id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ remarks: 'Business user self-approving' }),
    });
    recordTest(
      15,
      'Business user cannot approve an application',
      businessApproveRes.status === 403,
      `HTTP Status: ${businessApproveRes.status}`
    );

    // -------------------------------------------------------------
    // Test 16: Unauthorized role cannot review an application
    // -------------------------------------------------------------
    const fvoReviewRes = await fetch(`${BASE_URL}/api/applications/${draftApp1._id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fvoToken}`, // Field officer cannot perform formal application scrutiny
      },
      body: JSON.stringify({ remarks: 'FVO review attempt' }),
    });
    recordTest(
      16,
      'Unauthorized role cannot review an application',
      fvoReviewRes.status === 403,
      `HTTP Status: ${fvoReviewRes.status}`
    );

    // -------------------------------------------------------------
    // Test 17: Authorized role creates schedule for APPROVED application
    // -------------------------------------------------------------
    const scheduleDate = '2026-10-20';
    const scheduleSlot = '09:00 - 12:00';
    const scheduleRes = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lmoToken}`,
      },
      body: JSON.stringify({
        applicationId: appToSchedule._id.toString(),
        assignedOfficer: lmoUser._id.toString(),
        scheduledDate: scheduleDate,
        timeSlot: scheduleSlot,
        locationAddress: '101 Industrial Estate Okhla, New Delhi',
        specialInstructions: 'Carry standard 20kg test weights',
      }),
    });
    const scheduleData = await scheduleRes.json();
    if (scheduleRes.status !== 201) {
      console.log('DEBUG Test 17 failed with:', JSON.stringify(scheduleData));
    }
    createdSchedule = scheduleData.data;
    const isAssignedOfficerMatch =
      String(createdSchedule?.assignedOfficer?._id || createdSchedule?.assignedOfficer) ===
      String(lmoUser._id);
    recordTest(
      17,
      'Authorized role creates schedule for APPROVED application',
      scheduleRes.status === 201 && isAssignedOfficerMatch,
      `HTTP Status: ${scheduleRes.status}, ScheduleID: ${createdSchedule?._id}`
    );

    // -------------------------------------------------------------
    // Test 18: Non-approved application cannot be scheduled
    // -------------------------------------------------------------
    // Create a new DRAFT application
    const unapprovedAppRes = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        instrumentId: instrument1._id.toString(),
        applicationType: 'NEW_VERIFICATION',
      }),
    });
    const unapprovedAppData = await unapprovedAppRes.json();
    const unapprovedAppId = unapprovedAppData.data?._id;

    const scheduleDraftRes = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lmoToken}`,
      },
      body: JSON.stringify({
        applicationId: unapprovedAppId,
        assignedOfficer: lmoUser._id.toString(),
        scheduledDate: '2026-10-21',
        timeSlot: '12:00 - 15:00',
        locationAddress: '101 Industrial Estate Okhla, New Delhi',
      }),
    });
    recordTest(
      18,
      'Non-approved application cannot be scheduled',
      scheduleDraftRes.status === 400,
      `HTTP Status: ${scheduleDraftRes.status}`
    );

    // -------------------------------------------------------------
    // Test 19: Officer double-booking is prevented
    // -------------------------------------------------------------
    // Create another application, submit it, review it, approve it
    const app3Res = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        instrumentId: instrument1._id.toString(),
        applicationType: 'NEW_VERIFICATION',
      }),
    });
    const app3Data = await app3Res.json();
    const app3Id = app3Data.data._id;
    // Submit
    await fetch(`${BASE_URL}/api/applications/${app3Id}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    // Review
    await fetch(`${BASE_URL}/api/applications/${app3Id}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${lmoToken}` },
    });
    // Approve
    await fetch(`${BASE_URL}/api/applications/${app3Id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${lmoToken}` },
    });

    // Attempt to book same officer on same date & time slot
    const doubleBookRes = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lmoToken}`,
      },
      body: JSON.stringify({
        applicationId: app3Id,
        assignedOfficer: lmoUser._id.toString(),
        scheduledDate: scheduleDate, // same date as Test 17
        timeSlot: scheduleSlot, // same slot as Test 17
        locationAddress: '101 Industrial Estate Okhla',
      }),
    });
    recordTest(
      19,
      'Officer double-booking is prevented',
      doubleBookRes.status === 409,
      `HTTP Status: ${doubleBookRes.status}`
    );

    // -------------------------------------------------------------
    // Test 20: Schedule update / reschedule works correctly
    // -------------------------------------------------------------
    const rescheduleRes = await fetch(`${BASE_URL}/api/schedules/${createdSchedule._id}/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lmoToken}`,
      },
      body: JSON.stringify({
        scheduledDate: '2026-10-25',
        timeSlot: '12:00 - 15:00',
        reason: 'Officer assigned to statutory district inspection drive',
      }),
    });
    const rescheduleData = await rescheduleRes.json();
    const hasHistory = (rescheduleData.data?.rescheduleHistory || []).length > 0;
    recordTest(
      20,
      'Schedule update / reschedule works correctly',
      rescheduleRes.status === 200 && hasHistory,
      `HTTP Status: ${rescheduleRes.status}, RescheduleHistory Count: ${rescheduleData.data?.rescheduleHistory?.length}`
    );

    // -------------------------------------------------------------
    // Test 21: Business user cannot create schedules
    // -------------------------------------------------------------
    const businessScheduleRes = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        applicationId: app3Id,
        assignedOfficer: lmoUser._id.toString(),
        scheduledDate: '2026-10-26',
        timeSlot: '09:00 - 12:00',
        locationAddress: '101 Industrial Estate Okhla',
      }),
    });
    recordTest(
      21,
      'Business user cannot create schedules',
      businessScheduleRes.status === 403,
      `HTTP Status: ${businessScheduleRes.status}`
    );

    // -------------------------------------------------------------
    // Test 22: Application status becomes SCHEDULED after schedule creation
    // -------------------------------------------------------------
    const checkAppRes = await fetch(`${BASE_URL}/api/applications/${appToSchedule._id}`, {
      headers: { Authorization: `Bearer ${lmoToken}` },
    });
    const checkAppData = await checkAppRes.json();
    recordTest(
      22,
      'Application status becomes SCHEDULED after schedule creation',
      checkAppData.data?.application?.currentStatus === APPLICATION_STATUSES.SCHEDULED,
      `App Status: ${checkAppData.data?.application?.currentStatus}`
    );

    // -------------------------------------------------------------
    // Test 23: Application history tracks status transitions
    // -------------------------------------------------------------
    const historyRes = await fetch(`${BASE_URL}/api/applications/${appToSchedule._id}/history`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const historyData = await historyRes.json();
    const historyItems = historyData.data?.statusHistory || [];
    const hasTransitions =
      historyItems.some((h) => h.toStatus === APPLICATION_STATUSES.DRAFT) &&
      historyItems.some((h) => h.toStatus === APPLICATION_STATUSES.SUBMITTED) &&
      historyItems.some((h) => h.toStatus === APPLICATION_STATUSES.UNDER_REVIEW) &&
      historyItems.some((h) => h.toStatus === APPLICATION_STATUSES.APPROVED) &&
      historyItems.some((h) => h.toStatus === APPLICATION_STATUSES.SCHEDULED);
    recordTest(
      23,
      'Application history tracks status transitions',
      historyRes.status === 200 && hasTransitions,
      `History Entries: ${historyItems.length}, Traced all statutory milestones`
    );

    // -------------------------------------------------------------
    // Test 24: Data isolation: Business User A cannot view applications of Business User B
    // -------------------------------------------------------------
    // User 2 trying to get User 1's application
    const crossAccessRes = await fetch(`${BASE_URL}/api/applications/${appToSchedule._id}`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });

    // User 2 listing applications - should NOT contain User 1's application
    const user2ListRes = await fetch(`${BASE_URL}/api/applications`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    const user2ListData = await user2ListRes.json();
    const user2Apps = user2ListData.data?.items || [];
    const leakFound = user2Apps.some((a) => a._id === appToSchedule._id.toString());

    recordTest(
      24,
      'Data isolation: Business User A cannot view applications of Business User B',
      crossAccessRes.status === 403 && !leakFound,
      `Direct Access Status: ${crossAccessRes.status}, Leaked in List: ${leakFound}`
    );
  } catch (error) {
    console.error('\n❌ Unhandled error in test suite:', error);
  } finally {
    await disconnectDB();

    console.log('\n===============================================================');
    console.log('📊 Phase 5 Test Results Summary');
    console.log('===============================================================');
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`Total Scenarios: ${totalCount}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${totalCount - passedCount}`);

    results.forEach((r) => {
      console.log(`  [${r.passed ? 'PASS' : 'FAIL'}] Test ${r.id}: ${r.name}`);
    });

    console.log('===============================================================\n');

    if (passedCount === 24) {
      console.log('🎉 ALL 24/24 PHASE 5 TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.error(`💥 Only ${passedCount}/24 tests passed.`);
      process.exit(1);
    }
  }
}

runAllTests();
