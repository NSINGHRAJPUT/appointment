'use client';

import { Check, CreditCard, Loader2, AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/button';

export type PaymentState =
  | 'creating-appointment'
  | 'redirecting-to-payment'
  | 'verifying-payment'
  | 'booking-confirmed'
  | 'booking-failed'
  | 'payment-cancelled';

interface PaymentStateIndicatorProps {
  state: PaymentState;
  errorMessage?: string;
  appointmentId?: string;
  onRetry?: () => void;
  onRebook?: () => void;
}

const stateConfig: Record<
  PaymentState,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    loading?: boolean;
  }
> = {
  'creating-appointment': {
    icon: <Loader2 className="animate-spin" size={28} />,
    title: 'Creating appointment…',
    description: 'Please wait while we reserve your slot.',
    loading: true,
  },
  'redirecting-to-payment': {
    icon: <CreditCard size={28} />,
    title: 'Redirecting to payment…',
    description: 'You will be sent to Stripe Checkout to complete payment.',
    loading: true,
  },
  'verifying-payment': {
    icon: <Loader2 className="animate-spin" size={28} />,
    title: 'Verifying payment…',
    description: 'Confirming your payment with the provider.',
    loading: true,
  },
  'booking-confirmed': {
    icon: <Check size={28} strokeWidth={2.5} />,
    title: 'Booking confirmed',
    description: 'Your appointment has been successfully booked.',
  },
  'booking-failed': {
    icon: <X size={28} />,
    title: 'Booking failed',
    description: 'Something went wrong while processing your booking.',
  },
  'payment-cancelled': {
    icon: <AlertTriangle size={28} />,
    title: 'Payment cancelled',
    description: 'You cancelled the payment process.',
  },
};

export function PaymentStateIndicator({
  state,
  errorMessage,
  appointmentId,
  onRetry,
  onRebook,
}: PaymentStateIndicatorProps) {
  const config = stateConfig[state];

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
            state === 'booking-failed' || state === 'payment-cancelled'
              ? 'bg-error-container text-error'
              : 'bg-primary-container text-primary'
          }`}
        >
          {config.icon}
        </div>
        <h2 className="font-display text-xl font-semibold text-on-surface mb-2">
          {config.title}
        </h2>
        <p className="text-sm text-on-surface-variant mb-5">{config.description}</p>

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-error/25 bg-error-container/50 p-3 text-left text-sm text-on-error-container">
            {errorMessage}
          </div>
        )}

        {appointmentId && (
          <div className="mb-5 rounded-xl border border-outline-variant bg-surface-container-low p-3 text-left text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-on-surface-variant">Appointment ID</span>
              <span className="font-mono text-on-surface break-all">
                {appointmentId}
              </span>
            </div>
          </div>
        )}

        {(state === 'booking-failed' || state === 'payment-cancelled') && (
          <div className="flex flex-col gap-2">
            {onRetry && (
              <Button onClick={onRetry} className="w-full">
                {state === 'payment-cancelled' ? 'Retry payment' : 'Try again'}
              </Button>
            )}
            {onRebook && (
              <Button variant="secondary" onClick={onRebook} className="w-full">
                Back to booking
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
