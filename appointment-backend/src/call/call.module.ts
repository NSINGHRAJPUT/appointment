import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CallController } from './call.controller';
import { CallGateway } from './call.gateway';
import { CallService } from './call.service';
import { XirsysService } from './xirsys.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [JwtModule, NotificationModule],
  controllers: [CallController],
  providers: [CallService, CallGateway, XirsysService],
})
export class CallModule {}
