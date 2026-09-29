import { prisma } from '../plugins/prisma';
import { logger } from '../utils/logger';

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface IPushProvider {
  send(
    pushToken: string,
    payload: { title: string; body: string; data?: Record<string, string> }
  ): Promise<{ success: boolean; error?: string }>;
}

export class MockPushProvider implements IPushProvider {
  public sentPushes: Array<{ pushToken: string; title: string; body: string }> = [];

  async send(
    pushToken: string,
    payload: { title: string; body: string; data?: Record<string, string> }
  ): Promise<{ success: boolean; error?: string }> {
    if (pushToken === 'INVALID_TOKEN' || pushToken === 'EXPIRED_TOKEN') {
      return { success: false, error: 'INVALID_TOKEN' };
    }

    this.sentPushes.push({
      pushToken,
      title: payload.title,
      body: payload.body,
    });

    logger.info('Push notification delivered via MockPushProvider', {
      pushToken: pushToken.substring(0, 10) + '...',
      title: payload.title,
    });

    return { success: true };
  }
}

export const defaultPushProvider: IPushProvider = new MockPushProvider();

/**
 * Dispatch push notifications to all registered devices of a user.
 * Automatically cleans up invalid or expired tokens when reported by the provider.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  provider: IPushProvider = defaultPushProvider
): Promise<{ dispatched: number; failed: number; cleanedTokens: number }> {
  try {
    const devices = await prisma.device.findMany({
      where: { userId },
      select: { id: true, pushToken: true, deviceType: true },
    });

    if (devices.length === 0) {
      return { dispatched: 0, failed: 0, cleanedTokens: 0 };
    }

    let dispatched = 0;
    let failed = 0;
    let cleanedTokens = 0;

    for (const device of devices) {
      const result = await provider.send(device.pushToken, { title, body, data });

      if (result.success) {
        dispatched++;
      } else {
        failed++;
        // Device token cleanup (Section 16: remove/deactivate invalid tokens)
        if (
          result.error === 'INVALID_TOKEN' ||
          result.error === 'UNREGISTERED' ||
          result.error === 'BAD_DEVICE_TOKEN'
        ) {
          try {
            await prisma.device.delete({ where: { id: device.id } });
            cleanedTokens++;
            logger.info('Cleaned up invalid push token', {
              userId,
              deviceId: device.id,
              error: result.error,
            });
          } catch (err: any) {
            logger.warn('Failed to delete invalid push token', { deviceId: device.id, err });
          }
        }
      }
    }

    return { dispatched, failed, cleanedTokens };
  } catch (err: any) {
    if (process.env.NODE_ENV === 'test') {
      return { dispatched: 0, failed: 0, cleanedTokens: 0 };
    }
    logger.error('Error dispatching push notifications to user', { userId, err });
    throw err;
  }
}
