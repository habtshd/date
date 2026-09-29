import { z } from 'zod';

export const PassParamSchema = z.object({
  userId: z.string().uuid('Invalid user UUID'),
});

export type PassParamInput = z.infer<typeof PassParamSchema>;
