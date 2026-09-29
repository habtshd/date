import { z } from 'zod';

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const AdminModerationActionSchema = z.object({
  targetUserId: z.string().uuid(),
  actionType: z.enum([
    'WARNING',
    'SUSPEND',
    'BAN',
    'UNBAN',
    'CONTENT_REMOVED',
    'TEMPORARY_SUSPENSION',
    'PERMANENT_BAN',
    'REPORT_DISMISSED',
    'VERIFICATION_REVIEW',
  ]),
  reason: z.string().min(3).max(2000),
  reportId: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const AdminUpdateReportSchema = z.object({
  status: z.enum(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED', 'PENDING', 'INVESTIGATING']),
  resolutionNotes: z.string().max(2000).optional(),
});

export const AdminReportQuerySchema = z.object({
  status: z.enum(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED', 'PENDING', 'INVESTIGATING']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
