import { z } from 'zod';

const phoneRegex = /^\+?[1-9]\d{6,14}$/;

export const RequestOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(phoneRegex, 'Invalid phone number. Must be E.164 compliant (e.g. +251911223344)'),
});

export const VerifyOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(phoneRegex, 'Invalid phone number format'),
  code: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d+$/, 'Verification code must be digits only'),
  deviceId: z.string().min(1, 'Device identifier is required'),
  deviceType: z.enum(['IOS', 'ANDROID', 'WEB']).default('ANDROID'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
