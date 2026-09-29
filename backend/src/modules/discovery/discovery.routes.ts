import { FastifyInstance } from 'fastify';
import { discoveryController } from './discovery.controller';
import { authenticate } from '../../middleware/auth';

export async function discoveryRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [authenticate] }, discoveryController.getDiscoveryFeed);
}
