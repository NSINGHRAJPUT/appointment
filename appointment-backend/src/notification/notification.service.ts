import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationSseService } from './notification-sse.service';
import { WebPushService } from './web-push.service';

export type CreateNotificationInput = {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string;
  meta?: Prisma.InputJsonValue;
};

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sse: NotificationSseService,
    private readonly webPush: WebPushService,
  ) {}

  async createForUsers(input: CreateNotificationInput) {
    const uniqueIds = [...new Set(input.userIds.filter(Boolean))];
    if (uniqueIds.length === 0) return [];

    const created = await Promise.all(
      uniqueIds.map((userId) =>
        this.prisma.notification.create({
          data: {
            userId,
            type: input.type,
            title: input.title,
            body: input.body,
            linkUrl: input.linkUrl,
            meta: input.meta ?? undefined,
          },
        }),
      ),
    );

    for (const notification of created) {
      this.sse.emit(notification.userId, notification);
      void this.webPush
        .sendToUser(notification.userId, notification)
        .catch(() => undefined);
    }

    return created;
  }

  async list(userId: string, page = 1, pageSize = 20) {
    const take = Math.min(Math.max(pageSize, 1), 50);
    const skip = (Math.max(page, 1) - 1) * take;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return { items, total, page, pageSize: take, unreadCount };
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) {
      throw new ForbiddenException('Not your notification');
    }
    if (notification.readAt) return notification;

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  async savePushSubscription(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
    userAgent?: string,
  ) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth, userAgent },
      update: { userId, p256dh, auth, userAgent },
    });
  }

  async removePushSubscription(userId: string, endpoint: string) {
    const existing = await this.prisma.pushSubscription.findUnique({
      where: { endpoint },
    });
    if (!existing) return { deleted: false };
    if (existing.userId !== userId) {
      throw new ForbiddenException('Not your subscription');
    }
    await this.prisma.pushSubscription.delete({ where: { endpoint } });
    return { deleted: true };
  }

  getVapidPublicKey() {
    return { publicKey: this.webPush.getPublicKey() };
  }
}
