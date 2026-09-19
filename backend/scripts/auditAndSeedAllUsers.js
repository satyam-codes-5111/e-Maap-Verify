import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { USER_ROLES } from '../config/constants.js';
import { DEPARTMENTAL_USERS_DATA, seedDepartmentalUsers } from './seedDepartmentalUsers.js';
import { BUSINESS_USERS_DATA, seedBusinessUsers } from './seedBusinessUsers.js';

export async function runFullAuditAndSeed() {
  console.log('===============================================================');
  console.log('🏛️  LEGAL METROLOGY SYSTEM - MONGODB USERS AUDIT & IDEMPOTENT SEED');
  console.log('===============================================================');

  const connection = await connectDB();
  const dbName = connection.name;
  const dbHost = connection.host;
  console.log(`[CONFIRMED DB] Connected Database: "${dbName}" on host: "${dbHost}"`);

  // Step 1: Count existing state before seeding
  const initialTotal = await User.countDocuments();
  console.log(`[INITIAL STATE] Total user documents in DB: ${initialTotal}`);

  // Step 2: Run idempotent seeding for departmental users
  console.log('\n--- Running Idempotent Departmental User Seeder ---');
  const deptSeedResult = await seedDepartmentalUsers();

  // Step 3: Run idempotent seeding for business users
  console.log('\n--- Running Idempotent Business User Seeder ---');
  const bizSeedResult = await seedBusinessUsers();

  // Step 4: Full Audit & Verification
  console.log('\n--- Running Complete Verification Suite ---');

  const allExpectedDepartmental = DEPARTMENTAL_USERS_DATA;
  const allExpectedBusiness = BUSINESS_USERS_DATA;

  let departmentalFound = 0;
  let businessFound = 0;
  let missingUsers = [];
  let duplicateUsers = [];
  let incorrectRoles = [];
  let inactiveUsers = [];
  let invalidHashes = [];

  // Verify Departmental Users
  for (const exp of allExpectedDepartmental) {
    const email = exp.email.toLowerCase().trim();
    const docs = await User.find({ email }).select('+password');

    if (docs.length === 0) {
      missingUsers.push({ email, expectedRole: exp.role });
      continue;
    }

    if (docs.length > 1) {
      duplicateUsers.push({ email, count: docs.length });
    }

    departmentalFound++;
    const doc = docs[0];

    if (doc.role !== exp.role) {
      incorrectRoles.push({ email, expected: exp.role, actual: doc.role });
    }

    if (!doc.isActive) {
      inactiveUsers.push({ email, role: doc.role });
    }

    const isBcrypt = typeof doc.password === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(doc.password);
    if (!isBcrypt) {
      invalidHashes.push({ email });
    }
  }

  // Verify Business Users
  for (const exp of allExpectedBusiness) {
    const email = exp.email.toLowerCase().trim();
    const docs = await User.find({ email }).select('+password');

    if (docs.length === 0) {
      missingUsers.push({ email, expectedRole: exp.role });
      continue;
    }

    if (docs.length > 1) {
      duplicateUsers.push({ email, count: docs.length });
    }

    businessFound++;
    const doc = docs[0];

    if (doc.role !== USER_ROLES.BUSINESS_USER) {
      incorrectRoles.push({ email, expected: USER_ROLES.BUSINESS_USER, actual: doc.role });
    }

    if (!doc.isActive) {
      inactiveUsers.push({ email, role: doc.role });
    }

    const isBcrypt = typeof doc.password === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(doc.password);
    if (!isBcrypt) {
      invalidHashes.push({ email });
    }
  }

  // Negative Check: Verify Piyush Khuswaha does NOT exist
  const khuswahaDocs = await User.find({
    $or: [
      { name: { $regex: /khuswaha/i } },
      { email: { $regex: /khuswaha/i } },
    ],
  });

  const finalTotal = await User.countDocuments();

  const auditReport = {
    databaseName: dbName,
    databaseHost: dbHost,
    totalUsersInDb: finalTotal,
    departmentalUsersExpected: allExpectedDepartmental.length,
    departmentalUsersFound: departmentalFound,
    businessUsersExpected: allExpectedBusiness.length,
    businessUsersFound: businessFound,
    created: deptSeedResult.createdCount + bizSeedResult.createdCount,
    skippedAlreadyExisted: deptSeedResult.skippedCount + bizSeedResult.skippedCount,
    duplicatesDetected: duplicateUsers.length,
    duplicateDetails: duplicateUsers,
    missingUsers: missingUsers.length,
    missingDetails: missingUsers,
    incorrectRoles: incorrectRoles.length,
    incorrectRoleDetails: incorrectRoles,
    inactiveUsers: inactiveUsers.length,
    inactiveUserDetails: inactiveUsers,
    invalidPasswordHashes: invalidHashes.length,
    piyushKhuswahaFound: khuswahaDocs.length,
  };

  console.log('\n===============================================================');
  console.log('📋 AUDIT AND SEED REPORT');
  console.log('===============================================================');
  console.log(JSON.stringify(auditReport, null, 2));

  await disconnectDB();
  return auditReport;
}

// Auto-run if invoked directly
const isMain = process.argv[1] && process.argv[1].endsWith('auditAndSeedAllUsers.js');
if (isMain) {
  runFullAuditAndSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Audit and seed error:', err);
      process.exit(1);
    });
}
