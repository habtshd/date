import { z } from 'zod';

export const CreateReportSchema = z.object({
  body: z.object({
    reportedUserId: z.string().uuid('Valid user UUID required'),
    conversationId: z.string().uuid().optional(),
    reason: z.enum([
      'HARASSMENT',
      'SCAM',
      'FAKE_PROFILE',
      'SEXUAL_CONTENT',
      'THREATS',
      'SPAM',
      'IMPERSONATION',
      'OTHER',
    ]),
    description: z.string().max(1000).optional(),
  }),
});
