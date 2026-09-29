import { z } from 'zod';

export const StartVerificationSchema = z.object({
  provider: z.string().default('FAYDA'),
});

export const VerificationWebhookSchema = z.object({
  providerReference: z.string().min(1, 'providerReference is required'),
  status: z.enum(['VERIFIED', 'FAILED', 'SUCCESS']),
  signature: z.string().optional(),
});
