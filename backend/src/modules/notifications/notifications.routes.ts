import { FastifyInstance } from 'fastify';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/auth';

export async function notificationsRoutes(fastify: FastifyInstance): Promise<void> {
  // In-app notifications
  fastify.get('/', { preHandler: [authenticate] }, notificationsController.getNotifications);
  fastify.post('/:id/read', { preHandler: [authenticate] }, notificationsController.markAsRead);
  fastify.patch('/:id/read', { preHandler: [authenticate] }, notificationsController.markAsRead);
  fastify.post('/read-all', { preHandler: [authenticate] }, notificationsController.markAllAsRead);

  // Notification preferences
  fastify.get('/preferences', { preHandler: [authenticate] }, notificationsController.getPreferences);
  fastify.patch('/preferences', { preHandler: [authenticate] }, notificationsController.updatePreferences);

  // Devices & Push tokens
  fastify.post('/devices', { preHandler: [authenticate] }, notificationsController.registerDevice);
  fastify.get('/devices', { preHandler: [authenticate] }, notificationsController.getUserDevices);
  fastify.delete('/devices/:pushToken', { preHandler: [authenticate] }, notificationsController.removeDevice);
}
