import { FastifyInstance } from 'fastify';
import { messagesController } from './messages.controller';
import { authenticate } from '../../middleware/auth';
import { requireVerified } from '../../middleware/role';

export async function messagesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/:id/messages', { preHandler: [authenticate, requireVerified] }, messagesController.getMessages);
  fastify.post('/:id/messages', { preHandler: [authenticate, requireVerified] }, messagesController.sendMessage);
}
