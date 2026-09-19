import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';
import { USER_ROLES } from '../config/constants.js';
import { loginUser } from '../services/authService.js';
import { BUSINESS_USERS_DATA } from './seedBusinessUsers.js';

/**
 * Maps user roles to frontend redirect paths as defined in AuthContext.tsx
 */
function getRoleRedirectPath(role) {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin/dashboard';
    case 'LEGAL_METROLOGY_OFFICER':
    case 'FIELD_VERIFICATION_OFFICER':
    case 'GATC_OFFICER':
      return '/officer/dashboard';
    case 'BUSINESS_USER':
      return '/applicant/dashboard';
    default:
      return '/applicant/dashboard';
  }
}

export async function verifyBusinessUsers() {
  console.log('===============================================================');
  console.log('🔍 Starting Comprehensive Verification of 10 BUSINESS_USER Accounts');
  console.log('===============================================================');

  let dbChecksPassed = 0;
  let dbChecksFailed = 0;
  let loginChecksPassed = 0;
  let loginChecksFailed = 0;

  console.log('\n--- Phase 1: MongoDB Database Verification ---');

  for (const expected of BUSINESS_USERS_DATA) {
    const normalizedEmail = expected.email.toLowerCase().trim();

    // 1. Check uniqueness and existence
    const usersFound = await User.find({ email: normalizedEmail }).select('+password');

    if (usersFound.length === 0) {
      console.error(`❌ [MONGODB] User not found: ${normalizedEmail}`);
      dbChecksFailed++;
      continue;
    }

    if (usersFound.length > 1) {
      console.error(`❌ [MONGODB] Duplicate accounts detected for email: ${normalizedEmail} (Found: ${usersFound.length})`);
      dbChecksFailed++;
      continue;
    }

    const userDoc = usersFound[0];

    // 2. Check Name
    const nameMatches = userDoc.name === expected.name;
    if (!nameMatches) {
      console.error(`❌ [MONGODB] Name mismatch for ${normalizedEmail}: expected "${expected.name}", got "${userDoc.name}"`);
      dbChecksFailed++;
    }

    // 3. Check Role
    const roleMatches = userDoc.role === USER_ROLES.BUSINESS_USER;
    if (!roleMatches) {
      console.error(`❌ [MONGODB] Role mismatch for ${normalizedEmail}: expected "${USER_ROLES.BUSINESS_USER}", got "${userDoc.role}"`);
      dbChecksFailed++;
    }

    // 4. Check isActive
    const isActiveMatches = userDoc.isActive === true;
    if (!isActiveMatches) {
      console.error(`❌ [MONGODB] Active status failure for ${normalizedEmail}: expected true, got ${userDoc.isActive}`);
      dbChecksFailed++;
    }

    // 5. Check Password Hashing (never log hash, only verify format and compare)
    const isBcryptHash = typeof userDoc.password === 'string' &&
      (userDoc.password.startsWith('$2a$') || userDoc.password.startsWith('$2b$')) &&
      userDoc.password.length >= 59;

    const notPlaintext = userDoc.password !== expected.password;
    const bcryptValidates = await bcrypt.compare(expected.password, userDoc.password);

    if (!isBcryptHash || !notPlaintext || !bcryptValidates) {
      console.error(`❌ [MONGODB] Password security check failed for ${normalizedEmail}:`);
      console.error(`   - Is valid bcrypt format: ${isBcryptHash}`);
      console.error(`   - Is not plaintext: ${notPlaintext}`);
      console.error(`   - Matches candidate password: ${bcryptValidates}`);
      dbChecksFailed++;
    } else {
      // All DB checks passed for this account
      dbChecksPassed++;
      console.log(`✅ [MONGODB] Verified account ${normalizedEmail} | Name: ${userDoc.name} | Role: ${userDoc.role} | Active: ${userDoc.isActive} | Bcrypt Hashed: YES`);
    }
  }

  console.log(`\nMongoDB Verification Results: ${dbChecksPassed}/10 passed, ${dbChecksFailed} failed.`);

  console.log('\n--- Phase 2: Authentication & Login Verification ---');

  for (const account of BUSINESS_USERS_DATA) {
    const normalizedEmail = account.email.toLowerCase().trim();

    try {
      // Call existing authService.loginUser
      const authResult = await loginUser({
        email: normalizedEmail,
        password: account.password,
        ipAddress: '127.0.0.1',
        userAgent: 'VerificationScript/1.0',
      });

      // Verify returned data structure
      const hasToken = typeof authResult.token === 'string' && authResult.token.length > 20;
      const roleCorrect = authResult.role === USER_ROLES.BUSINESS_USER;
      const userObjRole = authResult.user?.role === USER_ROLES.BUSINESS_USER;
      const noPasswordExposed = authResult.user?.password === undefined;

      // Verify JWT token signature and payload
      const decoded = jwt.verify(authResult.token, ENV.JWT_SECRET);
      const jwtRoleMatches = decoded.role === USER_ROLES.BUSINESS_USER;
      const jwtEmailMatches = decoded.email.toLowerCase() === normalizedEmail;

      // Verify dashboard redirect mapping
      const redirectPath = getRoleRedirectPath(authResult.role);
      const redirectCorrect = redirectPath === '/applicant/dashboard';

      if (
        hasToken &&
        roleCorrect &&
        userObjRole &&
        noPasswordExposed &&
        jwtRoleMatches &&
        jwtEmailMatches &&
        redirectCorrect
      ) {
        loginChecksPassed++;
        console.log(`✅ [LOGIN] Authenticated ${normalizedEmail} | Role: ${authResult.role} | JWT Valid: YES | Redirect: ${redirectPath} | Password Protected: YES`);
      } else {
        loginChecksFailed++;
        console.error(`❌ [LOGIN] Validation failed for ${normalizedEmail}:`);
        console.error(`   - Has token: ${hasToken}`);
        console.error(`   - Role correct: ${roleCorrect}`);
        console.error(`   - No password exposed: ${noPasswordExposed}`);
        console.error(`   - JWT role matches: ${jwtRoleMatches}`);
        console.error(`   - JWT email matches: ${jwtEmailMatches}`);
        console.error(`   - Redirect correct: ${redirectCorrect} (${redirectPath})`);
      }
    } catch (loginErr) {
      loginChecksFailed++;
      console.error(`❌ [LOGIN] Exception during login for ${normalizedEmail}:`, loginErr.message);
    }
  }

  console.log(`\nLogin Verification Results: ${loginChecksPassed}/10 passed, ${loginChecksFailed} failed.`);

  console.log('\n===============================================================');
  console.log(`🏁 Total Verification Summary:`);
  console.log(`   MongoDB Checks: ${dbChecksPassed}/10 Passed`);
  console.log(`   Login & JWT Checks: ${loginChecksPassed}/10 Passed`);
  console.log('===============================================================');

  return {
    dbChecksPassed,
    dbChecksFailed,
    loginChecksPassed,
    loginChecksFailed,
    allPassed: dbChecksPassed === 10 && loginChecksPassed === 10,
  };
}

// Auto-run if executed directly via node
const isMain = process.argv[1] && process.argv[1].endsWith('verifyBusinessUsers.js');
if (isMain) {
  (async () => {
    try {
      await connectDB();
      const result = await verifyBusinessUsers();
      await disconnectDB();
      process.exit(result.allPassed ? 0 : 1);
    } catch (error) {
      console.error('❌ [VERIFY ERROR]', error.message);
      await disconnectDB();
      process.exit(1);
    }
  })();
}
