import { FastifyRequest, FastifyReply } from 'fastify';
import { likesService } from './likes.service';
import { LikeParamSchema } from './likes.schema';

export class LikesController {
  async likeUser(request: FastifyRequest, reply: FastifyReply) {
    const fromUserId = request.user!.userId;
    const params = LikeParamSchema.parse(request.params);
    const result = await likesService.likeProfile(fromUserId, params.userId);
    return reply.status(200).send({ success: true, ...result });
  }

  async unlikeUser(request: FastifyRequest, reply: FastifyReply) {
    const fromUserId = request.user!.userId;
    const params = LikeParamSchema.parse(request.params);
    const result = await likesService.unlikeProfile(fromUserId, params.userId);
    return reply.status(200).send(result);
  }
}

export const likesController = new LikesController();
