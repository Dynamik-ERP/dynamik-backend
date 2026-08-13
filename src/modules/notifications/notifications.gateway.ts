import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly connectedUsers = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.cookie?.match(/access_token=([^;]+)/)?.[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      client.data.userId = userId;
      client.data.role = payload.role;
      client.join(`user:${userId}`);
      client.join(`role:${payload.role}`);

      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)?.add(client.id);
      this.logger.log(`Socket connected: ${userId} (${payload.role})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (!userId) return;
    this.connectedUsers.get(userId)?.delete(client.id);
    if (this.connectedUsers.get(userId)?.size === 0) {
      this.connectedUsers.delete(userId);
    }
  }

  sendToUser(userId: string, event: string, data: unknown) {
    this.server?.to(`user:${userId}`).emit(event, data);
  }

  sendToRole(role: string, event: string, data: unknown) {
    this.server?.to(`role:${role}`).emit(event, data);
  }

  broadcastAll(event: string, data: unknown) {
    this.server?.emit(event, data);
  }
}
