import { User } from '../models/User.js';
import { USER_ROLES } from '../config/constants.js';
import { ENV } from '../config/env.js';

/**
 * Idempotently seeds an initial SUPER_ADMIN user into the database if configured
 * and no Super Admin or matching email exists.
 *
 * Designed to execute safely during server startup without requiring shell access.
 */
export async function seedAdminUser() {
  try {
    const adminEmail = (ENV.ADMIN_INITIAL_EMAIL || '').trim().toLowerCase();
    const adminPassword = (ENV.ADMIN_INITIAL_PASSWORD || '').trim();
    const adminName = (ENV.ADMIN_INITIAL_NAME || '').trim() || 'Super Administrator';
    const adminPhone = (ENV.ADMIN_INITIAL_PHONE || '').trim();

    if (!adminEmail || !adminPassword) {
      console.log('[ADMIN SEED] Admin seed skipped: credentials not configured.');
      return null;
    }

    // Check whether a SUPER_ADMIN already exists by role OR whether the configured email already exists
    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail }, { role: USER_ROLES.SUPER_ADMIN }],
    });

    if (existingAdmin) {
      console.log(`[ADMIN SEED] Super Admin already exists (${existingAdmin.email}, Role: ${existingAdmin.role}). Skipping seed.`);
      return existingAdmin;
    }

    // Create exactly one SUPER_ADMIN using the User model
    // Note: Password will be hashed automatically by the User pre-save bcrypt hook
    const adminData = {
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: USER_ROLES.SUPER_ADMIN,
      designation: 'Director General of Legal Metrology',
      jurisdiction: {
        state: 'National HQ',
        district: 'Central Secretariat, New Delhi',
        zone: 'North',
      },
      organization: 'Department of Consumer Affairs (DoCA)',
      isActive: true,
    };

    if (adminPhone) {
      adminData.phone = adminPhone;
    }

    const admin = new User(adminData);

    await admin.save();

    console.log('===========================================================');
    console.log('✅ [ADMIN SEED] SUPER_ADMIN account created successfully:');
    console.log(`   Name:        ${admin.name}`);
    console.log(`   Email:       ${admin.email}`);
    console.log(`   Role:        ${admin.role}`);
    console.log(`   Designation: ${admin.designation}`);
    console.log('===========================================================');

    return admin;
  } catch (error) {
    // Handle potential race condition or duplicate key gracefully
    if (error && (error.code === 11000 || error.name === 'MongoServerError')) {
      console.log('[ADMIN SEED] Super Admin creation intercepted existing user or race condition. Admin already exists.');
      return null;
    }
    console.error('[ADMIN SEED] Failed to seed Super Admin:', error.message);
    return null;
  }
}
