import { z } from 'zod';

export const ConversationIdParamSchema = z.object({
  id: z.string().uuid('Invalid conversation UUID format'),
});

export const UnlockConversationBodySchema = z.object({
  provider: z.enum(['CHAPA', 'TELEBIRR']).default('CHAPA'),
});
