import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

export interface CheckoutCustomerDetails {
  patientName?: string;
  patientEmail?: string;
}

@Injectable()
export class StripeService {
  private stripe: InstanceType<typeof Stripe> | null;
  private readonly logger = new Logger(StripeService.name);

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      this.logger.warn('STRIPE_API_KEY not configured');
      this.stripe = null;
      return;
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2026-04-22.dahlia' as any,
    });
  }

  /**
   * Create a Stripe Checkout Session with idempotency
   */
  async createCheckoutSession(
    appointmentId: string,
    doctorId: string,
    patientIdentifier: string,
    amount: number,
    currency: string,
    idempotencyKey: string,
    customer?: CheckoutCustomerDetails,
  ): Promise<{ sessionId: string; sessionUrl: string }> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      this.logger.log(
        `Creating checkout session for appointment ${appointmentId} with idempotency key ${idempotencyKey}`,
      );

      const successUrl = `${process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/payment/success'}?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/booking/cancel'}?session_id={CHECKOUT_SESSION_ID}`;

      const patientEmail = customer?.patientEmail?.trim();
      const patientName = customer?.patientName?.trim();
      const isInr = currency.toLowerCase() === 'inr';

      const sessionParams: Record<string, unknown> = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: 'Veterinary Consultation',
                description: `Appointment ID: ${appointmentId}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          appointmentId,
          doctorId,
          patientIdentifier,
        },
        ...(patientEmail ? { customer_email: patientEmail } : {}),
        ...(isInr
          ? {
              billing_address_collection: 'required',
              name_collection: {
                individual: { enabled: true },
              },
            }
          : {}),
      };

      if (patientName) {
        const stripeCustomer = await this.stripe.customers.create({
          name: patientName,
          ...(patientEmail ? { email: patientEmail } : {}),
        });
        sessionParams.customer = stripeCustomer.id;
        delete (sessionParams as { customer_email?: string }).customer_email;
      }

      const session = await this.stripe.checkout.sessions.create(
        sessionParams as any,
        { idempotencyKey },
      );

      this.logger.log(
        `Checkout session created: ${session.id} for appointment ${appointmentId}`,
      );

      return {
        sessionId: session.id,
        sessionUrl: session.url!,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create checkout session for appointment ${appointmentId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Retrieve a Checkout Session from Stripe
   */
  async retrieveCheckoutSession(sessionId: string): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      this.logger.log(`Retrieving checkout session ${sessionId}`);

      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      this.logger.log(
        `Checkout session retrieved: ${sessionId}, payment_status: ${session.payment_status}`,
      );

      return session;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve checkout session ${sessionId}`,
        error,
      );
      throw error;
    }
  }
}
