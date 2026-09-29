import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import jwt from 'jsonwebtoken';

import { env } from './config/env';
import { APP_CONSTANTS } from './config/constants';
import { errorHandler } from './middleware/errorHandler';
import { jwtPlugin } from './plugins/jwt';
import { wsManager } from './plugins/websocket';

// Module Route Imports
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { profileRoutes } from './modules/profiles/profile.routes';
import { photoRoutes } from './modules/photos/photo.routes';
import { verificationRoutes } from './modules/verification/verification.routes';
import { discoveryRoutes } from './modules/discovery/discovery.routes';
import { likesRoutes } from './modules/likes/likes.routes';
import { matchesRoutes } from './modules/matches/matches.routes';
import { conversationsRoutes } from './modules/conversations/conversations.routes';
import { messagesRoutes } from './modules/messages/messages.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';
import { blocksRoutes } from './modules/blocks/blocks.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { adminRoutes } from './modules/admin/admin.routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: false, // Structured JSON logger used via utils/logger
  });

  // Security Plugins
  await app.register(helmet, {
    contentSecurityPolicy: false, // Configured for API mode
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true,
  });

  // Global Rate Limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: 60 * 1000, // 1 minute
  });

  // JWT & WebSocket Support
  await app.register(jwtPlugin);
  await app.register(fastifyWebsocket);

  // Centralized Error Handler
  app.setErrorHandler(errorHandler);

  // Health Check Endpoint
  app.get('/health', async () => ({
    status: 'UP',
    platform: 'Ethiopian Dating API',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }));

  // Real-time Chat WebSocket Gateway
  app.get('/api/v1/ws', { websocket: true }, (socket, request) => {
    const token = (request.query as { token?: string })?.token;
    if (!token) {
      socket.close(4001, 'Unauthorized: Missing token query parameter');
      return;
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
      wsManager.register(payload.userId, socket as any);

      socket.on('message', (messageBuffer) => {
        try {
          const parsed = JSON.parse(messageBuffer.toString());
          if (parsed.type === 'PING') {
            socket.send(JSON.stringify({ type: 'PONG' }));
          }
        } catch {
          // Ignore invalid message format
        }
      });

      socket.send(
        JSON.stringify({
          type: 'CONNECTED',
          userId: payload.userId,
          message: 'Connected to real-time chat stream',
        })
      );
    } catch {
      socket.close(4001, 'Unauthorized: Invalid token');
    }
  });

  // Register API v1 Module Routes
  const prefix = APP_CONSTANTS.API_PREFIX;

  await app.register(authRoutes, { prefix: `${prefix}/auth` });
  await app.register(usersRoutes, { prefix: `${prefix}/users` });
  await app.register(profileRoutes, { prefix: `${prefix}/profile` });
  await app.register(profileRoutes, { prefix: `${prefix}/profiles` });
  await app.register(photoRoutes, { prefix: `${prefix}/photos` });
  await app.register(verificationRoutes, { prefix: `${prefix}/verification` });
  await app.register(discoveryRoutes, { prefix: `${prefix}/discovery` });
  await app.register(likesRoutes, { prefix: `${prefix}/likes` });
  await app.register(matchesRoutes, { prefix: `${prefix}/matches` });
  await app.register(conversationsRoutes, { prefix: `${prefix}/conversations` });
  await app.register(messagesRoutes, { prefix: `${prefix}/conversations` });
  await app.register(paymentsRoutes, { prefix: `${prefix}/payments` });
  await app.register(blocksRoutes, { prefix: `${prefix}/blocks` });
  await app.register(reportsRoutes, { prefix: `${prefix}/reports` });
  await app.register(notificationsRoutes, { prefix: `${prefix}/notifications` });
  await app.register(adminRoutes, { prefix: `${prefix}/admin` });

  return app;
}
