import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/auth.types';
import { ChatService } from './chat.service';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  conversations(@GetUser() user: AuthUser) {
    return this.chatService.listConversations(user.sub);
  }

  @Get(':conversationId/messages')
  list(@Param('conversationId') conversationId: string, @GetUser() user: AuthUser) {
    return this.chatService.listMessages(conversationId, user.sub);
  }

  @Post(':conversationId/messages')
  send(
    @Param('conversationId') conversationId: string,
    @GetUser() user: AuthUser,
    @Body() body: SendMessageDto,
  ) {
    return this.chatService.sendMessage(conversationId, user.sub, body.body);
  }
}
