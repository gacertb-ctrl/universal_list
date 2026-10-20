import dotenv from 'dotenv';
dotenv.config();

console.log('=== SERVER TS LOADED ===');
import app from './src/app';
import prisma from './src/config/db';
import { aiScheduler } from './src/jobs/aiScheduler';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Attempt to connect to the database to verify it's working
    await prisma.$connect();
    console.log('Successfully connected to the database.');

    // Initialize Gemini AI Daily Scheduler
    await aiScheduler.initialize();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected on app termination');
  process.exit(0);
});
