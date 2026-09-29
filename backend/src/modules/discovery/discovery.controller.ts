import { FastifyRequest, FastifyReply } from 'fastify';
import { discoveryService } from './discovery.service';
import { DiscoveryQuerySchema } from './discovery.schema';

export class DiscoveryController {
  async getDiscoveryFeed(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user!;
    const query = DiscoveryQuerySchema.parse(request.query || {});
    const result = await discoveryService.getDiscoveryFeed(
      user.userId,
      user.verificationStatus,
      query.limit
    );
    return reply.status(200).send({ success: true, ...result });
  }
}

export const discoveryController = new DiscoveryController();
