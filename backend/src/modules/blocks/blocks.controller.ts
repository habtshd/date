import { FastifyRequest, FastifyReply } from 'fastify';
import { blocksService } from './blocks.service';
import { BlockUserParamSchema } from './blocks.schema';

export class BlocksController {
  async blockUser(request: FastifyRequest, reply: FastifyReply) {
    const blockerId = request.user!.userId;
    const params = BlockUserParamSchema.parse(request.params);
    const result = await blocksService.blockUser(blockerId, params.userId);
    return reply.status(200).send(result);
  }

  async unblockUser(request: FastifyRequest, reply: FastifyReply) {
    const blockerId = request.user!.userId;
    const params = BlockUserParamSchema.parse(request.params);
    const result = await blocksService.unblockUser(blockerId, params.userId);
    return reply.status(200).send(result);
  }

  async getBlockedUsers(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const blockedUsers = await blocksService.getBlockedUsers(userId);
    return reply.status(200).send({ success: true, blockedUsers });
  }
}

export const blocksController = new BlocksController();
