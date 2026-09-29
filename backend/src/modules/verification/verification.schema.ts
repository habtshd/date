import { z } from 'zod';

export const StartVerificationSchema = z.object({
  provider: z.string().optional().default('FAYDA'),
});

export const VerificationWebhookSchema = z
  .object({
    providerReference: z.string().min(1, 'providerReference is required').optional(),
    reference: z.string().optional(),
    ref: z.string().optional(),
    status: z.string().min(1, 'status is required'),
    signature: z.string().optional(),
  })
  .passthrough();

export type StartVerificationInput = z.infer<typeof StartVerificationSchema>;
export type VerificationWebhookInput = z.infer<typeof VerificationWebhookSchema>;
