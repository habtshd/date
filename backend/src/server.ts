import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { chatGateway } from './realtime/chatGateway';
import { prisma } from './database/prisma';

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Realtime WebSocket Gateway
  chatGateway.initialize(server);

  server.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🇪🇹 Ethiopian Dating API Server is running`);
    console.log(`🌐 Environment: ${config.env}`);
    console.log(`🚀 HTTP Server: http://localhost:${config.port}`);
    console.log(`⚡ WebSocket:  ws://localhost:${config.port}/ws`);
    console.log(`📖 API Base:    http://localhost:${config.port}${config.apiPrefix}`);
    console.log(`====================================================`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Database disconnected. Process exiting.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
