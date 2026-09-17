import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { USER_ROLES } from '../config/constants.js';

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

async function runAuthSecurityTests() {
  console.log('===============================================================');
  console.log('🔒 Phase 12 Part 2 — Authentication & JWT Security Hardening');
  console.log('===============================================================');

  // Connect to real MongoDB
  await connectDB();

  try {
    // Setup test users in real MongoDB
    const testAdminEmail = 'auth_sec_admin@apexweigh.com';
    const testUserEmail = 'auth_sec_user@apexweigh.com';
    const testDeactivatedEmail = 'auth_sec_deactivated@apexweigh.com';
    const testPassword = 'Password123#Secure';

    // Upsert Admin user
    let adminUser = await User.findOne({ email: testAdminEmail });
    if (!adminUser) {
      adminUser = new User({
        name: 'Auth Sec Admin',
        email: testAdminEmail,
        password: testPassword,
        role: USER_ROLES.ADMIN,
        isActive: true,
      });
      await adminUser.save();
    } else {
      adminUser.password = testPassword;
      adminUser.isActive = true;
      await adminUser.save();
    }

    // Upsert Normal user
    let normalUser = await User.findOne({ email: testUserEmail });
    if (!normalUser) {
      normalUser = new User({
        name: 'Auth Sec User',
        email: testUserEmail,
        password: testPassword,
        role: USER_ROLES.BUSINESS_USER,
        isActive: true,
      });
      await normalUser.save();
    } else {
      normalUser.password = testPassword;
      normalUser.isActive = true;
      await normalUser.save();
    }

    // Upsert Deactivated user
    let deactivatedUser = await User.findOne({ email: testDeactivatedEmail });
    if (!deactivatedUser) {
      deactivatedUser = new User({
        name: 'Auth Sec Deactivated',
        email: testDeactivatedEmail,
        password: testPassword,
        role: USER_ROLES.BUSINESS_USER,
        isActive: false,
      });
      await deactivatedUser.save();
    } else {
      deactivatedUser.password = testPassword;
      deactivatedUser.isActive = false;
      await deactivatedUser.save();
    }

    console.log('\n--- 1. AUTHENTICATION & LOGIN WORKFLOWS ---');

    // Test 1: Valid credentials login -> returns 200, JWT token, and user profile
    const loginRes = await api('/api/auth/login', {
      method: 'POST',
      body: { email: testUserEmail, password: testPassword },
    });
    const validToken = loginRes.data?.data?.token;
    assert(
      loginRes.status === 200 && typeof validToken === 'string' && validToken.split('.').length === 3,
      'Valid login returns HTTP 200 and standard 3-part JWT',
      `Status: ${loginRes.status}, Token received: ${!!validToken}`
    );

    // Test 2: Valid JWT accesses protected /api/auth/me
    const meRes = await api('/api/auth/me', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert(
      meRes.status === 200 && meRes.data?.data?.user?.email === testUserEmail,
      'Valid JWT token grants access to protected /api/auth/me',
      `Status: ${meRes.status}, User Email: ${meRes.data?.data?.user?.email}`
    );

    // Test 3: Missing JWT returns 401 Unauthorized
    const missingRes = await api('/api/auth/me');
    assert(
      missingRes.status === 401 && missingRes.data?.success === false,
      'Missing Authorization header is rejected with HTTP 401',
      `Status: ${missingRes.status}`
    );

    // Test 4: Malformed JWT format returns 401 Unauthorized
    const malformedRes = await api('/api/auth/me', {
      headers: { Authorization: 'Bearer this-is-not-a-valid-token' },
    });
    assert(
      malformedRes.status === 401 && malformedRes.data?.success === false,
      'Malformed JWT string is rejected with HTTP 401',
      `Status: ${malformedRes.status}`
    );

    // Test 5: Expired JWT returns 401 Unauthorized
    const expiredToken = jwt.sign(
      { id: normalUser._id, role: normalUser.role, email: normalUser.email },
      ENV.JWT_SECRET,
      { expiresIn: '1ms' }
    );
    await new Promise((r) => setTimeout(r, 20));
    const expiredRes = await api('/api/auth/me', {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert(
      expiredRes.status === 401 && (expiredRes.data?.message?.toLowerCase().includes('expired') || expiredRes.data?.success === false),
      'Expired JWT is rejected with HTTP 401',
      `Status: ${expiredRes.status}, Message: ${expiredRes.data?.message}`
    );

    // Test 6: Invalid JWT signature (signed with incorrect secret) returns 401 Unauthorized
    const forgedToken = jwt.sign(
      { id: normalUser._id, role: normalUser.role, email: normalUser.email },
      'forged_secret_key_1234567890_abcdef',
      { expiresIn: '1h' }
    );
    const forgedRes = await api('/api/auth/me', {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert(
      forgedRes.status === 401 && forgedRes.data?.success === false,
      'Forged JWT with invalid signature is rejected with HTTP 401',
      `Status: ${forgedRes.status}`
    );

    console.log('\n--- 2. DEACTIVATED USER RESTRICTIONS ---');

    // Test 7: Deactivated user credentials login is rejected with HTTP 401
    const deactLoginRes = await api('/api/auth/login', {
      method: 'POST',
      body: { email: testDeactivatedEmail, password: testPassword },
    });
    assert(
      deactLoginRes.status === 401 && deactLoginRes.data?.success === false,
      'Deactivated user cannot login (HTTP 401)',
      `Status: ${deactLoginRes.status}`
    );

    // Test 8: Previously issued token for a user who becomes deactivated is rejected on subsequent requests
    const activeTokenForUser = jwt.sign(
      { id: deactivatedUser._id, role: deactivatedUser.role, email: deactivatedUser.email },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const deactTokenRes = await api('/api/auth/me', {
      headers: { Authorization: `Bearer ${activeTokenForUser}` },
    });
    assert(
      deactTokenRes.status === 401 && deactTokenRes.data?.message?.toLowerCase().includes('deactivated'),
      'Token for deactivated user is rejected on protected endpoints with HTTP 401',
      `Status: ${deactTokenRes.status}, Message: ${deactTokenRes.data?.message}`
    );

    console.log('\n--- 3. PASSWORD SECURITY & HASHING INTEGRITY ---');

    // Test 9: Passwords in MongoDB are bcrypt hashed (salt 12) and never stored as plaintext
    const dbUser = await User.findById(normalUser._id).select('+password');
    const isBcrypt = dbUser.password && /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(dbUser.password);
    const plainNotPresent = dbUser.password !== testPassword;
    assert(
      isBcrypt && plainNotPresent,
      'Password in MongoDB is properly bcrypt-hashed and never stored in plaintext',
      `Hash prefix: ${dbUser.password?.substring(0, 7)}, Length: ${dbUser.password?.length}`
    );

    // Test 10: Password field is NOT returned in login API response
    const loginUserObj = loginRes.data?.data?.user;
    const loginHasNoPassword = !loginUserObj?.password && !JSON.stringify(loginRes.data).includes(testPassword);
    assert(
      loginHasNoPassword,
      'Password is never returned in login API response payload',
      `user.password exists: ${!!loginUserObj?.password}`
    );

    // Test 11: Password field is NOT returned in /api/auth/me API response
    const meUserObj = meRes.data?.data?.user;
    const meHasNoPassword = !meUserObj?.password && !JSON.stringify(meRes.data).includes(testPassword);
    assert(
      meHasNoPassword,
      'Password is never returned in /api/auth/me API response payload',
      `user.password exists: ${!!meUserObj?.password}`
    );

    // Test 12: Admin lists users - passwords are NOT exposed on any user in list
    const adminLoginRes = await api('/api/auth/login', {
      method: 'POST',
      body: { email: testAdminEmail, password: testPassword },
    });
    const adminToken = adminLoginRes.data?.data?.token;

    const listUsersRes = await api('/api/users?limit=5', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const rawData = listUsersRes.data?.data;
    const usersList = Array.isArray(rawData?.users)
      ? rawData.users
      : Array.isArray(rawData?.items)
      ? rawData.items
      : Array.isArray(rawData)
      ? rawData
      : [];
    const anyUserHasPassword = usersList.some((u) => u.password !== undefined);
    assert(
      listUsersRes.status === 200 && usersList.length > 0 && !anyUserHasPassword,
      'User management listing API does not expose password hashes',
      `Users inspected: ${usersList.length}, Has password field: ${anyUserHasPassword}`
    );

    console.log('\n--- 4. SECRET LEAKAGE & SENSITIVE DATA PREVENTION ---');

    // Test 13: JWT secret is never returned in responses
    const responseJsonStr = JSON.stringify(loginRes.data) + JSON.stringify(meRes.data) + JSON.stringify(listUsersRes.data);
    const jwtSecretExposed = responseJsonStr.includes(ENV.JWT_SECRET);
    assert(
      !jwtSecretExposed,
      'Server JWT_SECRET is never exposed in any API response payload',
      `Exposed: ${jwtSecretExposed}`
    );

    // Test 14: MongoDB connection string is never exposed in error responses
    const errorRes = await api('/api/users/not-a-valid-id', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const errorStr = JSON.stringify(errorRes.data);
    const mongoUriExposed = errorStr.includes('mongodb') || errorStr.includes('cluster0');
    assert(
      !mongoUriExposed,
      'Database connection strings and secrets are never exposed in error responses',
      `Error status: ${errorRes.status}, Leaked: ${mongoUriExposed}`
    );

    // Test 15: JWT token is never unnecessarily exposed in /api/auth/me or /api/auth/profile
    const meData = meRes.data?.data;
    const meExposesToken = meData?.token !== undefined || meData?.user?.token !== undefined;
    assert(
      !meExposesToken,
      'JWT token is not redundantly exposed in /api/auth/me profile responses',
      `Token present in me response: ${meExposesToken}`
    );

    console.log('\n--- 5. CREDENTIAL VALIDATION & PROTECTED ROUTE ENFORCEMENT ---');

    // Test 16: Wrong password returns generic 401 without leaking internal details
    const wrongPassRes = await api('/api/auth/login', {
      method: 'POST',
      body: { email: testUserEmail, password: 'WrongPassword999#' },
    });
    assert(
      wrongPassRes.status === 401 && wrongPassRes.data?.message?.includes('Invalid email address or password'),
      'Wrong password is safe and uniformly rejected with HTTP 401',
      `Status: ${wrongPassRes.status}, Message: "${wrongPassRes.data?.message}"`
    );

    // Test 17: Non-existent email returns generic 401 without leaking account existence
    const nonExistRes = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'non_existent_account_9999@apexweigh.com', password: 'Password123#Secure' },
    });
    assert(
      nonExistRes.status === 401 && nonExistRes.data?.message?.includes('Invalid email address or password'),
      'Non-existent email uses uniform HTTP 401 error message to prevent user enumeration',
      `Status: ${nonExistRes.status}, Message: "${nonExistRes.data?.message}"`
    );

    // Test 18: Missing credentials return 400 Bad Request
    const missingCredsRes = await api('/api/auth/login', {
      method: 'POST',
      body: {},
    });
    assert(
      missingCredsRes.status === 400,
      'Missing login credentials body returns HTTP 400 Bad Request',
      `Status: ${missingCredsRes.status}`
    );

    // Test 19: Protected /api/instruments rejects unauthenticated access
    const unauthInstRes = await api('/api/instruments');
    assert(
      unauthInstRes.status === 401,
      'Protected /api/instruments rejects unauthenticated request with HTTP 401',
      `Status: ${unauthInstRes.status}`
    );

    // Test 20: Protected /api/applications rejects unauthenticated access
    const unauthAppRes = await api('/api/applications');
    assert(
      unauthAppRes.status === 401,
      'Protected /api/applications rejects unauthenticated request with HTTP 401',
      `Status: ${unauthAppRes.status}`
    );

    // Test 21: Protected /api/inspections rejects unauthenticated access
    const unauthInspRes = await api('/api/inspections');
    assert(
      unauthInspRes.status === 401,
      'Protected /api/inspections rejects unauthenticated request with HTTP 401',
      `Status: ${unauthInspRes.status}`
    );

    // Test 22: Protected /api/certificates rejects unauthenticated access
    const unauthCertRes = await api('/api/certificates');
    assert(
      unauthCertRes.status === 401,
      'Protected /api/certificates rejects unauthenticated request with HTTP 401',
      `Status: ${unauthCertRes.status}`
    );

    // Test 23: Protected /api/schedules rejects unauthenticated access
    const unauthSchedRes = await api('/api/schedules');
    assert(
      unauthSchedRes.status === 401,
      'Protected /api/schedules rejects unauthenticated request with HTTP 401',
      `Status: ${unauthSchedRes.status}`
    );

    // Test 24: Protected /api/audit-logs rejects unauthenticated access
    const unauthAuditRes = await api('/api/audit-logs');
    assert(
      unauthAuditRes.status === 401,
      'Protected /api/audit-logs rejects unauthenticated request with HTTP 401',
      `Status: ${unauthAuditRes.status}`
    );

    // Summary
    console.log('\n===============================================================');
    console.log(`📊 AUTHENTICATION SECURITY QA RESULTS: ${passed}/${passed + failed} PASSED`);
    console.log('===============================================================');

    if (failed > 0) {
      console.error(`⚠️ ${failed} tests failed!`);
      failureDetails.forEach((f) => console.error(f));
      process.exit(1);
    } else {
      console.log('🎉 ALL 24 AUTHENTICATION & JWT SECURITY TESTS PASSED WITH ZERO DEFECTS!');
    }
  } finally {
    await disconnectDB();
    console.log('[DATABASE] MongoDB connection closed safely.');
  }
}

runAuthSecurityTests().catch((err) => {
  console.error('Fatal error running authentication security tests:', err);
  process.exit(1);
});
