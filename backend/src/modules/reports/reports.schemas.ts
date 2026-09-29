import { z } from 'zod';

export const CreateReportSchema = z.object({
  body: z.object({
    reportedUserId: z.string().uuid('Valid user UUID required'),
    conversationId: z.string().uuid().optional(),
    reason: z.enum([
      'HARASSMENT',
      'INAPPROPRIATE_CONTENT',
      'FAKE_PROFILE',
      'SCAM_FINANCIAL',
      'UNDERAGE',
      'HATE_SPEECH',
      'OTHER',
    ]),
    description: z.string().max(1000).optional(),
  }),
});
