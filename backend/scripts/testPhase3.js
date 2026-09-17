import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { USER_ROLES } from '../config/constants.js';

const BASE_URL = 'http://localhost:3000';

const results = [];

function recordTest(id, name, passed, details = '') {
  results.push({ id, name, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${symbol}] Test ${id}: ${name} ${details ? `(${details})` : ''}`);
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('🧪 Starting Phase 3: Auth, RBAC & User Management Test Suite');
  console.log('===============================================================\n');

  await connectDB();

  const adminEmail = ENV.ADMIN_INITIAL_EMAIL;
  const adminPassword = ENV.ADMIN_INITIAL_PASSWORD;

  // Test identifiers and variables
  let superAdminToken = '';
  let adminToken = '';
  let businessUser1Token = '';
  let businessUser2Token = '';
  let businessUser1 = null;
  let businessUser2 = null;
  let stakeholder1 = null;
  let stakeholder2 = null;
  let instrument1 = null;
  let testCreatedUserId = '';

  try {
    // -------------------------------------------------------------
    // Test 1: Valid login -> 200
    // -------------------------------------------------------------
    const res1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const data1 = await res1.json();
    const t1Passed =
      res1.status === 200 &&
      data1.success === true &&
      Boolean(data1.data?.token) &&
      data1.data?.role === USER_ROLES.SUPER_ADMIN &&
      Boolean(data1.data?.expiresIn) &&
      data1.data?.user?.password === undefined;
    recordTest(1, 'Valid login -> 200', t1Passed, `Status: ${res1.status}`);
    superAdminToken = data1.data?.token;

    // -------------------------------------------------------------
    // Test 2: Wrong password -> 401
    // -------------------------------------------------------------
    const res2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'WrongPassword999!' }),
    });
    recordTest(2, 'Wrong password -> 401', res2.status === 401, `Status: ${res2.status}`);

    // -------------------------------------------------------------
    // Test 3: Unknown email -> 401
    // -------------------------------------------------------------
    const res3 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_user_xyz@test.gov.in', password: 'Password123!' }),
    });
    recordTest(3, 'Unknown email -> 401', res3.status === 401, `Status: ${res3.status}`);

    // -------------------------------------------------------------
    // Test 4: Missing credentials -> 400
    // -------------------------------------------------------------
    const res4 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    recordTest(4, 'Missing credentials -> 400', res4.status === 400, `Status: ${res4.status}`);

    // -------------------------------------------------------------
    // Test 5: Expired JWT -> 401
    // -------------------------------------------------------------
    const superAdminUser = await User.findOne({ email: adminEmail });
    const expiredToken = jwt.sign(
      { id: superAdminUser._id, role: superAdminUser.role, email: superAdminUser.email },
      ENV.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const res5 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    recordTest(5, 'Expired JWT -> 401', res5.status === 401, `Status: ${res5.status}`);

    // -------------------------------------------------------------
    // Test 6: Invalid JWT -> 401
    // -------------------------------------------------------------
    const res6 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid.token.payload' },
    });
    recordTest(6, 'Invalid JWT -> 401', res6.status === 401, `Status: ${res6.status}`);

    // -------------------------------------------------------------
    // Test 7: Missing JWT -> 401
    // -------------------------------------------------------------
    const res7 = await fetch(`${BASE_URL}/api/auth/me`);
    recordTest(7, 'Missing JWT -> 401', res7.status === 401, `Status: ${res7.status}`);

    // -------------------------------------------------------------
    // Test 8: SUPER_ADMIN accessing admin API -> 200
    // -------------------------------------------------------------
    const res8 = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    recordTest(8, 'SUPER_ADMIN accessing admin API -> 200', res8.status === 200, `Status: ${res8.status}`);

    // Create an ADMIN user for testing
    const testAdminEmail = `deputy_admin_${Date.now()}@doca.gov.in`;
    const resCreateAdmin = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Deputy Administrator',
        email: testAdminEmail,
        password: 'AdminPassword123!',
        phone: '9876543211',
        role: USER_ROLES.ADMIN,
        designation: 'Deputy Controller',
        jurisdiction: { state: 'Delhi', district: 'Central Delhi', zone: 'North' },
      }),
    });
    const createAdminData = await resCreateAdmin.json();

    // Login as ADMIN
    const resLoginAdmin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: 'AdminPassword123!' }),
    });
    const loginAdminData = await resLoginAdmin.json();
    adminToken = loginAdminData.data?.token;

    // -------------------------------------------------------------
    // Test 9: ADMIN accessing admin API -> 200
    // -------------------------------------------------------------
    const res9 = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    recordTest(9, 'ADMIN accessing admin API -> 200', res9.status === 200, `Status: ${res9.status}`);

    // Setup 2 BUSINESS_USERs and Stakeholders for testing
    const bu1Email = `trader1_${Date.now()}@business.in`;
    const bu2Email = `trader2_${Date.now()}@business.in`;

    // Create Business User 1
    const resCreateBu1 = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Trader One',
        email: bu1Email,
        password: 'TraderPass123!',
        phone: '9811111111',
        role: USER_ROLES.BUSINESS_USER,
        organization: 'Apex Trade Enterprises',
      }),
    });
    const bu1Data = await resCreateBu1.json();
    businessUser1 = bu1Data.data;

    stakeholder1 = await Stakeholder.create({
      user: businessUser1._id,
      businessName: 'Apex Trade Enterprises',
      tradeLicenseNumber: `TL-${Date.now()}-1`,
      businessType: 'RETAILER',
      registeredAddress: {
        street: '123 Market Rd',
        city: 'Delhi',
        district: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      contactPerson: {
        name: 'Trader One',
        designation: 'Managing Director',
        phone: '9811111111',
        email: bu1Email,
      },
      kycStatus: 'VERIFIED',
    });

    // Create Business User 2
    const resCreateBu2 = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Trader Two',
        email: bu2Email,
        password: 'TraderPass123!',
        phone: '9822222222',
        role: USER_ROLES.BUSINESS_USER,
        organization: 'Bharat Wholesale Corp',
      }),
    });
    const bu2Data = await resCreateBu2.json();
    businessUser2 = bu2Data.data;

    stakeholder2 = await Stakeholder.create({
      user: businessUser2._id,
      businessName: 'Bharat Wholesale Corp',
      tradeLicenseNumber: `TL-${Date.now()}-2`,
      businessType: 'DEALER',
      registeredAddress: {
        street: '456 Ring Rd',
        city: 'Delhi',
        district: 'South Delhi',
        state: 'Delhi',
        pincode: '110049',
      },
      contactPerson: {
        name: 'Trader Two',
        designation: 'Partner',
        phone: '9822222222',
        email: bu2Email,
      },
      kycStatus: 'VERIFIED',
    });

    // Log in both business users
    const loginBu1Res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: bu1Email, password: 'TraderPass123!' }),
    });
    businessUser1Token = (await loginBu1Res.json()).data.token;

    const loginBu2Res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: bu2Email, password: 'TraderPass123!' }),
    });
    businessUser2Token = (await loginBu2Res.json()).data.token;

    // -------------------------------------------------------------
    // Test 10: BUSINESS_USER accessing admin API -> 403
    // -------------------------------------------------------------
    const res10 = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${businessUser1Token}` },
    });
    recordTest(10, 'BUSINESS_USER accessing admin API -> 403', res10.status === 403, `Status: ${res10.status}`);

    // -------------------------------------------------------------
    // Test 11: Unauthenticated request to protected API -> 401
    // -------------------------------------------------------------
    const res11 = await fetch(`${BASE_URL}/api/admin/users`);
    recordTest(11, 'Unauthenticated request -> 401', res11.status === 401, `Status: ${res11.status}`);

    // -------------------------------------------------------------
    // Test 12: Admin creates user -> 201
    // -------------------------------------------------------------
    const newOfficerEmail = `lmo_${Date.now()}@doca.gov.in`;
    const res12 = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Field Officer Inspector',
        email: newOfficerEmail,
        password: 'OfficerPass123!',
        phone: '9833333333',
        role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
        designation: 'Legal Metrology Officer',
        jurisdiction: { state: 'Delhi', district: 'North Delhi', zone: 'North' },
      }),
    });
    const data12 = await res12.json();
    testCreatedUserId = data12.data?._id;
    const t12Passed = res12.status === 201 && Boolean(testCreatedUserId) && data12.data?.password === undefined;
    recordTest(12, 'Admin creates user -> 201', t12Passed, `Status: ${res12.status}`);

    // -------------------------------------------------------------
    // Test 13: Duplicate email -> 409
    // -------------------------------------------------------------
    const res13 = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Another Inspector',
        email: newOfficerEmail, // Same email!
        password: 'OfficerPass123!',
        phone: '9844444444',
        role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
      }),
    });
    recordTest(13, 'Duplicate email -> 409', res13.status === 409, `Status: ${res13.status}`);

    // -------------------------------------------------------------
    // Test 14: Invalid role -> 400
    // -------------------------------------------------------------
    const res14 = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Invalid Role User',
        email: `invalid_role_${Date.now()}@doca.gov.in`,
        password: 'OfficerPass123!',
        phone: '9855555555',
        role: 'NON_EXISTENT_SUPER_GOD_ROLE',
      }),
    });
    recordTest(14, 'Invalid role -> 400', res14.status === 400, `Status: ${res14.status}`);

    // -------------------------------------------------------------
    // Test 15: BUSINESS_USER attempts user creation -> 403
    // -------------------------------------------------------------
    const res15 = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${businessUser1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Unauthorized Created User',
        email: `hack_${Date.now()}@doca.gov.in`,
        password: 'HackerPass123!',
        phone: '9866666666',
        role: USER_ROLES.SUPER_ADMIN,
      }),
    });
    recordTest(15, 'BUSINESS_USER attempts user creation -> 403', res15.status === 403, `Status: ${res15.status}`);

    // -------------------------------------------------------------
    // Test 16: Admin lists users -> 200
    // -------------------------------------------------------------
    const res16 = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const data16 = await res16.json();
    const t16Passed =
      res16.status === 200 &&
      Array.isArray(data16.data?.items) &&
      data16.data?.pagination?.total > 0 &&
      !data16.data?.items.some((u) => u.password);
    recordTest(16, 'Admin lists users -> 200', t16Passed, `Count: ${data16.data?.items?.length}`);

    // -------------------------------------------------------------
    // Test 17: Admin gets user -> 200
    // -------------------------------------------------------------
    const res17 = await fetch(`${BASE_URL}/api/admin/users/${testCreatedUserId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const data17 = await res17.json();
    const t17Passed = res17.status === 200 && data17.data?._id === testCreatedUserId && !data17.data?.password;
    recordTest(17, 'Admin gets user -> 200', t17Passed, `Status: ${res17.status}`);

    // -------------------------------------------------------------
    // Test 18: Unauthorized user gets user -> 403
    // -------------------------------------------------------------
    const res18 = await fetch(`${BASE_URL}/api/admin/users/${testCreatedUserId}`, {
      headers: { Authorization: `Bearer ${businessUser1Token}` },
    });
    recordTest(18, 'Unauthorized user gets user -> 403', res18.status === 403, `Status: ${res18.status}`);

    // -------------------------------------------------------------
    // Test 19: Admin updates user -> 200
    // -------------------------------------------------------------
    const res19 = await fetch(`${BASE_URL}/api/admin/users/${testCreatedUserId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Field Officer Inspector Senior',
        designation: 'Senior Legal Metrology Officer',
      }),
    });
    const data19 = await res19.json();
    const t19Passed =
      res19.status === 200 &&
      data19.data?.name === 'Field Officer Inspector Senior' &&
      data19.data?.designation === 'Senior Legal Metrology Officer';
    recordTest(19, 'Admin updates user -> 200', t19Passed, `Status: ${res19.status}`);

    // -------------------------------------------------------------
    // Test 20: Unauthorized user updates user -> 403
    // -------------------------------------------------------------
    const res20 = await fetch(`${BASE_URL}/api/admin/users/${testCreatedUserId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${businessUser1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Hacked Officer Name' }),
    });
    recordTest(20, 'Unauthorized user updates user -> 403', res20.status === 403, `Status: ${res20.status}`);

    // -------------------------------------------------------------
    // Test 21: Admin deactivates user -> 200
    // -------------------------------------------------------------
    const res21 = await fetch(`${BASE_URL}/api/admin/users/${testCreatedUserId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: false }),
    });
    const data21 = await res21.json();
    const t21Passed = res21.status === 200 && data21.data?.isActive === false;
    recordTest(21, 'Admin deactivates user -> 200', t21Passed, `Status: ${res21.status}`);

    // -------------------------------------------------------------
    // Test 22: Deactivated user login -> rejected (401)
    // -------------------------------------------------------------
    const res22 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newOfficerEmail, password: 'OfficerPass123!' }),
    });
    recordTest(22, 'Deactivated user login -> rejected (401)', res22.status === 401, `Status: ${res22.status}`);

    // -------------------------------------------------------------
    // Data Isolation Setup: Register an instrument under Trader 1
    // -------------------------------------------------------------
    const serialNum = `SN-${Date.now()}`;
    const resInstCreate = await fetch(`${BASE_URL}/api/instruments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${businessUser1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: 'NON_AUTOMATIC_WEIGHING_INSTRUMENT',
        instrumentType: 'Electronic Bench Scale',
        manufacturer: 'Avery Weigh-Tronix',
        modelNumber: 'Z100-Series',
        serialNumber: serialNum,
        capacity: {
          value: 150,
          unit: 'kg',
        },
        accuracyClass: 'CLASS_III_MEDIUM',
        verificationScaleInterval_e: '0.05 kg',
        minimumCapacity_Min: '1 kg',
        installationAddress: {
          premiseName: 'Apex Warehouse',
          addressLine: '123 Market Rd',
          city: 'Delhi',
          district: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
        },
      }),
    });
    const instData = await resInstCreate.json();
    if (!resInstCreate.ok) {
      console.error('Instrument creation failed:', resInstCreate.status, instData);
    }
    instrument1 = instData.data;

    // -------------------------------------------------------------
    // Test 23: BUSINESS_USER accesses own instrument -> 200
    // -------------------------------------------------------------
    const res23 = await fetch(`${BASE_URL}/api/instruments/${instrument1._id}`, {
      headers: { Authorization: `Bearer ${businessUser1Token}` },
    });
    recordTest(23, 'BUSINESS_USER accesses own instrument -> 200', res23.status === 200, `Status: ${res23.status}`);

    // -------------------------------------------------------------
    // Test 24: BUSINESS_USER accesses another user's instrument -> 403
    // -------------------------------------------------------------
    const res24 = await fetch(`${BASE_URL}/api/instruments/${instrument1._id}`, {
      headers: { Authorization: `Bearer ${businessUser2Token}` }, // Trader 2 attempting to view Trader 1's instrument
    });
    recordTest(24, "BUSINESS_USER accesses another user's instrument -> 403", res24.status === 403, `Status: ${res24.status}`);

    console.log('\n===============================================================');
    const allPassed = results.every((r) => r.passed);
    console.log(`Phase 3 Test Results: ${results.filter((r) => r.passed).length}/${results.length} PASSED`);
    if (allPassed) {
      console.log('🎉 ALL 24 PHASE 3 TEST CRITERIA PASSED WITH ZERO DEFECTS!');
    } else {
      console.error('⚠️ Some tests failed. Check individual failures above.');
    }
    console.log('===============================================================\n');

    await disconnectDB();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('Fatal test error:', error);
    await disconnectDB();
    process.exit(1);
  }
}

runAllTests();
