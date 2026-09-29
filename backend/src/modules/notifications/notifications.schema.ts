import { z } from 'zod';

export const NotificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification UUID format'),
});
