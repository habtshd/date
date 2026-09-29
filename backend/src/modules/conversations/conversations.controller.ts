import { FastifyRequest, FastifyReply } from 'fastify';
import { conversationsService } from './conversations.service';
import { paymentsService } from '../payments/payments.service';
import { ConversationIdParamSchema } from './conversations.schema';

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

  async createPayment(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = ConversationIdParamSchema.parse(request.params);
    try {
      const result = await paymentsService.createConversationPayment(userId, params.id);
      return reply.status(200).send({ success: true, ...result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PAYMENT_FAILED';
      if (message === 'CONVERSATION_NOT_FOUND') {
        return reply.status(404).send({ success: false, error: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' });
      }
      if (message === 'FORBIDDEN') {
        return reply.status(403).send({ success: false, error: 'FORBIDDEN', message: 'You are not a member of this conversation' });
      }
      if (message === 'MATCH_NOT_ACTIVE') {
        return reply.status(400).send({ success: false, error: 'MATCH_NOT_ACTIVE', message: 'Match is no longer active' });
      }
      if (message === 'CONVERSATION_ALREADY_UNLOCKED') {
        return reply.status(400).send({ success: false, error: 'CONVERSATION_ALREADY_UNLOCKED', message: 'Conversation is already unlocked' });
      }
      if (message === 'ALREADY_PAID') {
        return reply.status(400).send({ success: false, error: 'ALREADY_PAID', message: 'Conversation payment already completed' });
      }
      throw err;
    }
  }

  async unlockConversation(request: FastifyRequest, reply: FastifyReply) {
    return this.createPayment(request, reply);
  }
}

export const conversationsController = new ConversationsController();
