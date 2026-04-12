import { Redis, RedisOptions } from 'ioredis';
import { logger } from './logger.js';

const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
};

/**
 * Creates a unique Redis connection for BullMQ with trapped error handlers.
 * This prevents ioredis from incessantly spamming unhandled network errors perfectly into the raw Node console.
 */
export function createRedisConnection(clientName: string) {
  const connection = new Redis(redisOptions);

  connection.on('error', (err: any) => {
    // Explicitly trap and silence background socket TCP errors. 
    // They don't need to be repeatedly printed; the application health logs will reflect the status natively.
  });

  return connection;
}
