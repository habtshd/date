import { WebSocket } from 'ws';

interface ConnectedClient {
  userId: string;
  ws: WebSocket;
  isAlive: boolean;
}

export class WebSocketManager {
  private clients: Map<string, Set<ConnectedClient>> = new Map();

  register(userId: string, ws: WebSocket): ConnectedClient {
    const client: ConnectedClient = { userId, ws, isAlive: true };

    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(client);

    ws.on('pong', () => {
      client.isAlive = true;
    });

    ws.on('close', () => {
      const userSockets = this.clients.get(userId);
      if (userSockets) {
        userSockets.delete(client);
        if (userSockets.size === 0) {
          this.clients.delete(userId);
        }
      }
    });

    return client;
  }

  broadcastToUser(userId: string, payload: Record<string, unknown>): void {
    const userSockets = this.clients.get(userId);
    if (!userSockets) return;

    const data = JSON.stringify(payload);
    userSockets.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  pingClients(): void {
    this.clients.forEach((userSockets) => {
      userSockets.forEach((client) => {
        if (!client.isAlive) {
          client.ws.terminate();
          userSockets.delete(client);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    });
  }
}

export const wsManager = new WebSocketManager();
