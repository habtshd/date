import { FastifyRequest, FastifyReply } from 'fastify';
import { passesService } from './passes.service';
import { PassParamSchema } from './passes.schema';

export class PassesController {
  async passUser(request: FastifyRequest, reply: FastifyReply) {
    const fromUserId = request.user!.userId;
    const params = PassParamSchema.parse(request.params);
    try {
      const result = await passesService.passProfile(fromUserId, params.userId);
      return reply.status(200).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PASS_FAILED';
      if (message === 'CANNOT_PASS_SELF') {
        return reply.status(400).send({
          success: false,
          error: 'CANNOT_PASS_SELF',
          message: 'You cannot pass on your own profile',
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
}

export const passesController = new PassesController();
