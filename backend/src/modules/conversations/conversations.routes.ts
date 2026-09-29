import { FastifyInstance } from 'fastify';
import { conversationsController } from './conversations.controller';
import { authenticate } from '../../middleware/auth';
import { requireVerified } from '../../middleware/requireVerified';

export async function conversationsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [authenticate, requireVerified] }, conversationsController.getConversations);
  fastify.get('/:id', { preHandler: [authenticate, requireVerified] }, conversationsController.getConversationById);
  fastify.post('/:id/payment', { preHandler: [authenticate, requireVerified] }, conversationsController.createPayment);
  fastify.post('/:id/unlock', { preHandler: [authenticate, requireVerified] }, conversationsController.unlockConversation);
}
