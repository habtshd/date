import { z } from 'zod';

export const SubmitVerificationSchema = z.object({
  body: z.object({
    idDocumentType: z.enum(['FAYDA_FIN', 'PASSPORT', 'RESIDENT_ID']),
    idDocumentNumber: z.string().min(4, 'ID document identifier is required'),
    livenessSessionId: z.string().min(1, 'Liveness session token is required'),
  }),
});

export const VerificationWebhookSchema = z.object({
  body: z.object({
    referenceToken: z.string().min(1),
    status: z.enum(['VERIFIED', 'REJECTED']),
    rejectionReason: z.string().optional(),
    providerSignature: z.string().min(1),
  }),
});
