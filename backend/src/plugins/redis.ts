import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.warn('Redis unavailable, running with memory cache fallback');
      return null; // Stop reconnecting after 3 attempts
    }
    return Math.min(times * 100, 2000);
  },
});

redis.on('error', (err) => {
  logger.warn('Redis connection issue:', { error: err.message });
});

redis.on('connect', () => {
  logger.info('Connected to Redis server');
});
