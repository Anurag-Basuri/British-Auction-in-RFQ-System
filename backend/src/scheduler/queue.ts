import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../lib/redis.js';

const auctionQueue = new Queue('auction', { connection: redisConnectionOptions });

/**
 * Schedule (or reschedule) an auction closure job.
 * Removes any existing job for this RFQ to prevent duplicates,
 * then creates a new delayed job.
 */
export async function scheduleClosure(rfqId: number, closeTime: Date) {
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
