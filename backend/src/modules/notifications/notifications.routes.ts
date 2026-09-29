import { FastifyInstance } from 'fastify';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/auth';

export async function notificationsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [authenticate] }, notificationsController.getNotifications);
  fastify.patch('/:id/read', { preHandler: [authenticate] }, notificationsController.markAsRead);
}
