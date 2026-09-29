import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dating_app?schema=app',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback-secret-access-key-do-not-use-in-prod',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-secret-refresh-key-do-not-use-in-prod',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  payment: {
    chapaSecretKey: process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-mock',
    chapaWebhookSecret: process.env.CHAPA_WEBHOOK_SECRET || 'mock-chapa-secret',
    telebirrAppId: process.env.TELEBIRR_APP_ID || 'mock-telebirr-app',
    telebirrAppKey: process.env.TELEBIRR_APP_KEY || 'mock-telebirr-key',
    telebirrShortCode: process.env.TELEBIRR_SHORT_CODE || '12345',
    conversationUnlockPriceEtb: parseFloat(process.env.CONVERSATION_UNLOCK_PRICE_ETB || '50.00'),
  },

  otp: {
    smsMockEnabled: process.env.OTP_SMS_MOCK_ENABLED === 'true',
    defaultCode: process.env.OTP_DEFAULT_CODE || '123456',
    expiryMinutes: 5,
    maxAttempts: 3,
  },
};
