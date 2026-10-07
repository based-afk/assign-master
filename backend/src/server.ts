import { createApp } from './app';
import { config } from './config';
import { prisma } from './db/prisma';

const app = createApp();

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ Connected to Database successfully.');

    app.listen(config.port, () => {
      console.log(`🚀 Server running in ${config.nodeEnv} mode on http://localhost:${config.port}`);
      console.log(`📡 API endpoints mounted at http://localhost:${config.port}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
