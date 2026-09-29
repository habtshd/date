import { RateLimitOptions } from '@fastify/rate-limit';

export const otpRequestRateLimit: RateLimitOptions = {
  max: 5,
  timeWindow: 15 * 60 * 1000, // 15 minutes
  errorResponseBuilder: () => ({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many OTP requests. Please wait 15 minutes before requesting a new code.',
    },
    message: 'Too many OTP requests. Please wait 15 minutes before requesting a new code.',
  }),
};

export const otpVerifyRateLimit: RateLimitOptions = {
  max: 5,
  timeWindow: 5 * 60 * 1000, // 5 minutes
  errorResponseBuilder: () => ({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many verification attempts. Please wait 5 minutes before trying again.',
    },
    message: 'Too many verification attempts. Please wait 5 minutes before trying again.',
  }),
};

export const otpRefreshRateLimit: RateLimitOptions = {
  max: 20,
  timeWindow: 15 * 60 * 1000,
  errorResponseBuilder: () => ({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many token refresh attempts. Please slow down.',
    },
    message: 'Too many token refresh attempts. Please slow down.',
  }),
};

export const likesRateLimit: RateLimitOptions = {
  max: 100,
  timeWindow: 60 * 60 * 1000, // 100 requests per hour per user
  errorResponseBuilder: () => ({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Daily like limit reached. Please try again later.',
    },
    message: 'Daily like limit reached. Please try again later.',
  }),
};

export const messagesRateLimit: RateLimitOptions = {
  max: 60,
  timeWindow: 60 * 1000, // 60 messages per minute
  errorResponseBuilder: () => ({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Messaging rate limit exceeded. Please slow down.',
    },
    message: 'Messaging rate limit exceeded. Please slow down.',
  }),
};

export const reportsRateLimit: RateLimitOptions = {
  max: 10,
  timeWindow: 24 * 60 * 60 * 1000, // 10 reports per day
  errorResponseBuilder: () => ({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Report submission limit reached for today.',
    },
    message: 'Report submission limit reached for today.',
  }),
};

export const verificationRateLimit: RateLimitOptions = {
  max: 5,
  timeWindow: 24 * 60 * 60 * 1000, // 5 verification attempts per day
  errorResponseBuilder: () => ({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Verification attempt limit reached. Please try again tomorrow.',
    },
    message: 'Verification attempt limit reached. Please try again tomorrow.',
  }),
};

export const paymentsRateLimit: RateLimitOptions = {
  max: 10,
  timeWindow: 15 * 60 * 1000, // 10 payments per 15 minutes
  errorResponseBuilder: () => ({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many payment creation requests. Please wait a few minutes.',
    },
    message: 'Too many payment creation requests. Please wait a few minutes.',
  }),
};

export const standardRateLimit: RateLimitOptions = {
  max: 100,
  timeWindow: 60 * 1000, // 1 minute
  errorResponseBuilder: () => ({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded. Please slow down your requests.',
    },
    message: 'Rate limit exceeded. Please slow down your requests.',
  }),
};
