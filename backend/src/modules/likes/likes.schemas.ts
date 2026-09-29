import { z } from 'zod';

export const LikeProfileSchema = z.object({
  body: z.object({
    targetUserId: z.string().uuid('Valid target user UUID required'),
    isSuperlike: z.boolean().default(false),
  }),
});

export const PassProfileSchema = z.object({
  body: z.object({
    targetUserId: z.string().uuid('Valid target user UUID required'),
  }),
});
