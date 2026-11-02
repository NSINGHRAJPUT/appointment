import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentService } from './payment.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { VerifySessionDto } from './dto/verify-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { PaymentStatus } from '@prisma/client';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private paymentService: PaymentService) {}

  /**
   * POST /payments/create-session
   * Create a Stripe Checkout Session
   */
  @Post('create-session')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    this.logger.log(
      `Creating checkout session for appointment ${dto.appointmentId}`,
    );
    return this.paymentService.createCheckoutSession(dto);
  }

  /**
   * POST /payments/verify-session
   * Verify Stripe Checkout Session and confirm appointment
   */
  @Post('verify-session')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async verifySession(@Body() dto: VerifySessionDto) {
    this.logger.log(`Verifying session ${dto.sessionId}`);
    return this.paymentService.verifySession(dto);
  }

  /**
   * GET /payments/:appointmentId
   * Get payment details for an appointment
   */
  @Get(':appointmentId')
  @UseGuards(JwtAuthGuard)
  async getPayment(
    @Param('appointmentId') appointmentId: string,
    @GetUser() user: AuthUser,
  ) {
    this.logger.log(`Getting payment for appointment ${appointmentId}`);
    const allowed = await this.paymentService.canAccessPayment(
      appointmentId,
      user.sub,
      user.role,
    );
    if (!allowed) {
      throw new ForbiddenException('Not allowed to view this payment');
    }
    return this.paymentService.getPayment(appointmentId);
  }

  /**
   * GET /admin/payments
   * List all payments (admin only)
   */
  @Get('admin/payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listPayments(
    @Query('status') status?: PaymentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.log('Listing payments');
    return this.paymentService.listPayments({
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}
