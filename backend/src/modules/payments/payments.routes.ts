import { FastifyInstance } from 'fastify';
import { paymentsController } from './payments.controller';
import { authenticate } from '../../middleware/auth';
import { requireVerified } from '../../middleware/role';

export async function paymentsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/create', { preHandler: [authenticate, requireVerified] }, paymentsController.createPayment);
  fastify.get('/:id', { preHandler: [authenticate, requireVerified] }, paymentsController.getPayment);
  fastify.post('/webhook', paymentsController.handleWebhook);
}
