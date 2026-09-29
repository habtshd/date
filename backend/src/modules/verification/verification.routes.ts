import { FastifyInstance } from 'fastify';
import { verificationController } from './verification.controller';
import { authenticate } from '../../middleware/auth';

export async function verificationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/start', { preHandler: [authenticate] }, verificationController.startVerification);
  fastify.get('/status', { preHandler: [authenticate] }, verificationController.getStatus);
  fastify.post('/webhook', verificationController.handleWebhook);
}
