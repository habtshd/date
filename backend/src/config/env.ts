import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  ACCESS_TOKEN_EXPIRES: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES: z.string().default('30d'),

  STORAGE_ENDPOINT: z.string().optional().default(''),
  STORAGE_BUCKET: z.string().optional().default('ethiopian-dating-assets'),
  STORAGE_ACCESS_KEY: z.string().optional().default(''),
  STORAGE_SECRET_KEY: z.string().optional().default(''),

  VERIFICATION_PROVIDER: z.string().default('FAYDA'),
  PAYMENT_PROVIDER: z.string().default('CHAPA'),

  CORS_ORIGIN: z.string().default('*'),
  CONVERSATION_UNLOCK_PRICE_ETB: z.coerce.number().default(50.0),
  OTP_SMS_MOCK_ENABLED: z.coerce.boolean().default(true),
  OTP_DEFAULT_CODE: z.string().default('123456'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ FATAL: Invalid Environment Configuration:');
  parsedEnv.error.errors.forEach((err) => {
    console.error(`   - ${err.path.join('.')}: ${err.message}`);
  });
  process.exit(1);
}

export const env = parsedEnv.data;
