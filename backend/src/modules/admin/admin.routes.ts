import { FastifyInstance } from 'fastify';
import { adminController } from './admin.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/role';

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  // Public admin login
  fastify.post('/login', adminController.login);

  // Protected admin management routes
  fastify.get('/users', { preHandler: [authenticate, requireAdmin] }, adminController.getUsers);
  fastify.get('/reports', { preHandler: [authenticate, requireAdmin] }, adminController.getReports);
  fastify.post('/moderation', { preHandler: [authenticate, requireAdmin] }, adminController.executeModeration);
  fastify.get('/verification', { preHandler: [authenticate, requireAdmin] }, adminController.getVerificationQueue);
  fastify.get('/payments', { preHandler: [authenticate, requireAdmin] }, adminController.getPayments);
  fastify.get('/metrics', { preHandler: [authenticate, requireAdmin] }, adminController.getDashboardMetrics);
  fastify.get('/audit-logs', { preHandler: [authenticate, requireAdmin] }, adminController.getAuditLogs);
}
