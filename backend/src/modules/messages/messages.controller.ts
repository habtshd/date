import { FastifyRequest, FastifyReply } from 'fastify';
import { messagesService } from './messages.service';
import {
  ConversationMessageParamsSchema,
  SendMessageBodySchema,
  GetMessagesQuerySchema,
} from './messages.schema';

export class MessagesController {
  async getMessages(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = ConversationMessageParamsSchema.parse(request.params);
    const query = GetMessagesQuerySchema.parse(request.query || {});
    const messages = await messagesService.getMessages(userId, params.id, query.limit);
    return reply.status(200).send({ success: true, messages });
  }

  async sendMessage(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = ConversationMessageParamsSchema.parse(request.params);
    const body = SendMessageBodySchema.parse(request.body);
    const message = await messagesService.sendMessage(userId, params.id, body);
    return reply.status(201).send({ success: true, message });
  }
}

export const messagesController = new MessagesController();
