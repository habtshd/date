import { z } from 'zod';

export const LikeParamSchema = z.object({
  userId: z.string().uuid('Invalid user UUID format'),
});
