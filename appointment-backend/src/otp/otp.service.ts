import {
  BadRequestException,
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { OtpStatus, OtpType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const OTP_TTL_MINS = 10;
const MAX_PENDING_PER_TARGET = 5;

export type OtpDeliveryContext = 'booking' | 'login' | 'password_reset';

export interface GenerateOtpOptions {
  alsoNotifyEmail?: string;
  context?: OtpDeliveryContext;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private get staticOtpEnabled(): boolean {
    return process.env.USE_STATIC_OTP !== 'false';
  }

  private get staticOtpCode(): string {
    return process.env.STATIC_OTP_CODE || '000000';
  }

  private generateCode(): string {
    if (this.staticOtpEnabled) {
      return this.staticOtpCode;
    }
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async generate(
    target: string,
    type: OtpType,
    options: GenerateOtpOptions = {},
  ): Promise<string> {
    const since = new Date(Date.now() - OTP_TTL_MINS * 60 * 1000);
    const recentCount = await this.prisma.otpVerification.count({
      where: {
        target,
        type,
        status: OtpStatus.PENDING,
        createdAt: { gte: since },
      },
    });
    if (recentCount >= MAX_PENDING_PER_TARGET) {
      throw new HttpException(
        'Too many OTP requests. Please wait before retrying.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.prisma.otpVerification.updateMany({
      where: { target, type, status: OtpStatus.PENDING },
      data: { status: OtpStatus.EXPIRED },
    });

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINS * 60 * 1000);

    await this.prisma.otpVerification.create({
      data: { target, code, type, expiresAt },
    });

    await this.deliverOtp(target, type, code, expiresAt, options.context ?? 'booking');

    if (options.alsoNotifyEmail?.trim()) {
      await this.emailService.sendBookingOtp(
        options.alsoNotifyEmail.trim(),
        code,
        expiresAt,
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[OTP] ${type} → ${target}: ${code}`);
    }

    return code;
  }

  private async deliverOtp(
    target: string,
    type: OtpType,
    code: string,
    expiresAt: Date,
    context: OtpDeliveryContext,
  ): Promise<void> {
    if (type === OtpType.EMAIL) {
      if (context === 'password_reset') {
        await this.emailService.sendPasswordReset(target, code, expiresAt);
        return;
      }
      if (context === 'login') {
        await this.emailService.sendOtpLogin(target, code, expiresAt);
        return;
      }
      await this.emailService.sendBookingOtp(target, code, expiresAt);
      return;
    }

    if (this.staticOtpEnabled) {
      this.logger.log(
        `[OTP] PHONE → ${target}: ${code} (static mode — SMS provider not configured)`,
      );
      return;
    }

    // TODO: integrate SMS provider (e.g. Twilio) when purchased
    this.logger.log(`[OTP] PHONE → ${target}: ${code}`);
  }

  async verify(target: string, code: string, type: OtpType): Promise<void> {
    const otp = await this.prisma.otpVerification.findFirst({
      where: { target, type, status: OtpStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('No pending OTP found');
    if (new Date() > otp.expiresAt) {
      await this.prisma.otpVerification.update({
        where: { id: otp.id },
        data: { status: OtpStatus.EXPIRED },
      });
      throw new BadRequestException('OTP has expired');
    }
    if (otp.code !== code) throw new BadRequestException('Invalid OTP');

    await this.prisma.otpVerification.update({
      where: { id: otp.id },
      data: { status: OtpStatus.VERIFIED },
    });
  }
}
