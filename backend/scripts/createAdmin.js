import { connectDB, disconnectDB } from '../config/db.js';
import { seedAdminUser } from '../services/adminSeedService.js';

async function seedAdmin() {
  try {
    console.log('--- Initializing Admin Seed Script ---');
    await connectDB();
    await seedAdminUser();
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to run Admin Seed script:', error.message);
    await disconnectDB();
    process.exit(1);
  }
}

seedAdmin();

