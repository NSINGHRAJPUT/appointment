import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { CommonModule } from '../common/common.module';
import { OtpModule } from '../otp/otp.module';
import { EmailModule } from '../email/email.module';
import { getJwtSecret } from '../common/config';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_EXPIRY ??
          process.env.JWT_EXPIRES_IN ??
          '7d') as never,
      },
    }),
    CommonModule,
    OtpModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
