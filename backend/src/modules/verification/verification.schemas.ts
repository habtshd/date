import { z } from 'zod';

export const SubmitVerificationSchema = z.object({
  body: z.object({
    provider: z.string().default('FAYDA'),
  }),
});

export const VerificationWebhookSchema = z.object({
  body: z.object({
    providerReference: z.string().min(1),
    status: z.enum(['VERIFIED', 'FAILED']),
  }),
});
