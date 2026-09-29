import { FastifyInstance } from 'fastify';
import { notificationsController } from '../notifications/notifications.controller';
import { authenticate } from '../../middleware/auth';

export async function devicesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/', { preHandler: [authenticate] }, notificationsController.registerDevice);
  fastify.get('/', { preHandler: [authenticate] }, notificationsController.getUserDevices);
  fastify.delete('/:pushToken', { preHandler: [authenticate] }, notificationsController.removeDevice);
}
