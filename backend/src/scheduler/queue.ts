import { Queue } from 'bullmq';
import { createRedisConnection } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

let auctionQueue: Queue | null = null;

export function initQueue() {
  auctionQueue = new Queue('auction', { connection: createRedisConnection('queue') });
  logger.info('Auction Queue engine initialized natively.');
}

/**
 * Schedule (or reschedule) an auction closure job.
 * Removes any existing job for this RFQ to prevent duplicates,
 * then creates a new delayed job.
 */
export async function scheduleClosure(rfqId: number, closeTime: Date) {
  if (!auctionQueue) {
    logger.warn('Redis queue offline natively. Skipping scheduling.');
    return;
  }
  
  const delay = closeTime.getTime() - Date.now();

  // Remove existing jobs for this RFQ to avoid duplicate closures.
  await auctionQueue.remove(rfqId.toString());

  // Schedule new closure job.
  await auctionQueue.add(
    'close-auction',
    { rfqId },
    {
      jobId: rfqId.toString(),
      delay: delay > 0 ? delay : 0,
    }
  );
}
