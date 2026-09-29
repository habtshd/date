import { FastifyRequest, FastifyReply } from 'fastify';
import { notificationsService } from './notifications.service';
import {
  NotificationIdParamSchema,
  NotificationPaginationQuerySchema,
  RegisterDeviceSchema,
  UnregisterDeviceParamSchema,
  UpdateNotificationPreferenceSchema,
} from './notifications.schema';

export class NotificationsController {
  async getNotifications(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const query = NotificationPaginationQuerySchema.parse(request.query || {});
    const result = await notificationsService.getUserNotifications(userId, query.page, query.limit);
    return reply.status(200).send({ success: true, ...result });
  }

  async markAsRead(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = NotificationIdParamSchema.parse(request.params);
    try {
      const result = await notificationsService.markAsRead(userId, params.id);
      return reply.status(200).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'MARK_READ_FAILED';
      if (message === 'NOTIFICATION_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found or does not belong to you',
        });
      }
      throw err;
    }
  }

  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const result = await notificationsService.markAllAsRead(userId);
    return reply.status(200).send(result);
  }

  async getPreferences(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const preferences = await notificationsService.getPreferences(userId);
    return reply.status(200).send({ success: true, preferences });
  }

  async updatePreferences(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = UpdateNotificationPreferenceSchema.parse(request.body);
    const preferences = await notificationsService.updatePreferences(userId, body);
    return reply.status(200).send({ success: true, preferences });
  }

  async registerDevice(request: FastifyRequest, reply: FastifyReply) {
    // Crucial invariant: Server always derives user from JWT session, never from body
    const userId = request.user!.userId;
    const body = RegisterDeviceSchema.parse(request.body);
    const result = await notificationsService.registerDevice(
      userId,
      body.deviceType as any,
      body.pushToken
    );
    return reply.status(200).send(result);
  }

  async removeDevice(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = UnregisterDeviceParamSchema.parse(request.params);
    const result = await notificationsService.removeDevice(userId, params.pushToken);
    return reply.status(200).send(result);
  }

  async getUserDevices(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const devices = await notificationsService.getUserDevices(userId);
    return reply.status(200).send({ success: true, devices });
  }
}

export const notificationsController = new NotificationsController();
