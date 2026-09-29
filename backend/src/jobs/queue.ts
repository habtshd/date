import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { sendPushToUser, PushNotificationPayload } from './push.service';

export interface PushJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface CleanupJobData {
  type: 'EXPIRED_SESSIONS' | 'EXPIRED_OTPS';
}

let notificationQueue: Queue | null = null;
let notificationWorker: Worker | null = null;

// Parse Redis connection URL
function getRedisConnection() {
  try {
    const url = new URL(env.REDIS_URL || 'redis://localhost:6379');
    return {
      host: url.hostname || 'localhost',
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    };
  }
}

/**
 * Initialize BullMQ queue if Redis is accessible, or use resilient fallback
 */
export function getNotificationQueue(): Queue | null {
  if (process.env.NODE_ENV === 'test') {
    return null; // In-memory direct dispatch for deterministic unit/integration testing
  }

  if (!notificationQueue) {
    try {
      notificationQueue = new Queue('notifications', {
        connection: getRedisConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      notificationQueue.on('error', (err) => {
        logger.warn('Notification queue Redis connection error, will use direct dispatch', { err: err.message });
      });
    } catch (err: any) {
      logger.warn('Could not initialize BullMQ queue, falling back to direct execution', { err: err.message });
      notificationQueue = null;
    }
  }

  return notificationQueue;
}

/**
 * Enqueue a push notification job into the background queue.
 * Falls back to immediate asynchronous dispatch if queue is offline.
 */
export async function enqueuePushNotification(data: PushJobData): Promise<void> {
  const queue = getNotificationQueue();

  if (queue) {
    try {
      await queue.add('push', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
      return;
    } catch (err: any) {
      logger.warn('Failed to enqueue job in BullMQ, falling back to immediate dispatch', { err: err.message });
    }
  }

  // Resilient fallback: dispatch in background asynchronously without blocking HTTP request
  setImmediate(async () => {
    try {
      await sendPushToUser(data.userId, data.title, data.body, data.data);
    } catch (err: any) {
      logger.error('Background push dispatch failed', { userId: data.userId, err: err.message });
    }
  });
}

/**
 * Start BullMQ worker process if running in worker mode
 */
export function startNotificationWorker(): Worker | null {
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  if (!notificationWorker) {
    try {
      notificationWorker = new Worker(
        'notifications',
        async (job: Job) => {
          switch (job.name) {
            case 'push': {
              const data = job.data as PushJobData;
              await sendPushToUser(data.userId, data.title, data.body, data.data);
              break;
            }
            default:
              logger.warn(`Unknown job name: ${job.name}`);
          }
        },
        {
          connection: getRedisConnection(),
          concurrency: 5,
        }
      );

      notificationWorker.on('failed', (job, err) => {
        logger.error(`Job ${job?.id} failed with error: ${err.message}`);
      });
    } catch (err: any) {
      logger.warn('Could not start BullMQ worker', { err: err.message });
      notificationWorker = null;
    }
  }

  return notificationWorker;
}
