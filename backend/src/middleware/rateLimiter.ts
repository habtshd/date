import rateLimit from 'express-rate-limit';

// Strict rate limit for OTP requests (e.g. 5 requests per 15 minutes per IP/phone)
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many OTP requests from this address. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for OTP verification attempts (prevents brute forcing the 6-digit code)
export const otpVerifyRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many verification attempts. Please wait 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
export const standardApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
