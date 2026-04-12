import { createServer } from 'http';
import { app } from './app.js';
import { initSocketServer, getSocketServer } from './lib/socket.js';
import { startWorker, getWorker } from './scheduler/worker.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const PORT = env.PORT;

// Create HTTP server from Express app
const httpServer = createServer(app);

// Attach Socket.IO to the HTTP server
initSocketServer(httpServer);

// Start BullMQ auction closure worker
startWorker();

const server = httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
});

/**
 * High Availability Graceful Shutdown Hook
 * Safe disconnection handles scaling pods down without breaking active DB operations
 */
async function gracefulShutdown(signal: string) {
  logger.warn(`Received ${signal}. Gracefully shutting down...`);

  // 1. Stop receiving new HTTP traffic
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error during HTTP server closure');
    }

    try {
      // 2. Disconnect Real-time engine
      const io = getSocketServer();
      if (io) {
         io.close();
         logger.info('Socket.IO safely disconnected');
      }

      // 3. Pause & gracefully terminate active background workers
      const bullWorker = getWorker();
      if (bullWorker) {
        await bullWorker.close();
        logger.info('BullMQ Worker successfully terminated');
      }

      // 4. Teardown Database handles
      await prisma.$disconnect();
      logger.info('Prisma disconnected successfully');

      logger.info('Shutdown complete. Process exiting.');
      process.exit(0);
    } catch (e) {
      logger.error({ err: e }, 'Fatal error during shutdown');
      process.exit(1);
    }
  });

  // Failsafe exit logic
  setTimeout(() => {
    logger.error('Forcing exit due to hanging cleanup tasks (10s timeout)');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

