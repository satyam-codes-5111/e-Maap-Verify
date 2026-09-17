import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { USER_ROLES } from '../config/constants.js';
import { ENV } from '../config/env.js';

async function seedAdmin() {
  try {
    console.log('--- Initializing Admin Seed Script ---');
    await connectDB();

    const adminEmail = (ENV.ADMIN_INITIAL_EMAIL || '').trim().toLowerCase();
    const adminPassword = (ENV.ADMIN_INITIAL_PASSWORD || '').trim();
    const adminName = (ENV.ADMIN_INITIAL_NAME || '').trim() || 'Super Administrator';
    const adminPhone = (ENV.ADMIN_INITIAL_PHONE || '').trim() || '9876543210';

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD must be provided in environment variables.');
    }

    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail }, { role: USER_ROLES.SUPER_ADMIN }],
    });

    if (existingAdmin) {
      console.log(`[INFO] Super Admin already exists in database: ${existingAdmin.email} (Role: ${existingAdmin.role})`);
      await disconnectDB();
      process.exit(0);
    }

    const admin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword, // Password will be hashed automatically by pre-save hook
      phone: adminPhone,
      role: USER_ROLES.SUPER_ADMIN,
      designation: 'Director General of Legal Metrology',
      jurisdiction: {
        state: 'National HQ',
        district: 'Central Secretariat, New Delhi',
        zone: 'North',
      },
      organization: 'Department of Consumer Affairs (DoCA)',
      isActive: true,
    });

    await admin.save();

    console.log('===========================================================');
    console.log('✅ SUPER_ADMIN account created successfully in MongoDB:');
    console.log(`   Name:        ${admin.name}`);
    console.log(`   Email:       ${admin.email}`);
    console.log(`   Role:        ${admin.role}`);
    console.log(`   Designation: ${admin.designation}`);
    console.log('===========================================================');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed Super Admin:', error.message);
    await disconnectDB();
    process.exit(1);
  }
}

seedAdmin();
