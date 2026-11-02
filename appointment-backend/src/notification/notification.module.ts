import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationSseService } from './notification-sse.service';
import { WebPushService } from './web-push.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSseService, WebPushService],
  exports: [NotificationService],
})
export class NotificationModule {}
