import { FastifyRequest, FastifyReply } from 'fastify';
import { notificationsService } from './notifications.service';
import { NotificationIdParamSchema } from './notifications.schema';

export class NotificationsController {
  async getNotifications(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const result = await notificationsService.getUserNotifications(userId);
    return reply.status(200).send({ success: true, ...result });
  }

  async markAsRead(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = NotificationIdParamSchema.parse(request.params);
    const result = await notificationsService.markAsRead(userId, params.id);
    return reply.status(200).send(result);
  }
}

export const notificationsController = new NotificationsController();
