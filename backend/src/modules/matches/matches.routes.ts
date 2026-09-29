import { FastifyInstance } from 'fastify';
import { matchesController } from './matches.controller';
import { authenticate } from '../../middleware/auth';
import { requireVerified } from '../../middleware/requireVerified';

export async function matchesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [authenticate, requireVerified] }, matchesController.getMatches);
  fastify.delete('/:id', { preHandler: [authenticate, requireVerified] }, matchesController.unmatch);
}
