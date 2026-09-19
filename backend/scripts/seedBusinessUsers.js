import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { USER_ROLES } from '../config/constants.js';

export const BUSINESS_USERS_DATA = [
  {
    name: 'Arpit',
    email: 'arpit@gmail.com',
    password: 'Arpit@00',
    role: USER_ROLES.BUSINESS_USER,
  },
  {
    name: 'Jeeshan',
    email: 'jeeshan@gmail.com',
    password: 'Jeeshan@00',
    role: USER_ROLES.BUSINESS_USER,
  },
  {
    name: 'Siddhart',
    email: 'siddhart@gmail.com',
    password: 'Siddhart@00',
    role: USER_ROLES.BUSINESS_USER,
  },
  {
    name: 'Sarthak',
    email: 'sarthak@gmail.com',
    password: 'Sarthak@00',
    role: USER_ROLES.BUSINESS_USER,
  },
  {
    name: 'Ajeet',
    email: 'ajeet@gmail.com',
    password: 'Ajeet@00',
    role: USER_ROLES.BUSINESS_USER,
  },
  {
    name: 'Raman',
    email: 'raman@gmail.com',
    password: 'Raman@00',
    role: USER_ROLES.BUSINESS_USER,
  },
  {
    name: 'Nitesh',
    email: 'nitesh@gmail.com',
    password: 'Nitesh@00',
    role: USER_ROLES.BUSINESS_USER,
  },
  {
    name: 'Rehan',
    email: 'rehan@gmail.com',
    password: 'Rehan@00',
    role: USER_ROLES.BUSINESS_USER,
  },
  {
    name: 'Anshika',
    email: 'anshika@gmail.com',
    password: 'Anshika@00',
    role: USER_ROLES.BUSINESS_USER,
  },
  {
    name: 'Priyanshi',
    email: 'priyanshi@gmail.com',
    password: 'Priyanshi@00',
    role: USER_ROLES.BUSINESS_USER,
  },
];

/**
 * Idempotent seed script to create exactly 10 real BUSINESS_USER accounts in MongoDB.
 * Ensures:
 * - Existing accounts are skipped
 * - Passwords are automatically hashed via the existing User pre-save bcrypt hook
 * - Never logs plaintext passwords or password hashes to console
 * - Account role is BUSINESS_USER and isActive is true
 */
export async function seedBusinessUsers() {
  console.log('===============================================================');
  console.log('🌱 Starting Idempotent Business User Seed Process');
  console.log(`📋 Total requested accounts: ${BUSINESS_USERS_DATA.length}`);
  console.log('===============================================================');

  let createdCount = 0;
  let skippedCount = 0;
  const createdEmails = [];
  const skippedEmails = [];

  for (const account of BUSINESS_USERS_DATA) {
    const normalizedEmail = account.email.toLowerCase().trim();

    // Check if an account with this email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      console.log(`ℹ️  Skipped existing account: ${normalizedEmail} (Role: ${existingUser.role}, Active: ${existingUser.isActive})`);
      skippedCount++;
      skippedEmails.push(normalizedEmail);
      continue;
    }

    // Instantiate User model instance
    // Note: User pre-save hook will hash account.password with bcrypt (cost factor 12)
    const newUser = new User({
      name: account.name.trim(),
      email: normalizedEmail,
      password: account.password,
      role: USER_ROLES.BUSINESS_USER,
      isActive: true,
    });

    await newUser.save();
    console.log(`✅ Created BUSINESS_USER account: ${newUser.name} <${newUser.email}> (Active: ${newUser.isActive})`);
    createdCount++;
    createdEmails.push(newUser.email);
  }

  console.log('===============================================================');
  console.log('📊 Seed Summary:');
  console.log(`   - Created: ${createdCount}`);
  console.log(`   - Skipped: ${skippedCount}`);
  console.log(`   - Total Processed: ${BUSINESS_USERS_DATA.length}`);
  console.log('===============================================================');

  return {
    total: BUSINESS_USERS_DATA.length,
    createdCount,
    skippedCount,
    createdEmails,
    skippedEmails,
  };
}

// Auto-run if executed directly via node
const isMain = process.argv[1] && process.argv[1].endsWith('seedBusinessUsers.js');
if (isMain) {
  (async () => {
    try {
      await connectDB();
      await seedBusinessUsers();
      await disconnectDB();
      process.exit(0);
    } catch (error) {
      console.error('❌ [SEED ERROR] Failed to seed business users:', error.message);
      await disconnectDB();
      process.exit(1);
    }
  })();
}
