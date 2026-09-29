import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { standardApiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import { authRouter } from './modules/auth/auth.routes';
import { verificationRouter } from './modules/verification/verification.routes';
import { profilesRouter } from './modules/profiles/profiles.routes';
import { discoveryRouter } from './modules/discovery/discovery.routes';
import { likesRouter } from './modules/likes/likes.routes';
import { matchesRouter } from './modules/matches/matches.routes';
import { conversationsRouter } from './modules/conversations/conversations.routes';
import { messagesRouter } from './modules/messages/messages.routes';
import { paymentsRouter } from './modules/payments/payments.routes';
import { blocksRouter } from './modules/blocks/blocks.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { adminRouter } from './modules/admin/admin.routes';

export function createApp(): Application {
  const app = express();

  // Security and utilities middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate Limiting
  app.use('/api/', standardApiLimiter);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'UP',
      platform: 'Ethiopian Dating API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Modules
  const api = config.apiPrefix;
  app.use(`${api}/auth`, authRouter);
  app.use(`${api}/verification`, verificationRouter);
  app.use(`${api}/profiles`, profilesRouter);
  app.use(`${api}/discovery`, discoveryRouter);
  app.use(`${api}/likes`, likesRouter);
  app.use(`${api}/matches`, matchesRouter);
  app.use(`${api}/conversations`, conversationsRouter);
  app.use(`${api}/messages`, messagesRouter);
  app.use(`${api}/payments`, paymentsRouter);
  app.use(`${api}/blocks`, blocksRouter);
  app.use(`${api}/reports`, reportsRouter);
  app.use(`${api}/admin`, adminRouter);

  // 404 Fallback
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
