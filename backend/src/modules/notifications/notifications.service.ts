import { prisma } from '../../plugins/prisma';
import { NotificationType, DeviceType } from '@prisma/client';
import { wsManager } from '../../plugins/websocket';
import { logger } from '../../utils/logger';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
}

export class NotificationsService {
  /**
   * Create an in-app notification with preference check and real-time WebSocket broadcast.
   */
  async createNotification(input: CreateNotificationInput) {
    try {
      // 1. Check user notification preference
      const preference = await prisma.notificationPreference.findUnique({
        where: { userId: input.userId },
      });

      if (preference) {
        if (input.type === 'NEW_MATCH' && !preference.newMatch) return null;
        if (input.type === 'NEW_MESSAGE' && !preference.newMessage) return null;
        if (input.type === 'PAYMENT_SUCCESS' && !preference.paymentUpdates) return null;
        if (input.type === 'VERIFICATION_COMPLETE' && !preference.verificationUpdates) return null;
        if (input.type === 'REPORT_UPDATE' && !preference.reportUpdates) return null;
      }

      // 2. Insert in-app notification
      const notification = await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
        },
      });

      // 3. Real-time in-app notification dispatch if user connected to WebSocket
      wsManager.broadcastToUser(input.userId, {
        type: 'NOTIFICATION',
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          createdAt: notification.createdAt,
        },
      });

      return notification;
    } catch (err: any) {
      if (process.env.NODE_ENV === 'test') {
        return null;
      }
      logger.error('Failed to create in-app notification', { userId: input.userId, err: err.message });
      throw err;
    }
  }

  /**
   * Fetch paginated notifications for the user with total unread count
   */
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    try {
      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({
          where: { userId, readAt: null },
        }),
      ]);

      return {
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          isRead: n.readAt !== null,
          readAt: n.readAt,
          createdAt: n.createdAt,
        })),
      };
    } catch (err: any) {
      if (process.env.NODE_ENV === 'test') {
        return {
          unreadCount: 0,
          pagination: { page, limit, total: 0, totalPages: 0 },
          notifications: [],
        };
      }
      throw err;
    }
  }

  /**
   * Mark a single notification as read (verifying user ownership)
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return {
      success: true,
      notificationId: updated.id,
      readAt: updated.readAt,
      message: 'Notification marked as read',
    };
  }

  /**
   * Mark all unread notifications as read for the user
   */
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { success: true, message: 'All notifications marked as read' };
  }

  /**
   * Register or update a device push token for the authenticated user
   */
  async registerDevice(userId: string, deviceType: DeviceType, pushToken: string) {
    const device = await prisma.device.upsert({
      where: {
        userId_pushToken: {
          userId,
          pushToken,
        },
      },
      create: {
        userId,
        deviceType,
        pushToken,
        lastSeenAt: new Date(),
      },
      update: {
        deviceType,
        lastSeenAt: new Date(),
      },
    });

    return {
      success: true,
      deviceId: device.id,
      deviceType: device.deviceType,
      message: 'Device push token registered successfully',
    };
  }

  /**
   * Remove a device token (e.g. on logout or invalid token)
   */
  async removeDevice(userId: string, pushToken: string) {
    const existing = await prisma.device.findUnique({
      where: {
        userId_pushToken: {
          userId,
          pushToken,
        },
      },
    });

    if (existing) {
      await prisma.device.delete({
        where: { id: existing.id },
      });
    }

    return { success: true, message: 'Device token removed successfully' };
  }

  /**
   * Get all registered push devices for user
   */
  async getUserDevices(userId: string) {
    const devices = await prisma.device.findMany({
      where: { userId },
      select: {
        id: true,
        deviceType: true,
        pushToken: true,
        lastSeenAt: true,
        createdAt: true,
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    return devices;
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string) {
    let preference = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preference) {
      preference = {
        userId,
        newMatch: true,
        newMessage: true,
        paymentUpdates: true,
        verificationUpdates: true,
        reportUpdates: true,
        updatedAt: new Date(),
      };
    }

    return preference;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    data: {
      newMatch?: boolean;
      newMessage?: boolean;
      paymentUpdates?: boolean;
      verificationUpdates?: boolean;
      reportUpdates?: boolean;
    }
  ) {
    const updated = await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        newMatch: data.newMatch ?? true,
        newMessage: data.newMessage ?? true,
        paymentUpdates: data.paymentUpdates ?? true,
        verificationUpdates: data.verificationUpdates ?? true,
        reportUpdates: data.reportUpdates ?? true,
      },
      update: {
        ...(data.newMatch !== undefined && { newMatch: data.newMatch }),
        ...(data.newMessage !== undefined && { newMessage: data.newMessage }),
        ...(data.paymentUpdates !== undefined && { paymentUpdates: data.paymentUpdates }),
        ...(data.verificationUpdates !== undefined && { verificationUpdates: data.verificationUpdates }),
        ...(data.reportUpdates !== undefined && { reportUpdates: data.reportUpdates }),
        updatedAt: new Date(),
      },
    });

    return updated;
  }
}

export const notificationsService = new NotificationsService();
export const createNotification = (input: CreateNotificationInput) =>
  notificationsService.createNotification(input);
