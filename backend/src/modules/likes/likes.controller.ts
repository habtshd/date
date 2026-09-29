import { FastifyRequest, FastifyReply } from 'fastify';
import { likesService } from './likes.service';
import { LikeParamSchema } from './likes.schema';

export class LikesController {
  async likeUser(request: FastifyRequest, reply: FastifyReply) {
    const fromUserId = request.user!.userId;
    const params = LikeParamSchema.parse(request.params);

    try {
      const result = await likesService.likeProfile(fromUserId, params.userId);
      return reply.status(200).send({ success: true, ...result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'LIKE_FAILED';
      if (message === 'CANNOT_LIKE_SELF') {
        return reply.status(400).send({
          success: false,
          error: 'CANNOT_LIKE_SELF',
          message: 'You cannot like your own profile',
        });
      }
      if (message === 'USER_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Target profile not found',
        });
      }
      if (message === 'USER_UNAVAILABLE') {
        return reply.status(400).send({
          success: false,
          error: 'USER_UNAVAILABLE',
          message: 'Target profile is unavailable or blocked',
        });
      }
      throw err;
    }
  }

  async unlikeUser(request: FastifyRequest, reply: FastifyReply) {
    const fromUserId = request.user!.userId;
    const params = LikeParamSchema.parse(request.params);
    const result = await likesService.unlikeProfile(fromUserId, params.userId);
    return reply.status(200).send(result);
  }
}

export const likesController = new LikesController();
