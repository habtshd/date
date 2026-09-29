import { z } from 'zod';

export const CreatePaymentSchema = z.object({
  conversationId: z.string().uuid('Valid conversation UUID required'),
  provider: z.enum(['CHAPA', 'TELEBIRR']).default('CHAPA'),
});

export const PaymentIdParamSchema = z.object({
  id: z.string().uuid('Valid payment UUID required'),
});

export const PaymentWebhookSchema = z.object({
  paymentId: z.string().optional(),
  tx_ref: z.string().optional(),
  status: z.string().optional(),
  tradeStatus: z.string().optional(),
  signature: z.string().optional(),
}).passthrough();
