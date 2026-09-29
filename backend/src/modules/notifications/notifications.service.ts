import { prisma } from '../../plugins/prisma';

export class NotificationsService {
  async getUserNotifications(userId: string, limit = 20) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, readAt: null },
    });

    return {
      unreadCount,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.readAt !== null,
        createdAt: n.createdAt,
      })),
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return { success: true, message: 'Notification marked as read' };
  }
}

export const notificationsService = new NotificationsService();
