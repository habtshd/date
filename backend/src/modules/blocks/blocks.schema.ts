import { z } from 'zod';

export const BlockUserParamSchema = z.object({
  userId: z.string().uuid('Invalid user UUID format'),
});
