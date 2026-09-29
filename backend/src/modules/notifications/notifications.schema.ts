import { z } from 'zod';

export const NotificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification UUID format'),
});

export const NotificationPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const RegisterDeviceSchema = z.object({
  deviceType: z.enum(['IOS', 'ANDROID', 'WEB']),
  pushToken: z.string().min(5).max(512),
});

export const UnregisterDeviceParamSchema = z.object({
  pushToken: z.string().min(5).max(512),
});

export const UpdateNotificationPreferenceSchema = z.object({
  newMatch: z.boolean().optional(),
  newMessage: z.boolean().optional(),
  paymentUpdates: z.boolean().optional(),
  verificationUpdates: z.boolean().optional(),
  reportUpdates: z.boolean().optional(),
});
