import { z } from 'zod';

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const AdminModerationActionSchema = z.object({
  targetUserId: z.string().uuid(),
  actionType: z.enum(['WARNING', 'SUSPEND', 'BAN', 'UNBAN']),
  reason: z.string().min(3),
  reportId: z.string().uuid().optional(),
});

export const AdminReportQuerySchema = z.object({
  status: z.enum(['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
