import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { USER_ROLES } from '../config/constants.js';
import { ENV } from '../config/env.js';

/**
 * Administrative One-Time Super Admin Password Reset Script
 *
 * Requirements:
 * - ADMIN_INITIAL_EMAIL: target email address of the SUPER_ADMIN account
 * - ADMIN_RESET_PASSWORD: new operational password (min 8 characters)
 *
 * Security & Integrity:
 * - Read-only check on email and role: must match existing SUPER_ADMIN
 * - Uses existing User model pre-save bcrypt hook (bcryptjs salt round 12)
 * - Never prints or logs the password
 * - Does not create any new users
 * - Does not modify or delete any other records
 * - Gracefully and safely disconnects from MongoDB
 */
async function resetSuperAdminPassword() {
  let dbConnected = false;

  try {
    const adminEmail = (process.env.ADMIN_INITIAL_EMAIL || ENV.ADMIN_INITIAL_EMAIL || '').trim().toLowerCase();
    const newPassword = (process.env.ADMIN_RESET_PASSWORD || '').trim();

    if (!adminEmail) {
      console.error('❌ [SUPER_ADMIN RESET ERROR] Missing ADMIN_INITIAL_EMAIL environment variable.');
      console.error('   Please provide ADMIN_INITIAL_EMAIL (e.g., admin@doca.gov.in) before executing this script.');
      process.exit(1);
    }

    if (!newPassword) {
      console.error('❌ [SUPER_ADMIN RESET ERROR] Missing ADMIN_RESET_PASSWORD environment variable.');
      console.error('   Please provide ADMIN_RESET_PASSWORD with a secure password (minimum 8 characters).');
      process.exit(1);
    }

    if (newPassword.length < 8) {
      console.error('❌ [SUPER_ADMIN RESET ERROR] ADMIN_RESET_PASSWORD must be at least 8 characters long.');
      process.exit(1);
    }

    console.log('--- Initializing Administrative Super Admin Password Reset ---');
    console.log(`Target Super Admin Email: ${adminEmail}`);

    await connectDB();
    dbConnected = true;

    // Find the specific user by email
    const user = await User.findOne({ email: adminEmail }).select('+password');

    if (!user) {
      console.error(`❌ [SUPER_ADMIN RESET ERROR] No user account found with email: ${adminEmail}`);
      console.error('   Reset aborted safely. No database records were modified.');
      await disconnectDB();
      process.exit(1);
    }

    // Strict role validation
    if (user.role !== USER_ROLES.SUPER_ADMIN) {
      console.error(`❌ [SUPER_ADMIN RESET ERROR] Security constraint violation:`);
      console.error(`   User '${adminEmail}' has role '${user.role}', which is not '${USER_ROLES.SUPER_ADMIN}'.`);
      console.error('   This administrative utility is strictly restricted to SUPER_ADMIN accounts.');
      console.error('   Reset aborted safely. No database records were modified.');
      await disconnectDB();
      process.exit(1);
    }

    // Update ONLY password field on this specific user
    user.password = newPassword;
    await user.save();

    // Verify hash integrity with comparePassword
    const isMatch = await user.comparePassword(newPassword);
    if (!isMatch) {
      throw new Error('Password hash verification failed after persisting.');
    }

    console.log('===========================================================');
    console.log('✅ [SUPER_ADMIN RESET SUCCESS] Super Admin password reset successfully:');
    console.log(`   User ID:     ${user._id}`);
    console.log(`   Name:        ${user.name}`);
    console.log(`   Email:       ${user.email}`);
    console.log(`   Role:        ${user.role}`);
    console.log(`   Status:      ${user.isActive ? 'Active' : 'Inactive'}`);
    console.log(`   Timestamp:   ${new Date().toISOString()}`);
    console.log('===========================================================');
    console.log('🔒 Security Notice: The password has been securely hashed with bcrypt (cost factor 12).');
    console.log('   Please clear ADMIN_RESET_PASSWORD from your environment immediately.');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ [SUPER_ADMIN RESET ERROR] An unexpected error occurred:', error.message);
    if (dbConnected) {
      try {
        await disconnectDB();
      } catch {
        // ignore disconnect error on failure
      }
    }
    process.exit(1);
  }
}

resetSuperAdminPassword();
