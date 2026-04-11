import { Redis } from 'ioredis';

/**
 * Creates a Redis connection config object.
 * BullMQ Queue and Worker create their own connections internally,
 * so we export a config factory rather than a shared instance where needed.
 */
export function createRedisConnection() {
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null, // Required by BullMQ
  });
}

/**
 * Redis connection options (for passing to BullMQ constructors)
 */
export const redisConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};
