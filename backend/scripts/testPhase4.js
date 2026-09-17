import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { Certificate } from '../models/Certificate.js';
import { AuditLog } from '../models/AuditLog.js';
import { USER_ROLES, INSTRUMENT_CATEGORIES, ACCURACY_CLASSES, INSTRUMENT_STATUSES } from '../config/constants.js';

const BASE_URL = 'http://localhost:3000';

const results = [];

function recordTest(id, name, passed, details = '') {
  results.push({ id, name, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${symbol}] Test ${id}: ${name} ${details ? `(${details})` : ''}`);
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('🧪 Starting Phase 4: Stakeholder & Instrument Test Suite');
  console.log('===============================================================\n');

  await connectDB();

  const adminEmail = ENV.ADMIN_INITIAL_EMAIL;
  const adminPassword = ENV.ADMIN_INITIAL_PASSWORD;

  let superAdminToken = '';
  let fvoToken = '';
  let user1Token = '';
  let user2Token = '';
  let user1 = null;
  let user2 = null;
  let stakeholder1 = null;
  let stakeholder2 = null;
  let instrument1 = null;
  let instrument2 = null;
  let uploadedFileUrl = '';
  let uploadedFilename = '';

  try {
    // 0. Setup test users and tokens
    // Login Super Admin
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const loginData = await loginRes.json();
    superAdminToken = loginData.data.token;

    // Create or find Field Verification Officer (for role authorization test)
    let fvoUser = await User.findOne({ email: 'phase4_fvo@doca.gov.in' });
    if (!fvoUser) {
      fvoUser = new User({
        name: 'Phase 4 Field Officer',
        email: 'phase4_fvo@doca.gov.in',
        phone: '9876543209',
        role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
        jurisdiction: { state: 'Delhi', district: 'New Delhi' },
        isActive: true,
      });
      fvoUser.password = 'FieldOfficer@123';
      await fvoUser.save();
    }
    const fvoLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase4_fvo@doca.gov.in', password: 'FieldOfficer@123' }),
    });
    const fvoData = await fvoLogin.json();
    fvoToken = fvoData.data.token;

    // Create Business User 1
    user1 = await User.findOne({ email: 'phase4_biz1@example.com' });
    if (!user1) {
      user1 = new User({
        name: 'Phase 4 Biz One',
        email: 'phase4_biz1@example.com',
        phone: '9876543211',
        role: USER_ROLES.BUSINESS_USER,
        isActive: true,
      });
      user1.password = 'SecurePassword@123';
      await user1.save();
    }
    stakeholder1 = await Stakeholder.findOne({ user: user1._id });
    if (!stakeholder1) {
      stakeholder1 = new Stakeholder({
        user: user1._id,
        businessName: 'Phase 4 Enterprise One Ltd',
        tradeLicenseNumber: 'TL-P4-001-ALPHA',
        businessType: 'MANUFACTURER',
        registeredAddress: {
          street: '101 Industrial Area',
          city: 'New Delhi',
          district: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
        },
        contactPerson: {
          name: 'Biz One Manager',
          phone: '9876543211',
          email: 'phase4_biz1@example.com',
        },
      });
      await stakeholder1.save();
    } else {
      stakeholder1.businessName = 'Phase 4 Enterprise One Ltd';
      await stakeholder1.save();
    }

    const u1Login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase4_biz1@example.com', password: 'SecurePassword@123' }),
    });
    const u1Data = await u1Login.json();
    user1Token = u1Data.data.token;

    // Create Business User 2
    user2 = await User.findOne({ email: 'phase4_biz2@example.com' });
    if (!user2) {
      user2 = new User({
        name: 'Phase 4 Biz Two',
        email: 'phase4_biz2@example.com',
        phone: '9876543222',
        role: USER_ROLES.BUSINESS_USER,
        isActive: true,
      });
      user2.password = 'SecurePassword@456';
      await user2.save();
    }
    stakeholder2 = await Stakeholder.findOne({ user: user2._id });
    if (!stakeholder2) {
      stakeholder2 = new Stakeholder({
        user: user2._id,
        businessName: 'Phase 4 Traders Two Ltd',
        tradeLicenseNumber: 'TL-P4-002-BETA',
        businessType: 'RETAILER',
        registeredAddress: {
          street: '202 Commercial Complex',
          city: 'New Delhi',
          district: 'New Delhi',
          state: 'Delhi',
          pincode: '110002',
        },
        contactPerson: {
          name: 'Biz Two Manager',
          phone: '9876543222',
          email: 'phase4_biz2@example.com',
        },
      });
      await stakeholder2.save();
    }

    const u2Login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase4_biz2@example.com', password: 'SecurePassword@456' }),
    });
    const u2Data = await u2Login.json();
    user2Token = u2Data.data.token;

    // =========================================================================
    // Test 1: BUSINESS_USER gets own stakeholder profile (GET /api/stakeholders/me -> 200)
    // =========================================================================
    const res1 = await fetch(`${BASE_URL}/api/stakeholders/me`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const data1 = await res1.json();
    const t1Passed =
      res1.status === 200 &&
      data1.success === true &&
      data1.data?.businessName === 'Phase 4 Enterprise One Ltd' &&
      String(data1.data?.user?._id || data1.data?.user) === String(user1._id);
    recordTest(1, 'BUSINESS_USER gets own stakeholder profile -> 200', t1Passed, `Status: ${res1.status}`);

    // =========================================================================
    // Test 2: BUSINESS_USER updates own stakeholder profile (PUT/PATCH /api/stakeholders/me -> 200)
    // =========================================================================
    const res2 = await fetch(`${BASE_URL}/api/stakeholders/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        businessName: 'Phase 4 Enterprise One Updated',
        gstNumber: '07AAAAA0000A1Z5',
        registeredAddress: { street: '101 Industrial Area Extn' },
      }),
    });
    const data2 = await res2.json();
    const dbStakeholder1 = await Stakeholder.findById(stakeholder1._id);
    const t2Passed =
      res2.status === 200 &&
      data2.success === true &&
      dbStakeholder1.businessName === 'Phase 4 Enterprise One Updated' &&
      dbStakeholder1.gstNumber === '07AAAAA0000A1Z5' &&
      dbStakeholder1.registeredAddress.street === '101 Industrial Area Extn';
    recordTest(2, 'BUSINESS_USER updates own stakeholder profile -> 200', t2Passed, `Status: ${res2.status}`);

    // =========================================================================
    // Test 3: BUSINESS_USER attempts to alter their own role via update -> 400
    // =========================================================================
    const res3 = await fetch(`${BASE_URL}/api/stakeholders/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ role: USER_ROLES.SUPER_ADMIN }),
    });
    const data3 = await res3.json();
    const t3Passed = res3.status === 400 && data3.success === false;
    recordTest(3, 'BUSINESS_USER attempts to alter own role -> 400', t3Passed, `Status: ${res3.status}`);

    // =========================================================================
    // Test 4: BUSINESS_USER attempts to self-certify / alter KYC status -> 403
    // =========================================================================
    const res4 = await fetch(`${BASE_URL}/api/stakeholders/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ kycStatus: 'VERIFIED' }),
    });
    const data4 = await res4.json();
    const t4Passed = res4.status === 403 && data4.success === false;
    recordTest(4, 'BUSINESS_USER attempts to alter own KYC status -> 403', t4Passed, `Status: ${res4.status}`);

    // =========================================================================
    // Test 5: Unauthorized user attempts to access another stakeholder profile -> 403
    // =========================================================================
    const res5 = await fetch(`${BASE_URL}/api/stakeholders/${stakeholder2._id}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const data5 = await res5.json();
    const t5Passed = res5.status === 403 && data5.success === false;
    recordTest(5, 'BUSINESS_USER accesses another stakeholder by ID -> 403', t5Passed, `Status: ${res5.status}`);

    // =========================================================================
    // Test 6: Administrative user lists stakeholders -> 200 (with pagination)
    // =========================================================================
    const res6 = await fetch(`${BASE_URL}/api/stakeholders?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const data6 = await res6.json();
    const t6Passed =
      res6.status === 200 &&
      data6.success === true &&
      Array.isArray(data6.data?.items) &&
      data6.data.items.length >= 2 &&
      data6.data?.pagination?.page === 1;
    recordTest(6, 'Admin lists stakeholders with pagination -> 200', t6Passed, `Count: ${data6.data?.items?.length}`);

    // =========================================================================
    // Test 7: Administrative user retrieves stakeholder by ID -> 200
    // =========================================================================
    const res7 = await fetch(`${BASE_URL}/api/stakeholders/${stakeholder1._id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const data7 = await res7.json();
    const t7Passed =
      res7.status === 200 &&
      data7.success === true &&
      String(data7.data?._id) === String(stakeholder1._id);
    recordTest(7, 'Admin retrieves stakeholder by ID -> 200', t7Passed, `Status: ${res7.status}`);

    // =========================================================================
    // Test 8: Administrative user updates stakeholder KYC status -> 200
    // =========================================================================
    const res8 = await fetch(`${BASE_URL}/api/stakeholders/${stakeholder1._id}/kyc-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        kycStatus: 'VERIFIED',
        kycRemarks: 'Physical trade license verified at DoCA zonal office',
      }),
    });
    const data8 = await res8.json();
    const reloadedStakeholder1 = await Stakeholder.findById(stakeholder1._id);
    const t8Passed =
      res8.status === 200 &&
      data8.success === true &&
      reloadedStakeholder1.kycStatus === 'VERIFIED';
    recordTest(8, 'Admin updates stakeholder KYC status -> 200', t8Passed, `Status: ${res8.status}`);

    // =========================================================================
    // Test 9: BUSINESS_USER creates an instrument under own stakeholder profile -> 201
    // =========================================================================
    const uniqueSerial1 = `SN-P4-A-${Date.now()}`;
    const instrumentPayload1 = {
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'Electronic Bench Scale',
      manufacturer: 'Avery Weigh-Tronix',
      modelNumber: 'E-1010',
      serialNumber: uniqueSerial1,
      capacity: { value: 30, unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
      verificationScaleInterval_e: '5g',
      minimumCapacity_Min: '100g',
      dateOfManufacture: '2024-01-15',
      verificationFrequencyMonths: 12,
      remarks: 'Operational scale at dispatch counter',
      installationAddress: {
        premiseName: 'Main Dispatch Counter',
        addressLine: '101 Industrial Area',
        city: 'New Delhi',
        district: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
    };

    const res9 = await fetch(`${BASE_URL}/api/instruments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify(instrumentPayload1),
    });
    const data9 = await res9.json();
    instrument1 = data9.data;
    const t9Passed =
      res9.status === 201 &&
      data9.success === true &&
      Boolean(data9.data?.instrumentId) &&
      data9.data?.serialNumber === uniqueSerial1 &&
      data9.data?.status === INSTRUMENT_STATUSES.PENDING_VERIFICATION &&
      String(data9.data?.stakeholder?._id || data9.data?.stakeholder) === String(stakeholder1._id);
    recordTest(9, 'BUSINESS_USER creates instrument under own profile -> 201', t9Passed, `Status: ${res9.status}`);

    // =========================================================================
    // Test 10: BUSINESS_USER attempts to register with another stakeholderId -> forced to own stakeholder
    // =========================================================================
    const uniqueSerial2 = `SN-P4-B-${Date.now()}`;
    const instrumentPayload2 = {
      category: INSTRUMENT_CATEGORIES.COUNTER_SCALE,
      instrumentType: 'Digital Counter Scale',
      manufacturer: 'Essae-Teraoka',
      modelNumber: 'DS-215',
      serialNumber: uniqueSerial2,
      capacity: { value: 15, unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
      verificationScaleInterval_e: '2g',
      stakeholderId: String(stakeholder2._id), // Attempting to assign to stakeholder 2
      installationAddress: {
        premiseName: 'Retail Counter',
        addressLine: '101 Industrial Area',
        city: 'New Delhi',
        district: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
    };

    const res10 = await fetch(`${BASE_URL}/api/instruments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify(instrumentPayload2),
    });
    const data10 = await res10.json();
    const t10Passed =
      res10.status === 201 &&
      data10.success === true &&
      String(data10.data?.stakeholder?._id || data10.data?.stakeholder) === String(stakeholder1._id);
    recordTest(10, 'BUSINESS_USER cannot hijack ownership to another stakeholder -> 201 (enforces own)', t10Passed, `Status: ${res10.status}`);

    // =========================================================================
    // Test 11: Instrument creation with missing mandatory fields -> 400
    // =========================================================================
    const res11 = await fetch(`${BASE_URL}/api/instruments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        instrumentType: 'Incomplete Instrument',
        // Missing manufacturer, serialNumber, capacity, accuracyClass, address
      }),
    });
    const data11 = await res11.json();
    const t11Passed = res11.status === 400 && data11.success === false;
    recordTest(11, 'Instrument creation with missing mandatory fields -> 400', t11Passed, `Status: ${res11.status}`);

    // =========================================================================
    // Test 12: Duplicate instrument registration (same manufacturer + serialNumber) -> 409
    // =========================================================================
    const duplicatePayload = {
      ...instrumentPayload1,
      serialNumber: uniqueSerial1, // Same as instrument1
      manufacturer: 'Avery Weigh-Tronix',
    };
    const res12 = await fetch(`${BASE_URL}/api/instruments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify(duplicatePayload),
    });
    const data12 = await res12.json();
    const t12Passed = res12.status === 409 && data12.success === false;
    recordTest(12, 'Duplicate instrument (manufacturer + serialNumber) -> 409', t12Passed, `Status: ${res12.status}`);

    // =========================================================================
    // Test 13: Unauthorized role (FIELD_VERIFICATION_OFFICER) attempts instrument creation -> 403
    // =========================================================================
    const res13 = await fetch(`${BASE_URL}/api/instruments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fvoToken}`,
      },
      body: JSON.stringify({
        ...instrumentPayload1,
        serialNumber: `SN-FVO-${Date.now()}`,
        stakeholderId: String(stakeholder1._id),
      }),
    });
    const data13 = await res13.json();
    const t13Passed = res13.status === 403 && data13.success === false;
    recordTest(13, 'Unauthorized officer role creates instrument -> 403', t13Passed, `Status: ${res13.status}`);

    // Also register an instrument for Business User 2 for multi-tenant isolation tests
    const uniqueSerial3 = `SN-P4-C-${Date.now()}`;
    const instrumentPayload3 = {
      category: INSTRUMENT_CATEGORIES.PRECISION_BALANCE,
      instrumentType: 'Micro Precision Balance',
      manufacturer: 'Mettler Toledo',
      modelNumber: 'XPE-205',
      serialNumber: uniqueSerial3,
      capacity: { value: 220, unit: 'g' },
      accuracyClass: ACCURACY_CLASSES.CLASS_I_SPECIAL,
      verificationScaleInterval_e: '0.01mg',
      dateOfManufacture: '2023-11-20',
      installationAddress: {
        premiseName: 'Gold Assay Lab',
        addressLine: '202 Commercial Complex',
        city: 'New Delhi',
        district: 'New Delhi',
        state: 'Delhi',
        pincode: '110002',
      },
    };
    const resCreateU2 = await fetch(`${BASE_URL}/api/instruments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify(instrumentPayload3),
    });
    const dataCreateU2 = await resCreateU2.json();
    instrument2 = dataCreateU2.data;

    // =========================================================================
    // Test 14: BUSINESS_USER lists instruments and receives ONLY own instruments -> 200
    // =========================================================================
    const res14 = await fetch(`${BASE_URL}/api/instruments`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const data14 = await res14.json();
    const user1Instruments = data14.data?.items || [];
    const allBelongToUser1 = user1Instruments.every(
      (inst) => String(inst.stakeholder?._id || inst.stakeholder) === String(stakeholder1._id)
    );
    const t14Passed =
      res14.status === 200 &&
      data14.success === true &&
      user1Instruments.length >= 2 &&
      allBelongToUser1 === true;
    recordTest(14, 'BUSINESS_USER lists only own instruments (data isolation) -> 200', t14Passed, `Count: ${user1Instruments.length}`);

    // =========================================================================
    // Test 15: Administrative role lists all instruments -> 200
    // =========================================================================
    const res15 = await fetch(`${BASE_URL}/api/instruments`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const data15 = await res15.json();
    const allItems = data15.data?.items || [];
    const containsBothStakeholders =
      allItems.some((inst) => String(inst.stakeholder?._id || inst.stakeholder) === String(stakeholder1._id)) &&
      allItems.some((inst) => String(inst.stakeholder?._id || inst.stakeholder) === String(stakeholder2._id));
    const t15Passed = res15.status === 200 && data15.success === true && containsBothStakeholders;
    recordTest(15, 'Admin lists all instruments across all stakeholders -> 200', t15Passed, `Total: ${allItems.length}`);

    // =========================================================================
    // Test 16: Instrument search and filtering works -> 200
    // =========================================================================
    const res16 = await fetch(`${BASE_URL}/api/instruments?category=${INSTRUMENT_CATEGORIES.PRECISION_BALANCE}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const data16 = await res16.json();
    const filteredItems = data16.data?.items || [];
    const allPrecisionBalances = filteredItems.every(
      (inst) => inst.category === INSTRUMENT_CATEGORIES.PRECISION_BALANCE
    );
    const t16Passed = res16.status === 200 && filteredItems.length >= 1 && allPrecisionBalances;
    recordTest(16, 'Instrument category filtering works -> 200', t16Passed, `Filtered count: ${filteredItems.length}`);

    // =========================================================================
    // Test 17: BUSINESS_USER retrieves own instrument by ID -> 200
    // =========================================================================
    const res17 = await fetch(`${BASE_URL}/api/instruments/${instrument1._id}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const data17 = await res17.json();
    const t17Passed =
      res17.status === 200 &&
      data17.success === true &&
      String(data17.data?._id) === String(instrument1._id);
    recordTest(17, 'BUSINESS_USER retrieves own instrument by ID -> 200', t17Passed, `Status: ${res17.status}`);

    // =========================================================================
    // Test 18: BUSINESS_USER attempts to retrieve another user's instrument by ID -> 403
    // =========================================================================
    const res18 = await fetch(`${BASE_URL}/api/instruments/${instrument2._id}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const data18 = await res18.json();
    const t18Passed = res18.status === 403 && data18.success === false;
    recordTest(18, 'BUSINESS_USER retrieves another user\'s instrument -> 403', t18Passed, `Status: ${res18.status}`);

    // =========================================================================
    // Test 19: BUSINESS_USER updates allowed fields of own instrument -> 200
    // =========================================================================
    const res19 = await fetch(`${BASE_URL}/api/instruments/${instrument1._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        remarks: 'Updated remark: Calibration verified with standard deadweights',
        minimumCapacity_Min: '200g',
      }),
    });
    const data19 = await res19.json();
    const dbInst1 = await Instrument.findById(instrument1._id);
    const t19Passed =
      res19.status === 200 &&
      data19.success === true &&
      dbInst1.remarks === 'Updated remark: Calibration verified with standard deadweights' &&
      dbInst1.minimumCapacity_Min === '200g';
    recordTest(19, 'BUSINESS_USER updates allowed fields of own instrument -> 200', t19Passed, `Status: ${res19.status}`);

    // =========================================================================
    // Test 20: BUSINESS_USER attempts to modify protected verification fields -> 403
    // =========================================================================
    const res20 = await fetch(`${BASE_URL}/api/instruments/${instrument1._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
      }),
    });
    const data20 = await res20.json();
    const t20Passed = res20.status === 403 && data20.success === false;
    recordTest(20, 'BUSINESS_USER attempts to self-verify instrument status -> 403', t20Passed, `Status: ${res20.status}`);

    // =========================================================================
    // Test 21: BUSINESS_USER attempts to update another user's instrument -> 403
    // =========================================================================
    const res21 = await fetch(`${BASE_URL}/api/instruments/${instrument2._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ remarks: 'Malicious modification attempt' }),
    });
    const data21 = await res21.json();
    const t21Passed = res21.status === 403 && data21.success === false;
    recordTest(21, 'BUSINESS_USER attempts to update another user\'s instrument -> 403', t21Passed, `Status: ${res21.status}`);

    // =========================================================================
    // Test 22: Safe deactivation / Delete with statutory history
    // =========================================================================
    // Create a temporary application for instrument1 to simulate statutory history
    const dummyApp = new VerificationApplication({
      applicationNumber: `APP-TEST-P4-${Date.now()}`,
      stakeholder: stakeholder1._id,
      instrument: instrument1._id,
      currentStatus: 'UNDER_REVIEW',
    });
    await dummyApp.save();

    const res22 = await fetch(`${BASE_URL}/api/instruments/${instrument1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const data22 = await res22.json();
    const dbArchivedInst = await Instrument.findById(instrument1._id);
    const t22Passed =
      res22.status === 200 &&
      data22.success === true &&
      data22.data?.deactivated === true &&
      dbArchivedInst !== null &&
      dbArchivedInst.isActive === false &&
      dbArchivedInst.status === INSTRUMENT_STATUSES.OUT_OF_SERVICE;
    recordTest(22, 'Delete instrument with statutory history -> safely deactivated (OUT_OF_SERVICE)', t22Passed, `Status: ${res22.status}`);

    // =========================================================================
    // Test 23: Document upload for instrument (POST /api/instruments/:id/documents -> 201)
    // =========================================================================
    const testDocBlob = new Blob(['%PDF-1.4 Mock Manufacturer Test Certificate'], { type: 'application/pdf' });
    const formDataDoc = new FormData();
    formDataDoc.append('document', testDocBlob, 'mfr-cert-test.pdf');
    formDataDoc.append('title', 'Manufacturer Conformity Certificate');
    formDataDoc.append('docType', 'MANUFACTURER_TEST_CERTIFICATE');

    const res23 = await fetch(`${BASE_URL}/api/instruments/${instrument1._id}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: formDataDoc,
    });
    const data23 = await res23.json();
    const uploadedDoc = data23.data?.documents?.find((d) => d.title === 'Manufacturer Conformity Certificate');
    uploadedFileUrl = uploadedDoc?.fileUrl || '';
    uploadedFilename = uploadedFileUrl.split('/').pop() || '';

    const t23Passed =
      res23.status === 201 &&
      data23.success === true &&
      Boolean(uploadedDoc) &&
      uploadedDoc.docType === 'MANUFACTURER_TEST_CERTIFICATE' &&
      Boolean(uploadedDoc.fileUrl);
    recordTest(23, 'Document upload for instrument -> 201', t23Passed, `Uploaded: ${uploadedFilename}`);

    // =========================================================================
    // Test 24: File Access Security (/uploads/documents/:filename)
    // - Unauthenticated -> 401
    // - Unauthorized (User 2 accessing User 1's doc) -> 403
    // - Authorized (User 1 or Admin accessing) -> 200
    // =========================================================================
    // 24a: Unauthenticated access
    const res24a = await fetch(`${BASE_URL}${uploadedFileUrl}`);
    const t24aPassed = res24a.status === 401;

    // 24b: User 2 accessing User 1's file
    const res24b = await fetch(`${BASE_URL}${uploadedFileUrl}`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    const t24bPassed = res24b.status === 403;

    // 24c: User 1 (owner) accessing file
    const res24c = await fetch(`${BASE_URL}${uploadedFileUrl}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const t24cPassed = res24c.status === 200;

    const t24Passed = t24aPassed && t24bPassed && t24cPassed;
    recordTest(
      24,
      'File Access Security (Unauthenticated 401, User2 403, Owner 200)',
      t24Passed,
      `Unauth: ${res24a.status}, Cross-user: ${res24b.status}, Owner: ${res24c.status}`
    );

    // =========================================================================
    // Summary
    // =========================================================================
    console.log('\n===============================================================');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`Phase 4 Test Results: ${passedCount}/${results.length} PASSED`);
    if (passedCount === results.length) {
      console.log('🎉 ALL 24 PHASE 4 TEST CRITERIA PASSED WITH ZERO DEFECTS!');
    } else {
      console.log(`⚠️ ${results.length - passedCount} TESTS FAILED.`);
    }
    console.log('===============================================================\n');
  } catch (err) {
    console.error('💥 Test suite encountered unhandled exception:', err);
  } finally {
    await disconnectDB();
  }
}

runAllTests();
