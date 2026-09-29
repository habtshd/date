import { FastifyInstance } from 'fastify';
import { adminController } from './admin.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  // Public admin login
  fastify.post('/login', adminController.login);

  // Moderator & Admin accessible routes
  fastify.get(
    '/reports',
    { preHandler: [authenticate, requireRole('MODERATOR', 'ADMIN')] },
    adminController.getReports
  );
  fastify.get(
    '/reports/:id',
    { preHandler: [authenticate, requireRole('MODERATOR', 'ADMIN')] },
    adminController.getReportDetails
  );
  fastify.patch(
    '/reports/:id',
    { preHandler: [authenticate, requireRole('MODERATOR', 'ADMIN')] },
    adminController.updateReportStatus
  );
  fastify.post(
    '/moderation',
    { preHandler: [authenticate, requireRole('MODERATOR', 'ADMIN')] },
    adminController.executeModeration
  );
  fastify.get(
    '/verification',
    { preHandler: [authenticate, requireRole('MODERATOR', 'ADMIN')] },
    adminController.getVerificationQueue
  );

  // Admin-only operations
  fastify.get(
    '/users',
    { preHandler: [authenticate, requireRole('ADMIN')] },
    adminController.getUsers
  );
  fastify.get(
    '/payments',
    { preHandler: [authenticate, requireRole('ADMIN')] },
    adminController.getPayments
  );
  fastify.get(
    '/metrics',
    { preHandler: [authenticate, requireRole('ADMIN')] },
    adminController.getDashboardMetrics
  );
  fastify.get(
    '/audit-logs',
    { preHandler: [authenticate, requireRole('ADMIN')] },
    adminController.getAuditLogs
  );
}
