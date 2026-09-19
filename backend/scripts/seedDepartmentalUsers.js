import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { USER_ROLES } from '../config/constants.js';

export const DEPARTMENTAL_USERS_DATA = [
  {
    name: 'Satyam Verma',
    email: 'satyam@gmail.com',
    password: 'Satyam@00',
    role: USER_ROLES.SUPER_ADMIN,
    designation: 'Super Administrator',
    organization: 'Department of Consumer Affairs (DoCA)',
  },
  {
    name: 'Arman Yadav',
    email: 'arman@gmail.com',
    password: 'Arman@00',
    role: USER_ROLES.ADMIN,
    designation: 'System Administrator',
    organization: 'Department of Consumer Affairs (DoCA)',
  },
  {
    name: 'Anurag Rajbhar',
    email: 'anurag@gmail.com',
    password: 'Anurag@00',
    role: USER_ROLES.ADMIN,
    designation: 'System Administrator',
    organization: 'Department of Consumer Affairs (DoCA)',
  },
  {
    name: 'Shweta Rajbhar',
    email: 'shweta@gmail.com',
    password: 'Shweta@00',
    role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
    designation: 'Legal Metrology Officer',
    organization: 'Legal Metrology Department',
  },
  {
    name: 'Astha',
    email: 'astha@gmail.com',
    password: 'Astha@00',
    role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
    designation: 'Legal Metrology Officer',
    organization: 'Legal Metrology Department',
  },
  {
    name: 'Ankita Rawat',
    email: 'ankita@gmail.com',
    password: 'Ankita@00',
    role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
    designation: 'Legal Metrology Officer',
    organization: 'Legal Metrology Department',
  },
  {
    name: 'Nandini Rawat',
    email: 'nandini@gmail.com',
    password: 'Nandini@00',
    role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
    designation: 'Legal Metrology Officer',
    organization: 'Legal Metrology Department',
  },
  {
    name: 'MP Nihal',
    email: 'mpnihal@gmail.com',
    password: 'Nihal@00',
    role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
    designation: 'Field Verification Officer',
    organization: 'Legal Metrology Department',
  },
  {
    name: 'Piyush Patel',
    email: 'piyush@gmail.com',
    password: 'Piyush@00',
    role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
    designation: 'Field Verification Officer',
    organization: 'Legal Metrology Department',
  },
  {
    name: 'Lucky Verma',
    email: 'lucky@gmail.com',
    password: 'Lucky@00',
    role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
    designation: 'Field Verification Officer',
    organization: 'Legal Metrology Department',
  },
  {
    name: 'Akhant Tirpathi',
    email: 'akhant@gmail.com',
    password: 'Akhant@00',
    role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
    designation: 'Field Verification Officer',
    organization: 'Legal Metrology Department',
  },
  {
    name: 'Amit Pal',
    email: 'amit@gmail.com',
    password: 'Amit@00',
    role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
    designation: 'Field Verification Officer',
    organization: 'Legal Metrology Department',
  },
  {
    name: 'Arun Mauray',
    email: 'arun@gmail.com',
    password: 'Arun@00',
    role: USER_ROLES.GATC_OFFICER,
    designation: 'GATC Technical Officer',
    organization: 'Government Approved Test Centre',
  },
  {
    name: 'Dharmendra Singh',
    email: 'dharmendra@gmail.com',
    password: 'Dharmendra@00',
    role: USER_ROLES.GATC_OFFICER,
    designation: 'GATC Technical Officer',
    organization: 'Government Approved Test Centre',
  },
  {
    name: 'Seemant Pandya',
    email: 'seemant@gmail.com',
    password: 'Seemant@00',
    role: USER_ROLES.GATC_OFFICER,
    designation: 'GATC Technical Officer',
    organization: 'Government Approved Test Centre',
  },
  {
    name: 'Ananya Chhavi',
    email: 'ananya@gmail.com',
    password: 'Ananya@00',
    role: USER_ROLES.GATC_OFFICER,
    designation: 'GATC Technical Officer',
    organization: 'Government Approved Test Centre',
  },
];

/**
 * Idempotent seed script to create exactly 16 real Departmental User accounts in MongoDB.
 * Enforces:
 * - Checks if email already exists; skips existing accounts
 * - Creates only missing departmental accounts
 * - Hashes password through existing User pre-save bcrypt hook (cost factor 12)
 * - Never logs plaintext passwords or password hashes
 * - Sets isActive: true
 * - No mock data, no email verification requirements, no destructive operations
 * - Disconnects cleanly from MongoDB
 */
export async function seedDepartmentalUsers() {
  console.log('===============================================================');
  console.log('🏛️ Starting Idempotent Departmental User Seed Process');
  console.log(`📋 Total requested accounts: ${DEPARTMENTAL_USERS_DATA.length}`);
  console.log('===============================================================');

  let createdCount = 0;
  let skippedCount = 0;
  const createdEmails = [];
  const skippedEmails = [];

  for (const account of DEPARTMENTAL_USERS_DATA) {
    const normalizedEmail = account.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      console.log(`ℹ️  Skipped existing account: ${normalizedEmail} (Role: ${existingUser.role}, Active: ${existingUser.isActive})`);
      skippedCount++;
      skippedEmails.push(normalizedEmail);
      continue;
    }

    // Create user via Mongoose User model (pre-save hook hashes password with bcrypt)
    const newUser = new User({
      name: account.name.trim(),
      email: normalizedEmail,
      password: account.password,
      role: account.role,
      designation: account.designation,
      organization: account.organization,
      isActive: true,
    });

    await newUser.save();
    console.log(`✅ Created ${newUser.role} account: ${newUser.name} <${newUser.email}> (Active: ${newUser.isActive})`);
    createdCount++;
    createdEmails.push(newUser.email);
  }

  console.log('===============================================================');
  console.log('📊 Departmental Seed Summary:');
  console.log(`   - Created: ${createdCount}`);
  console.log(`   - Skipped: ${skippedCount}`);
  console.log(`   - Total Processed: ${DEPARTMENTAL_USERS_DATA.length}`);
  console.log('===============================================================');

  return {
    total: DEPARTMENTAL_USERS_DATA.length,
    createdCount,
    skippedCount,
    createdEmails,
    skippedEmails,
  };
}

// Auto-run if executed directly via node
const isMain = process.argv[1] && process.argv[1].endsWith('seedDepartmentalUsers.js');
if (isMain) {
  (async () => {
    try {
      await connectDB();
      await seedDepartmentalUsers();
      await disconnectDB();
      process.exit(0);
    } catch (error) {
      console.error('❌ [DEPARTMENTAL SEED ERROR] Failed to seed users:', error.message);
      await disconnectDB();
      process.exit(1);
    }
  })();
}
