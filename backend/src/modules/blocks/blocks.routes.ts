import { FastifyInstance } from 'fastify';
import { blocksController } from './blocks.controller';
import { authenticate } from '../../middleware/auth';

export async function blocksRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [authenticate] }, blocksController.getBlockedUsers);
  fastify.post('/:userId', { preHandler: [authenticate] }, blocksController.blockUser);
  fastify.delete('/:userId', { preHandler: [authenticate] }, blocksController.unblockUser);
}
