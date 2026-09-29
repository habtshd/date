import { FastifyRequest, FastifyReply } from 'fastify';
import { matchesService } from './matches.service';
import { MatchIdParamSchema } from './matches.schema';

export class MatchesController {
  async getMatches(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const matches = await matchesService.getUserMatches(userId);
    return reply.status(200).send({ success: true, matches });
  }

  async unmatch(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = MatchIdParamSchema.parse(request.params);
    const result = await matchesService.unmatch(userId, params.id);
    return reply.status(200).send(result);
  }
}

export const matchesController = new MatchesController();
