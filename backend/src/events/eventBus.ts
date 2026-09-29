import { EventEmitter } from 'events';
import { notificationsService } from '../modules/notifications/notifications.service';
import { enqueuePushNotification } from '../jobs/queue';
import { logger } from '../utils/logger';

export type AppEvent =
  | {
      type: 'USER_VERIFIED';
      userId: string;
    }
  | {
      type: 'MATCH_CREATED';
      userAId: string;
      userBId: string;
      userAName?: string;
      userBName?: string;
      matchId: string;
    }
  | {
      type: 'PAYMENT_SUCCEEDED';
      userId: string;
      conversationId: string;
    }
  | {
      type: 'MESSAGE_CREATED';
      recipientUserId: string;
      senderUserId: string;
      senderFirstName?: string;
      conversationId: string;
    }
  | {
      type: 'REPORT_UPDATED';
      reporterId: string;
      reportId: string;
      status: string;
    }
  | {
      type: 'ACCOUNT_STATUS_CHANGED';
      userId: string;
      status: string;
      reason?: string;
    };

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  emitEvent(event: AppEvent) {
    this.emit(event.type, event);
  }

  private setupListeners() {
    // 1. Identity Verification Complete Event
    this.on('USER_VERIFIED', async (event: Extract<AppEvent, { type: 'USER_VERIFIED' }>) => {
      try {
        const title = 'Identity Verified';
        const body = 'Your identity verification is complete. Welcome to the dating pool!';

        await notificationsService.createNotification({
          userId: event.userId,
          type: 'VERIFICATION_COMPLETE',
          title,
          body,
        });

        await enqueuePushNotification({
          userId: event.userId,
          title,
          body,
        });
      } catch (err: any) {
        logger.error('Error handling USER_VERIFIED event', { userId: event.userId, err: err.message });
      }
    });

    // 2. Mutual Match Created Event (Notifies both users without leaking other matches)
    this.on('MATCH_CREATED', async (event: Extract<AppEvent, { type: 'MATCH_CREATED' }>) => {
      try {
        // Notification for User A
        const titleA = 'New Match!';
        const bodyA = event.userBName
          ? `You matched with ${event.userBName}! Start a conversation.`
          : 'You have a new mutual match! Start a conversation.';

        await notificationsService.createNotification({
          userId: event.userAId,
          type: 'NEW_MATCH',
          title: titleA,
          body: bodyA,
        });

        await enqueuePushNotification({
          userId: event.userAId,
          title: titleA,
          body: bodyA,
          data: { matchId: event.matchId },
        });

        // Notification for User B
        const titleB = 'New Match!';
        const bodyB = event.userAName
          ? `You matched with ${event.userAName}! Start a conversation.`
          : 'You have a new mutual match! Start a conversation.';

        await notificationsService.createNotification({
          userId: event.userBId,
          type: 'NEW_MATCH',
          title: titleB,
          body: bodyB,
        });

        await enqueuePushNotification({
          userId: event.userBId,
          title: titleB,
          body: bodyB,
          data: { matchId: event.matchId },
        });
      } catch (err: any) {
        logger.error('Error handling MATCH_CREATED event', { matchId: event.matchId, err: err.message });
      }
    });

    // 3. Payment Succeeded Event (Conversation Unlocked)
    this.on('PAYMENT_SUCCEEDED', async (event: Extract<AppEvent, { type: 'PAYMENT_SUCCEEDED' }>) => {
      try {
        const title = 'Chat Unlocked';
        const body = 'Your conversation is ready. You can now exchange unlimited messages!';

        await notificationsService.createNotification({
          userId: event.userId,
          type: 'PAYMENT_SUCCESS',
          title,
          body,
        });

        await enqueuePushNotification({
          userId: event.userId,
          title,
          body,
          data: { conversationId: event.conversationId },
        });
      } catch (err: any) {
        logger.error('Error handling PAYMENT_SUCCEEDED event', { userId: event.userId, err: err.message });
      }
    });

    // 4. New Message Event (Strict Privacy: NEVER expose message body in notification)
    this.on('MESSAGE_CREATED', async (event: Extract<AppEvent, { type: 'MESSAGE_CREATED' }>) => {
      try {
        const title = 'New Message';
        // Privacy rule: Only indicate a new message arrived, never expose the text content
        const body = event.senderFirstName
          ? `You have a new message from ${event.senderFirstName}.`
          : 'You have a new message.';

        await notificationsService.createNotification({
          userId: event.recipientUserId,
          type: 'NEW_MESSAGE',
          title,
          body,
        });

        await enqueuePushNotification({
          userId: event.recipientUserId,
          title,
          body,
          data: { conversationId: event.conversationId },
        });
      } catch (err: any) {
        logger.error('Error handling MESSAGE_CREATED event', { recipientUserId: event.recipientUserId, err: err.message });
      }
    });

    // 5. Report Updated Event
    this.on('REPORT_UPDATED', async (event: Extract<AppEvent, { type: 'REPORT_UPDATED' }>) => {
      try {
        const title = 'Safety Report Update';
        const body = `Your report status has been updated to ${event.status}.`;

        await notificationsService.createNotification({
          userId: event.reporterId,
          type: 'REPORT_UPDATE',
          title,
          body,
        });

        await enqueuePushNotification({
          userId: event.reporterId,
          title,
          body,
          data: { reportId: event.reportId },
        });
      } catch (err: any) {
        logger.error('Error handling REPORT_UPDATED event', { reporterId: event.reporterId, err: err.message });
      }
    });

    // 6. Account Status Changed Event
    this.on('ACCOUNT_STATUS_CHANGED', async (event: Extract<AppEvent, { type: 'ACCOUNT_STATUS_CHANGED' }>) => {
      try {
        const title = 'Account Notification';
        const body = event.reason
          ? `Your account status was updated to ${event.status}: ${event.reason}`
          : `Your account status was updated to ${event.status}.`;

        await notificationsService.createNotification({
          userId: event.userId,
          type: 'ACCOUNT_UPDATE',
          title,
          body,
        });

        await enqueuePushNotification({
          userId: event.userId,
          title,
          body,
        });
      } catch (err: any) {
        logger.error('Error handling ACCOUNT_STATUS_CHANGED event', { userId: event.userId, err: err.message });
      }
    });
  }
}

export const eventBus = new AppEventBus();
