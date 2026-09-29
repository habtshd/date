import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { otpRequestRateLimit, otpVerifyRateLimit } from '../../middleware/rateLimit';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Public endpoints with rate limits
  fastify.post('/send-otp', { config: { rateLimit: otpRequestRateLimit } }, authController.requestOtp);
  fastify.post('/register', { config: { rateLimit: otpRequestRateLimit } }, authController.requestOtp);
  fastify.post('/verify-otp', { config: { rateLimit: otpVerifyRateLimit } }, authController.verifyOtp);
  fastify.post('/refresh', authController.refreshToken);

  // Authenticated endpoints
  fastify.post('/logout', { preHandler: [authenticate] }, authController.logout);
  fastify.get('/me', { preHandler: [authenticate] }, authController.getMe);
}
