import { FastifyRequest, FastifyReply } from 'fastify';
import { conversationsService } from './conversations.service';
import { ConversationIdParamSchema, UnlockConversationBodySchema } from './conversations.schema';

export class ConversationsController {
  async getConversations(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const conversations = await conversationsService.getUserConversations(userId);
    return reply.status(200).send({ success: true, conversations });
  }

  async getConversationById(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = ConversationIdParamSchema.parse(request.params);
    const conversation = await conversationsService.getConversationById(userId, params.id);
    return reply.status(200).send({ success: true, conversation });
  }

  async unlockConversation(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = ConversationIdParamSchema.parse(request.params);
    const body = UnlockConversationBodySchema.parse(request.body || {});
    const result = await conversationsService.requestUnlock(userId, params.id, body.provider);
    return reply.status(200).send({ success: true, ...result });
  }
}

export const conversationsController = new ConversationsController();
