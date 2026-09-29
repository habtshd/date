import { RateLimitOptions } from '@fastify/rate-limit';

export const otpRequestRateLimit: RateLimitOptions = {
  max: 5,
  timeWindow: 15 * 60 * 1000, // 15 minutes
  errorResponseBuilder: () => ({
    success: false,
    message: 'Too many OTP requests. Please wait 15 minutes before requesting a new code.',
  }),
};

export const otpVerifyRateLimit: RateLimitOptions = {
  max: 10,
  timeWindow: 5 * 60 * 1000, // 5 minutes
  errorResponseBuilder: () => ({
    success: false,
    message: 'Too many verification attempts. Please wait 5 minutes before trying again.',
  }),
};

export const standardRateLimit: RateLimitOptions = {
  max: 100,
  timeWindow: 60 * 1000, // 1 minute
  errorResponseBuilder: () => ({
    success: false,
    message: 'Rate limit exceeded. Please slow down your requests.',
  }),
};
