import {
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Observable, map, merge, of, timer } from 'rxjs';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/auth.types';
import { NotificationService } from './notification.service';
import { NotificationSseService } from './notification-sse.service';
import {
  PushSubscribeDto,
  PushUnsubscribeDto,
} from './dto/push-subscribe.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly sseService: NotificationSseService,
  ) {}

  @Get()
  list(
    @GetUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.notificationService.list(
      user.sub,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Get('unread-count')
  async unreadCount(@GetUser() user: AuthUser) {
    const count = await this.notificationService.unreadCount(user.sub);
    return { count };
  }

  @Get('vapid-public-key')
  vapidPublicKey() {
    return this.notificationService.getVapidPublicKey();
  }

  @SkipThrottle()
  @Sse('stream')
  stream(@GetUser() user: AuthUser): Observable<MessageEvent> {
    const connected$ = of({
      type: 'connected',
      data: { ok: true, ts: Date.now() },
    } as MessageEvent);

    // Emit immediately, then every 25s so clients and proxies keep the stream alive.
    const heartbeat$ = timer(0, 25000).pipe(
      map(
        () =>
          ({
            type: 'heartbeat',
            data: { ts: Date.now() },
          }) as MessageEvent,
      ),
    );
    const notifications$ = this.sseService.stream(user.sub).pipe(
      map(
        (event) =>
          ({
            type: 'notification',
            data: event.data,
          }) as MessageEvent,
      ),
    );
    return merge(connected$, heartbeat$, notifications$);
  }

  @Patch(':id/read')
  markRead(@GetUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationService.markRead(user.sub, id);
  }

  @Post('read-all')
  markAllRead(@GetUser() user: AuthUser) {
    return this.notificationService.markAllRead(user.sub);
  }

  @Post('push-subscribe')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  pushSubscribe(@GetUser() user: AuthUser, @Body() body: PushSubscribeDto) {
    return this.notificationService.savePushSubscription(
      user.sub,
      body.endpoint,
      body.keys.p256dh,
      body.keys.auth,
      body.userAgent,
    );
  }

  @Delete('push-subscribe')
  pushUnsubscribe(
    @GetUser() user: AuthUser,
    @Body() body: PushUnsubscribeDto,
  ) {
    return this.notificationService.removePushSubscription(
      user.sub,
      body.endpoint,
    );
  }
}
