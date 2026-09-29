import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { RequestOtpSchema, VerifyOtpSchema, RefreshTokenSchema } from './auth.schemas';
import { requireAuth } from '../../middleware/auth.middleware';
import { otpRateLimiter, otpVerifyRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post(
  '/request-otp',
  otpRateLimiter,
  validate(RequestOtpSchema),
  authController.requestOtp
);

router.post(
  '/verify-otp',
  otpVerifyRateLimiter,
  validate(VerifyOtpSchema),
  authController.verifyOtp
);

router.post(
  '/refresh',
  validate(RefreshTokenSchema),
  authController.refreshToken
);

router.post(
  '/logout',
  requireAuth,
  authController.logout
);

router.get(
  '/me',
  requireAuth,
  authController.getMe
);

export const authRouter = router;
