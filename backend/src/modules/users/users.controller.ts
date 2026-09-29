import { FastifyRequest, FastifyReply } from 'fastify';
import { usersService } from './users.service';
import { UserIdParamSchema } from './users.schema';

export class UsersController {
  async deleteAccount(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const result = await usersService.deleteAccount(userId);
    return reply.status(200).send(result);
  }

  async getUserProfile(request: FastifyRequest, reply: FastifyReply) {
    const params = UserIdParamSchema.parse(request.params);
    const viewerId = request.user!.userId;
    const profile = await usersService.getUserPublicProfile(viewerId, params.userId);
    return reply.status(200).send({ success: true, profile });
  }
}

export const usersController = new UsersController();
