import { z } from 'zod';

export const AdminLoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const AdminModerationActionSchema = z.object({
  body: z.object({
    reportId: z.string().uuid().optional(),
    targetUserId: z.string().uuid(),
    actionType: z.enum([
      'WARNING',
      'PHOTO_REMOVAL',
      'TEMPORARY_SUSPENSION',
      'PERMANENT_BAN',
      'UNBAN',
    ]),
    reason: z.string().min(5, 'Mandatory audit justification required'),
    durationHours: z.number().int().positive().optional(),
  }),
});
