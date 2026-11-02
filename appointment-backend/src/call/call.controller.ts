import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsEnum, IsOptional } from 'class-validator';
import { CallType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CallService } from './call.service';
import { XirsysService } from './xirsys.service';
import { GetUser } from '../auth/get-user.decorator';
import type { AuthUser } from '../auth/auth.types';

class StartCallDto {
  @IsOptional()
  @IsEnum(CallType)
  type?: CallType;
}

@UseGuards(JwtAuthGuard)
@Controller('call')
export class CallController {
  constructor(
    private readonly callService: CallService,
    private readonly xirsys: XirsysService,
  ) {}

  @Get('ice-servers')
  async iceServers(
    @GetUser() user: AuthUser,
    @Query('appointmentId') appointmentId?: string,
  ) {
    if (appointmentId) {
      await this.callService.assertCanJoin(appointmentId, user.sub);
    }
    const iceServers = await this.xirsys.getIceServers();
    return { iceServers };
  }

  @Post(':appointmentId/start')
  start(
    @Param('appointmentId') appointmentId: string,
    @GetUser() user: AuthUser,
    @Body() body: StartCallDto,
  ) {
    return this.callService.start(
      appointmentId,
      user.sub,
      body.type ?? CallType.VIDEO,
    );
  }

  @Post(':appointmentId/end')
  end(
    @Param('appointmentId') appointmentId: string,
    @GetUser() user: AuthUser,
  ) {
    return this.callService.end(appointmentId, user.sub);
  }
}
