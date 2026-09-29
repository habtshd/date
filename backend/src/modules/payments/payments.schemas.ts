import { z } from 'zod';

export const CreateConversationPaymentSchema = z.object({
  body: z.object({
    conversationId: z.string().uuid('Valid conversation UUID required'),
    provider: z.string().default('CHAPA'),
  }),
});
