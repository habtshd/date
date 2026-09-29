import { FastifyInstance } from 'fastify';
import { likesController } from './likes.controller';
import { authenticate } from '../../middleware/auth';
import { requireVerified } from '../../middleware/role';

export async function likesRoutes(fastify: FastifyInstance): Promise<void> {
  // Like requires authentication and identity verification
  fastify.post('/:userId', { preHandler: [authenticate, requireVerified] }, likesController.likeUser);
  fastify.delete('/:userId', { preHandler: [authenticate, requireVerified] }, likesController.unlikeUser);
}
