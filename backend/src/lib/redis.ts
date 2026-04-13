import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Creates a unique Redis connection for BullMQ using the Upstash TLS URL
 * This prevents ioredis from incessantly spamming unhandled network errors perfectly into the raw Node console.
 */
export function createRedisConnection(clientName: string) {
  // ioredis parses the full rediss:// url including username, password, host, port, and TLS rules natively
  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });

  connection.on("error", (err: any) => {
    // Explicitly trap and silence background socket TCP errors.
    // They don't need to be repeatedly printed; the application health logs will reflect the status natively.
  });

  return connection;
}
