import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { StripeService } from './stripe.service';

@Module({
  imports: [PrismaModule, EmailModule, NotificationModule],
  providers: [PaymentService, StripeService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
