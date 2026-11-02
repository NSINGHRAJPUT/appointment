import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/auth.types';
import { ReviewService } from './review.service';

@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  create(@GetUser() user: AuthUser, @Body() body: { appointmentId: string; rating: number; comment?: string }) {
    return this.reviewService.create({ ...body, authorId: user.sub });
  }
}
