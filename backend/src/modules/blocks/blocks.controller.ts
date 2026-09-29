import { FastifyRequest, FastifyReply } from 'fastify';
import { blocksService } from './blocks.service';
import { BlockUserParamSchema } from './blocks.schema';

export class BlocksController {
  async blockUser(request: FastifyRequest, reply: FastifyReply) {
    const blockerId = request.user!.userId;
    const params = BlockUserParamSchema.parse(request.params);
    try {
      const result = await blocksService.blockUser(blockerId, params.userId);
      return reply.status(200).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'BLOCK_FAILED';
      if (message === 'CANNOT_BLOCK_SELF') {
        return reply.status(400).send({
          success: false,
          error: 'CANNOT_BLOCK_SELF',
          message: 'You cannot block your own profile',
        });
      }
      if (message === 'USER_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Target user not found',
        });
      }
      throw err;
    }
  }

  async unblockUser(request: FastifyRequest, reply: FastifyReply) {
    const blockerId = request.user!.userId;
    const params = BlockUserParamSchema.parse(request.params);
    try {
      const result = await blocksService.unblockUser(blockerId, params.userId);
      return reply.status(200).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'UNBLOCK_FAILED';
      if (message === 'BLOCK_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: 'BLOCK_NOT_FOUND',
          message: 'Block relationship not found',
        });
      }
      throw err;
    }
  }

  async getBlockedUsers(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const blockedUsers = await blocksService.getBlockedUsers(userId);
    return reply.status(200).send({ success: true, blockedUsers });
  }
}

export const blocksController = new BlocksController();
