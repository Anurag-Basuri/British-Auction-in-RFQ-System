import { z } from 'zod';
import 'dotenv/config';

// Define the absolute minimum environment requirement for backend execution
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().int().positive(),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
