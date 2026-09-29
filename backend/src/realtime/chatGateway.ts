import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
}

export class ChatGateway {
  private wss: WebSocketServer | null = null;
  private userSockets: Map<string, Set<ExtWebSocket>> = new Map();

  /**
   * Attach WebSocket server to Node HTTP server
   */
  initialize(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: ExtWebSocket, req) => {
      const parsedUrl = url.parse(req.url || '', true);
      const token = (parsedUrl.query.token as string) || '';

      if (!token) {
        ws.close(4001, 'Authentication token required');
        return;
      }

      try {
        const payload = jwt.verify(token, config.jwt.accessSecret) as { userId: string };
        ws.userId = payload.userId;
        ws.isAlive = true;

        // Register user socket
        if (!this.userSockets.has(ws.userId)) {
          this.userSockets.set(ws.userId, new Set());
        }
        this.userSockets.get(ws.userId)!.add(ws);

        ws.on('pong', () => {
          ws.isAlive = true;
        });

        ws.on('close', () => {
          if (ws.userId && this.userSockets.has(ws.userId)) {
            const sockets = this.userSockets.get(ws.userId)!;
            sockets.delete(ws);
            if (sockets.size === 0) {
              this.userSockets.delete(ws.userId);
            }
          }
        });

        ws.send(JSON.stringify({ type: 'CONNECTED', userId: ws.userId }));
      } catch {
        ws.close(4002, 'Invalid or expired authentication token');
      }
    });

    // Heartbeat liveness check every 30s
    setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((client) => {
        const extWs = client as ExtWebSocket;
        if (!extWs.isAlive) {
          return extWs.terminate();
        }
        extWs.isAlive = false;
        extWs.ping();
      });
    }, 30000);
  }

  /**
   * Broadcast message to all active sockets of a target user
   */
  broadcastToUser(userId: string, data: Record<string, unknown>): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    const payload = JSON.stringify(data);
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }
}

export const chatGateway = new ChatGateway();
