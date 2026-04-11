import { Worker } from 'bullmq';
import { redisConnectionOptions } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { broadcastToRfq } from '../lib/socket.js';

/**
 * Start the BullMQ worker that processes auction closure jobs.
 * Replaces the NestJS AuctionProcessor (@Processor decorator + WorkerHost).
 */
export function startWorker() {
  const worker = new Worker(
    'auction',
    async (job) => {
      const { rfqId } = job.data;

      // Step 1: Ensure RFQ still exists and is ACTIVE.
      const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
      if (!rfq || rfq.status === 'CLOSED') return;

      // Step 2: Check current time vs close_time (for accuracy).
      const now = new Date();
      if (now >= rfq.close_time || now >= rfq.forced_close_time) {
        await prisma.rfq.update({
          where: { id: rfqId },
          data: { status: 'CLOSED' },
        });

        // Notify all clients of auction closure.
        broadcastToRfq(rfqId, 'AUCTION_CLOSED', { rfqId, status: 'CLOSED' });
      }
    },
    { connection: redisConnectionOptions }
  );

  worker.on('failed', (job, err) => {
    console.error(`Auction closure job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    // Silently handle Redis connection errors —
    // BullMQ will auto-reconnect when Redis becomes available.
    if (!err.message.includes('ECONNREFUSED') && !err.message.includes('Connection is closed')) {
      console.error('Worker error:', err.message);
    }
  });

  console.log('Auction worker started');
}
