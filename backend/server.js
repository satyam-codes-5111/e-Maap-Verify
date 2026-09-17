import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { seedAdminUser } from './services/adminSeedService.js';
import { startExpiryScheduler, stopExpiryScheduler } from './jobs/expiryScheduler.js';

const PORT = parseInt(ENV.PORT, 10) || 3000;

async function startServer() {
  try {
    // 1. Establish Database Connection
    await connectDB();

    // 2. Seed Initial Super Admin (Idempotent, if configured)
    await seedAdminUser();

    // 3. Start Expiry / Due-Date Background Scheduler
    startExpiryScheduler();

    // Root Health Route for cloud platform health checks (Render / AWS / GCP)
    app.get('/', (req, res) => {
      res.status(200).json({
        status: 'ok',
        message: 'Legal Metrology Verification Engine API is running on Render.',
        health: '/api/health',
        version: '1.0.0'
      });
    });

    // 3. Start HTTP Listener
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`⚖️  Legal Metrology Verification Server Started`);
      console.log(`🏛️  DoCA / SIH Problem Statement ID: 26036`);
      console.log(`🚀 Port: ${PORT} | Mode: ${ENV.NODE_ENV}`);
      console.log(`📡 Base API: http://localhost:${PORT}/api`);
      console.log(`====================================================`);
    });

    // Graceful shutdown handling
    const shutdown = (signal) => {
      console.log(`[SHUTDOWN] Received ${signal}. Gracefully closing server...`);
      stopExpiryScheduler();
      server.close(() => {
        console.log('[SHUTDOWN] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[CRITICAL] Server startup failure:', error.message);
    process.exit(1);
  }
}

startServer();
