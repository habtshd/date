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
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
});

export const ReportIdParamSchema = z.object({
  id: z.string().uuid('Invalid report UUID format'),
});

export type FileReportInput = z.infer<typeof FileReportSchema>;
