import { z } from 'zod';

const phoneRegex = /^\+?[1-9]\d{6,14}$/;

export const RequestOtpSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string()
      .regex(phoneRegex, 'Invalid phone number format. Must be E.164 compliant (e.g. +251911223344)'),
  }),
});

export const VerifyOtpSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string()
      .regex(phoneRegex, 'Invalid phone number format'),
    code: z
      .string()
      .length(6, 'Verification code must be exactly 6 digits')
      .regex(/^\d+$/, 'Verification code must contain digits only'),
    deviceId: z.string().min(1, 'Device identifier is required'),
    deviceType: z.enum(['IOS', 'ANDROID', 'WEB']).default('ANDROID'),
  }),
});

export const RefreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});
