import { FastifyInstance } from 'fastify';
import { discoveryController } from './discovery.controller';
import { authenticate } from '../../middleware/auth';
import { requireVerified } from '../../middleware/requireVerified';

export async function discoveryRoutes(fastify: FastifyInstance): Promise<void> {
  // Full dating discovery feed - strictly verified accounts only
  fastify.get(
    '/',
    {
      preHandler: [authenticate, requireVerified],
    },
    discoveryController.getDiscoveryFeed
  );

  // Discovery preview for unverified accounts (blurred photos, restricted fields)
  fastify.get(
    '/preview',
    {
      preHandler: [authenticate],
    },
    discoveryController.getDiscoveryPreview
  );
}
