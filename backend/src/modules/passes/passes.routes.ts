import { FastifyInstance } from 'fastify';
import { passesController } from './passes.controller';
import { authenticate } from '../../middleware/auth';
import { requireVerified } from '../../middleware/requireVerified';

export async function passesRoutes(fastify: FastifyInstance): Promise<void> {
  // Pass on a user profile (requires verified dating participant)
  fastify.post('/:userId', { preHandler: [authenticate, requireVerified] }, passesController.passUser);
}
