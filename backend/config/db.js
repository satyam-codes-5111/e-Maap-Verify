import mongoose from 'mongoose';
import { ENV } from './env.js';

/**
 * Connect to MongoDB database instance
 */
export async function connectDB() {
  const uri = ENV.MONGO_URI;

  // Options for Mongoose connection
  const mongooseOpts = {
    serverSelectionTimeoutMS: 5000,
  };

  try {
    if (uri && uri.trim() !== '') {
      // Mask credentials for safe logging
      const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:*****@');
      console.log(`[DATABASE] Connecting to real MongoDB database at: ${sanitizedUri}`);
      
      await mongoose.connect(uri, mongooseOpts);
      console.log(`[DATABASE] Successfully connected to real MongoDB database: ${mongoose.connection.name} (Host: ${mongoose.connection.host})`);
      return mongoose.connection;
    } else {
      throw new Error('[DATABASE FATAL] MONGO_URI is not configured in environment variables.');
    }
  } catch (error) {
    console.error(`[DATABASE ERROR] Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
}

/**
 * Graceful database disconnect
 */
export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('[DATABASE] MongoDB connection closed safely.');
  } catch (err) {
    console.error('[DATABASE ERROR] Error during database shutdown:', err.message);
  }
}

// Graceful process signal handling
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});
