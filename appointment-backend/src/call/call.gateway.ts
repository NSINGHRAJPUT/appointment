import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from '../auth/auth.types';
import { CallService } from './call.service';
import { Server, Socket } from 'socket.io';
import { getCorsOrigins, getJwtSecret } from '../common/config';

@WebSocketGateway({
  namespace: '/call',
  cors: { origin: getCorsOrigins(), credentials: true },
})
export class CallGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly callService: CallService,
  ) {}

  handleConnection(client: Socket): void {
    const token =
      client.handshake.auth?.token ??
      client.handshake.headers.authorization
        ?.toString()
        .replace('Bearer ', '');
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwt.verify<AuthUser>(token, {
        secret: getJwtSecret(),
      });
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('call:join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const user = client.data.user as AuthUser | undefined;
    if (!user?.sub) return client.disconnect();
    try {
      await this.callService.assertCanJoin(body.roomId, user.sub);
      client.join(body.roomId);
      client.data.roomId = body.roomId;
      client
        .to(body.roomId)
        .emit('peer:joined', { userId: user.sub, role: user.role });
      const sockets = await this.server.in(body.roomId).fetchSockets();
      const peers = sockets
        .filter((s) => s.id !== client.id)
        .map((s) => ({
          userId: (s.data.user as AuthUser | undefined)?.sub,
          role: (s.data.user as AuthUser | undefined)?.role,
        }))
        .filter((p) => p.userId);
      if (peers.length > 0) {
        client.emit('peer:joined', peers[0]);
      }
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('call:signal')
  signal(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string; payload: unknown },
  ) {
    const userId = (client.data.user as AuthUser | undefined)?.sub;
    if (!userId) return;
    if (!client.rooms.has(body.roomId)) return;
    client.to(body.roomId).emit('call:signal', body.payload);
  }

  @SubscribeMessage('call:hangup')
  hangup(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const user = client.data.user as AuthUser | undefined;
    if (!user?.sub) return;
    if (!client.rooms.has(body.roomId)) return;
    client.to(body.roomId).emit('call:hangup', { userId: user.sub });
    client.leave(body.roomId);
    client.data.roomId = undefined;
  }

  handleDisconnect(client: Socket): void {
    const roomId = client.data.roomId as string | undefined;
    const user = client.data.user as AuthUser | undefined;
    if (roomId && user?.sub) {
      client.to(roomId).emit('call:hangup', { userId: user.sub });
    }
  }
}
