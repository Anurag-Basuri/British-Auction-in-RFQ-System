import { Worker } from "bullmq";
import { createRedisConnection } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { broadcastToRfq } from "../lib/socket.js";
import { logger } from "../lib/logger.js";

let activeWorker: Worker | null = null;

/**
 * Start the BullMQ worker that processes auction closure jobs.
 * Replaces the NestJS AuctionProcessor (@Processor decorator + WorkerHost).
 */
export function startWorker() {
  activeWorker = new Worker(
    "auction",
    async (job) => {
      const { rfqId } = job.data;

      // Step 1: Ensure RFQ still exists and is ACTIVE.
      const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
      if (!rfq || rfq.status === "CLOSED") return;

      // Step 2: Check current time vs close_time (for accuracy).
      const now = new Date();
      if (now >= rfq.close_time || now >= rfq.forced_close_time) {
        await prisma.rfq.update({
          where: { id: rfqId },
          data: { status: "CLOSED" },
        });

        // Notify all clients of auction closure.
        broadcastToRfq(rfqId, "AUCTION_CLOSED", { rfqId, status: "CLOSED" });
      }
    },
    { connection: createRedisConnection("worker") },
  );

  activeWorker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, error: err.message },
      "Auction closure job failed",
    );
  });

  activeWorker.on("error", (err) => {
    // Log all worker processing and connection errors as requested.
    logger.error({ err: err.message, stack: err.stack }, "Worker Error");
  });

  logger.info("Auction background worker initialized");
}

/**
 * Get active BullMQ worker used for graceful shutdowns
 */
export function getWorker() {
  return activeWorker;
}
