import { z } from 'zod';

export const UpdateAccountStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
});

export const UserIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user UUID format'),
});
