import { z } from 'zod';

// Validates E.164 phone numbers (e.g., +251911223344 or +251711223344 for Ethiopia)
const phoneRegex = /^\+?[1-9]\d{6,14}$/;

export const RequestOtpSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(phoneRegex, 'Invalid phone number format. Must be E.164 compliant (e.g. +251911223344)'),
  }),
});

export const VerifyOtpSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(phoneRegex, 'Invalid phone number format'),
    code: z
      .string()
      .length(6, 'Verification code must be exactly 6 digits')
      .regex(/^\d+$/, 'Verification code must contain digits only'),
    deviceId: z.string().min(1, 'Device identifier is required'),
    deviceInfo: z.record(z.unknown()).optional(),
  }),
});

export const RefreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});
