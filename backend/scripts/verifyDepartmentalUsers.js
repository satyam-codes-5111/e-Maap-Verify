import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';
import { USER_ROLES } from '../config/constants.js';
import { loginUser } from '../services/authService.js';
import { DEPARTMENTAL_USERS_DATA } from './seedDepartmentalUsers.js';

/**
 * Maps user roles to frontend redirect paths as defined in AuthContext.tsx
 */
function getRoleRedirectPath(role) {
  switch (role) {
    case USER_ROLES.SUPER_ADMIN:
    case USER_ROLES.ADMIN:
      return '/admin/dashboard';
    case USER_ROLES.LEGAL_METROLOGY_OFFICER:
    case USER_ROLES.FIELD_VERIFICATION_OFFICER:
    case USER_ROLES.GATC_OFFICER:
      return '/officer/dashboard';
    case USER_ROLES.BUSINESS_USER:
      return '/applicant/dashboard';
    default:
      return '/applicant/dashboard';
  }
}

export async function verifyDepartmentalUsers() {
  console.log('===============================================================');
  console.log('🔍 Starting Comprehensive Verification of 16 Departmental User Accounts');
  console.log('===============================================================');

  let dbChecksPassed = 0;
  let dbChecksFailed = 0;
  let loginChecksPassed = 0;
  let loginChecksFailed = 0;
  let rbacChecksPassed = 0;
  let rbacChecksFailed = 0;

  // Track role distribution of seeded accounts
  const roleDistribution = {
    [USER_ROLES.SUPER_ADMIN]: 0,
    [USER_ROLES.ADMIN]: 0,
    [USER_ROLES.LEGAL_METROLOGY_OFFICER]: 0,
    [USER_ROLES.FIELD_VERIFICATION_OFFICER]: 0,
    [USER_ROLES.GATC_OFFICER]: 0,
  };

  console.log('\n--- Phase 1: MongoDB Database Record Verification ---');

  for (const expected of DEPARTMENTAL_USERS_DATA) {
    const normalizedEmail = expected.email.toLowerCase().trim();

    // 1. Check uniqueness and existence in MongoDB
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
    const roleMatches = userDoc.role === expected.role;
    if (!roleMatches) {
      console.error(`❌ [MONGODB] Role mismatch for ${normalizedEmail}: expected "${expected.role}", got "${userDoc.role}"`);
      dbChecksFailed++;
    } else {
      if (roleDistribution[userDoc.role] !== undefined) {
        roleDistribution[userDoc.role]++;
      }
    }

    // 4. Check isActive
    const isActiveMatches = userDoc.isActive === true;
    if (!isActiveMatches) {
      console.error(`❌ [MONGODB] Active status failure for ${normalizedEmail}: expected true, got ${userDoc.isActive}`);
      dbChecksFailed++;
    }

    // 5. Check Password Hashing (ensure bcrypt hash structure and verify match without logging)
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
      dbChecksPassed++;
      console.log(`✅ [MONGODB] Verified account: ${userDoc.name} <${normalizedEmail}> | Role: ${userDoc.role} | Active: ${userDoc.isActive} | Bcrypt Hashed: YES`);
    }

    // Verify password is not exposed by default in toJSON / standard queries
    const publicUserDoc = await User.findOne({ email: normalizedEmail });
    if (publicUserDoc.password !== undefined) {
      console.error(`❌ [SECURITY] Password exposed in default query for ${normalizedEmail}`);
      dbChecksFailed++;
    }
  }

  console.log(`\nMongoDB Verification Results: ${dbChecksPassed}/16 passed, ${dbChecksFailed} failed.`);

  console.log('\n--- Phase 2: Role Distribution & Isolation Verification ---');
  console.log(`   - SUPER_ADMIN: ${roleDistribution[USER_ROLES.SUPER_ADMIN]} (Expected: 1)`);
  console.log(`   - ADMIN: ${roleDistribution[USER_ROLES.ADMIN]} (Expected: 2)`);
  console.log(`   - LEGAL_METROLOGY_OFFICER: ${roleDistribution[USER_ROLES.LEGAL_METROLOGY_OFFICER]} (Expected: 4)`);
  console.log(`   - FIELD_VERIFICATION_OFFICER: ${roleDistribution[USER_ROLES.FIELD_VERIFICATION_OFFICER]} (Expected: 5)`);
  console.log(`   - GATC_OFFICER: ${roleDistribution[USER_ROLES.GATC_OFFICER]} (Expected: 4)`);

  const roleDistributionCorrect =
    roleDistribution[USER_ROLES.SUPER_ADMIN] === 1 &&
    roleDistribution[USER_ROLES.ADMIN] === 2 &&
    roleDistribution[USER_ROLES.LEGAL_METROLOGY_OFFICER] === 4 &&
    roleDistribution[USER_ROLES.FIELD_VERIFICATION_OFFICER] === 5 &&
    roleDistribution[USER_ROLES.GATC_OFFICER] === 4;

  if (roleDistributionCorrect) {
    rbacChecksPassed++;
    console.log('✅ [RBAC] Role distribution matches exactly 16 departmental accounts.');
  } else {
    rbacChecksFailed++;
    console.error('❌ [RBAC] Role distribution mismatch.');
  }

  console.log('\n--- Phase 3: Negative Check: Verify Piyush Khuswaha Does NOT Exist ---');
  const piyushKhuswahaQuery = await User.find({
    $or: [
      { name: { $regex: 'khuswaha', $options: 'i' } },
      { email: { $regex: 'khuswaha', $options: 'i' } },
    ],
  });

  if (piyushKhuswahaQuery.length === 0) {
    rbacChecksPassed++;
    console.log('✅ [CHECK] Piyush Khuswaha does NOT exist in the database (0 matching accounts).');
  } else {
    rbacChecksFailed++;
    console.error(`❌ [CHECK] Unexpected account detected for Piyush Khuswaha (${piyushKhuswahaQuery.length} found).`);
  }

  console.log('\n--- Phase 4: Existing Business Users Integrity Check ---');
  const businessUserEmails = [
    'arpit@gmail.com', 'jeeshan@gmail.com', 'siddhart@gmail.com', 'sarthak@gmail.com',
    'ajeet@gmail.com', 'raman@gmail.com', 'nitesh@gmail.com', 'rehan@gmail.com',
    'anshika@gmail.com', 'priyanshi@gmail.com',
  ];
  const existingBusinessUsers = await User.find({ email: { $in: businessUserEmails } });
  if (existingBusinessUsers.length === 10 && existingBusinessUsers.every(u => u.role === USER_ROLES.BUSINESS_USER && u.isActive)) {
    rbacChecksPassed++;
    console.log(`✅ [INTEGRITY] All 10 existing Business Users remain intact and active.`);
  } else {
    rbacChecksFailed++;
    console.error(`❌ [INTEGRITY] Business user mismatch: found ${existingBusinessUsers.length}/10.`);
  }

  console.log('\n--- Phase 5: Authentication & Login Verification ---');

  for (const account of DEPARTMENTAL_USERS_DATA) {
    const normalizedEmail = account.email.toLowerCase().trim();

    try {
      // Call existing authService.loginUser
      const authResult = await loginUser({
        email: normalizedEmail,
        password: account.password,
        ipAddress: '127.0.0.1',
        userAgent: 'DepartmentalVerificationScript/1.0',
      });

      // Verify returned token & role
      const hasToken = typeof authResult.token === 'string' && authResult.token.length > 20;
      const roleCorrect = authResult.role === account.role;
      const userObjRole = authResult.user?.role === account.role;
      const noPasswordExposed = authResult.user?.password === undefined;

      // Verify JWT signature and claims
      const decoded = jwt.verify(authResult.token, ENV.JWT_SECRET);
      const jwtRoleMatches = decoded.role === account.role;
      const jwtEmailMatches = decoded.email.toLowerCase() === normalizedEmail;

      // Verify dashboard redirect mapping
      const redirectPath = getRoleRedirectPath(authResult.role);
      let redirectExpected = '/applicant/dashboard';
      if (account.role === USER_ROLES.SUPER_ADMIN || account.role === USER_ROLES.ADMIN) {
        redirectExpected = '/admin/dashboard';
      } else if (
        account.role === USER_ROLES.LEGAL_METROLOGY_OFFICER ||
        account.role === USER_ROLES.FIELD_VERIFICATION_OFFICER ||
        account.role === USER_ROLES.GATC_OFFICER
      ) {
        redirectExpected = '/officer/dashboard';
      }
      const redirectMatches = redirectPath === redirectExpected;

      if (
        hasToken &&
        roleCorrect &&
        userObjRole &&
        noPasswordExposed &&
        jwtRoleMatches &&
        jwtEmailMatches &&
        redirectMatches
      ) {
        loginChecksPassed++;
        console.log(`✅ [LOGIN] Authenticated: ${account.name} <${normalizedEmail}> | Role: ${authResult.role} | JWT Valid: YES | Redirect: ${redirectPath}`);
      } else {
        loginChecksFailed++;
        console.error(`❌ [LOGIN] Validation failed for ${normalizedEmail}:`);
        console.error(`   - Has token: ${hasToken}`);
        console.error(`   - Role correct: ${roleCorrect}`);
        console.error(`   - No password exposed: ${noPasswordExposed}`);
        console.error(`   - JWT role matches: ${jwtRoleMatches}`);
        console.error(`   - JWT email matches: ${jwtEmailMatches}`);
        console.error(`   - Redirect expected: ${redirectExpected}, got: ${redirectPath}`);
      }
    } catch (loginErr) {
      loginChecksFailed++;
      console.error(`❌ [LOGIN] Exception during login for ${normalizedEmail}:`, loginErr.message);
    }
  }

  console.log(`\nLogin Verification Results: ${loginChecksPassed}/16 passed, ${loginChecksFailed} failed.`);

  console.log('\n===============================================================');
  console.log(`🏁 Total Departmental Verification Summary:`);
  console.log(`   MongoDB Checks: ${dbChecksPassed}/16 Passed`);
  console.log(`   RBAC & Integrity Checks: ${rbacChecksPassed}/3 Passed`);
  console.log(`   Login & JWT Checks: ${loginChecksPassed}/16 Passed`);
  console.log('===============================================================');

  return {
    dbChecksPassed,
    dbChecksFailed,
    rbacChecksPassed,
    rbacChecksFailed,
    loginChecksPassed,
    loginChecksFailed,
    roleDistribution,
    allPassed:
      dbChecksPassed === 16 &&
      rbacChecksPassed === 3 &&
      loginChecksPassed === 16,
  };
}

// Auto-run if executed directly via node
const isMain = process.argv[1] && process.argv[1].endsWith('verifyDepartmentalUsers.js');
if (isMain) {
  (async () => {
    try {
      await connectDB();
      const result = await verifyDepartmentalUsers();
      await disconnectDB();
      process.exit(result.allPassed ? 0 : 1);
    } catch (error) {
      console.error('❌ [DEPARTMENTAL VERIFY ERROR]', error.message);
      await disconnectDB();
      process.exit(1);
    }
  })();
}
