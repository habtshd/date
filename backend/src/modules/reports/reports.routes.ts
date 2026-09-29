import { FastifyInstance } from 'fastify';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth';

export async function reportsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/', { preHandler: [authenticate] }, reportsController.fileReport);
  fastify.get('/:id', { preHandler: [authenticate] }, reportsController.getReport);
}
