import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import app from './backend/app.js';
import { connectDB } from './backend/config/db.js';

const PORT = 3000;

async function startServer() {
  try {
    // 1. Attach Vite middleware in development or static dist in production
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    // 2. Listen on port 3000 and 0.0.0.0 immediately
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`⚖️  Legal Metrology Verification Server Started`);
      console.log(`🏛️  DoCA / SIH Problem Statement ID: 26036`);
      console.log(`🚀 Port: ${PORT} | Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api`);
      console.log(`====================================================`);
    });

    // 3. Connect to MongoDB database (asynchronous, non-blocking)
    connectDB().catch((err: any) => {
      console.error('[DATABASE WARNING] Initial MongoDB connection error:', err?.message);
    });
  } catch (error: any) {
    console.error('Server startup failed:', error?.message);
    process.exit(1);
  }
}

startServer();
