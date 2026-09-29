import { FastifyRequest, FastifyReply } from 'fastify';
import { discoveryService } from './discovery.service';
import { DiscoveryQuerySchema } from './discovery.schema';

export class DiscoveryController {
  /**
   * GET /api/v1/discovery (Full verified dating feed)
   */
  async getDiscoveryFeed(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const query = DiscoveryQuerySchema.parse(request.query || {});
    const result = await discoveryService.getDiscoveryFeed(userId, query.limit);
    return reply.status(200).send({ success: true, ...result });
  }

  /**
   * GET /api/v1/discovery/preview (Unverified teaser feed)
   */
  async getDiscoveryPreview(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const result = await discoveryService.getDiscoveryPreview(userId);
    return reply.status(200).send({ success: true, ...result });
  }
}

export const discoveryController = new DiscoveryController();
