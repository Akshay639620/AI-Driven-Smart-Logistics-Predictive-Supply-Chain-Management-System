import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import prisma from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('✅ PostgreSQL Database connected successfully (Neon / Serverless Pooler)');

    app.listen(PORT, () => {
      console.log(`🚀 Smart Logistics Backend API running at http://localhost:${PORT}`);
      console.log(`📖 Interactive Swagger API Docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    process.exit(1);
  }
}

startServer();

