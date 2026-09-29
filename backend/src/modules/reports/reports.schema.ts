import { z } from 'zod';

export const FileReportSchema = z.object({
  reportedUserId: z.string().uuid('Invalid user UUID format'),
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
});

export const ReportIdParamSchema = z.object({
  id: z.string().uuid('Invalid report UUID format'),
});
