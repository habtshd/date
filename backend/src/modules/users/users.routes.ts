import { FastifyInstance } from 'fastify';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth';

export async function usersRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.delete('/me', { preHandler: [authenticate] }, usersController.deleteAccount);
  fastify.get('/:userId', { preHandler: [authenticate] }, usersController.getUserProfile);
}
