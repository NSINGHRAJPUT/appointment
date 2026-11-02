import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import type { AuthUser } from '../auth/auth.types';
import { getCorsOrigins, getJwtSecret } from '../common/config';

@WebSocketGateway({ cors: { origin: getCorsOrigins(), credentials: true } })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly chatService: ChatService,
  ) {}

  afterInit(): void {}

  handleConnection(client: Socket): void {
    const token = client.handshake.auth?.token ?? client.handshake.headers.authorization?.toString().replace('Bearer ', '');
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwt.verify<AuthUser>(token, { secret: getJwtSecret() });
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('conversation:join')
  async join(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    const senderId = (client.data.user as AuthUser | undefined)?.sub;
    if (!senderId) {
      client.disconnect();
      return;
    }
    try {
      await this.chatService.assertCanAccessConversation(body.conversationId, senderId);
      client.join(body.conversationId);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('conversation:message')
  async message(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string; text: string },
  ) {
    const senderId = (client.data.user as AuthUser | undefined)?.sub;
    if (!senderId || !body.text?.trim()) {
      return;
    }
    try {
      const msg = await this.chatService.sendMessage(body.conversationId, senderId, body.text.trim());
      this.server.to(body.conversationId).emit('conversation:message', msg);
      return msg;
    } catch {
      // Keep realtime handler resilient; REST endpoints will surface errors if needed.
      return;
    }
  }
}
