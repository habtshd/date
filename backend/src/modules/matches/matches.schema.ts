import { z } from 'zod';

export const MatchIdParamSchema = z.object({
  id: z.string().uuid('Invalid match UUID format'),
});
