import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './plugins/prisma';
import { redis } from './plugins/redis';

async function bootstrap() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });

    console.log(`====================================================`);
    console.log(`🇪🇹 Ethiopian Dating Platform Backend (Fastify)`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
    console.log(`🚀 API Base:    http://localhost:${env.PORT}/api/v1`);
    console.log(`⚡ WebSocket:   ws://localhost:${env.PORT}/api/v1/ws`);
    console.log(`🩺 Health:      http://localhost:${env.PORT}/health`);
    console.log(`====================================================`);
  } catch (err: any) {
    logger.error('Failed to start server:', { error: err.message, stack: err.stack });
    process.exit(1);
  }

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    try {
      await app.close();
      await prisma.$disconnect();
      await redis.quit();
    } catch {
      // Ignore disconnect errors during process termination
    }
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
