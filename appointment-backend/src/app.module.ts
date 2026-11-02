import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AppointmentModule } from './appointment/appointment.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { CallModule } from './call/call.module';
import { ChatModule } from './chat/chat.module';
import { CommonModule } from './common/common.module';
import { DoctorModule } from './doctor/doctor.module';
import { OtpModule } from './otp/otp.module';
import { PatientModule } from './patient/patient.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReviewModule } from './review/review.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { PaymentModule } from './payment/payment.module';
import { EmailModule } from './email/email.module';
import { MulterErrorMiddleware } from './common/multer-error.middleware';
import { BlogModule } from './blog/blog.module';
import { StaticPageModule } from './static-page/static-page.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL ?? 60) * 1000,
        limit: Number(process.env.RATE_LIMIT_LIMIT ?? 100),
      },
    ]),
    PrismaModule,
    CommonModule,
    AuthModule,
    DoctorModule,
    PatientModule,
    AppointmentModule,
    AvailabilityModule,
    ChatModule,
    CallModule,
    ReviewModule,
    AdminModule,
    OtpModule,
    SchedulerModule,
    PaymentModule,
    EmailModule,
    BlogModule,
    StaticPageModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MulterErrorMiddleware).forRoutes('*');
  }
}
