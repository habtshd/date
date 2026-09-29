import { z } from 'zod';

export const CreateConversationPaymentSchema = z.object({
  body: z.object({
    conversationId: z.string().uuid('Valid conversation UUID required'),
    provider: z.enum(['TELEBIRR', 'CBE_BIRR', 'CHAPA', 'STRIPE']),
    returnUrl: z.string().url().optional(),
  }),
});

export const ChapaWebhookSchema = z.object({
  body: z.record(z.unknown()),
  headers: z.object({
    'x-chapa-signature': z.string().optional(),
  }).passthrough(),
});
