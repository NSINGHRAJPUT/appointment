import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentStateIndicator } from './PaymentStateIndicator';

describe('PaymentStateIndicator', () => {
  describe('creating-appointment state', () => {
    it('should display creating appointment message', () => {
      render(<PaymentStateIndicator state="creating-appointment" />);

      expect(screen.getByText('Creating Appointment...')).toBeInTheDocument();
      expect(
        screen.getByText('Please wait while we create your appointment.')
      ).toBeInTheDocument();
    });

    it('should show loading animation', () => {
      const { container } = render(<PaymentStateIndicator state="creating-appointment" />);

      const icon = container.querySelector('.animate-spin');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('redirecting-to-payment state', () => {
    it('should display redirecting message', () => {
      render(<PaymentStateIndicator state="redirecting-to-payment" />);

      expect(screen.getByText('Redirecting to Payment...')).toBeInTheDocument();
      expect(
        screen.getByText(
          'You will be redirected to Stripe Checkout to complete payment.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('verifying-payment state', () => {
    it('should display verifying message', () => {
      render(<PaymentStateIndicator state="verifying-payment" />);

      expect(screen.getByText('Verifying Payment...')).toBeInTheDocument();
      expect(
        screen.getByText('Please wait while we verify your payment.')
      ).toBeInTheDocument();
    });
  });

  describe('booking-confirmed state', () => {
    it('should display confirmation message', () => {
      render(<PaymentStateIndicator state="booking-confirmed" />);

      expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Your appointment has been successfully booked and confirmed.'
        )
      ).toBeInTheDocument();
    });

    it('should not show action buttons', () => {
      render(<PaymentStateIndicator state="booking-confirmed" />);

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
      expect(screen.queryByText('Retry Payment')).not.toBeInTheDocument();
    });
  });

  describe('booking-failed state', () => {
    it('should display failure message', () => {
      render(<PaymentStateIndicator state="booking-failed" />);

      expect(screen.getByText('Booking Failed')).toBeInTheDocument();
      expect(
        screen.getByText('Something went wrong while processing your booking.')
      ).toBeInTheDocument();
    });

    it('should display error message when provided', () => {
      const errorMessage = 'Slot is no longer available';
      render(
        <PaymentStateIndicator state="booking-failed" errorMessage={errorMessage} />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show retry and rebook buttons', () => {
      const onRetry = vi.fn();
      const onRebook = vi.fn();

      render(
        <PaymentStateIndicator
          state="booking-failed"
          onRetry={onRetry}
          onRebook={onRebook}
        />
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Rebook')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();

      render(
        <PaymentStateIndicator state="booking-failed" onRetry={onRetry} />
      );

      fireEvent.click(screen.getByText('Try Again'));
      expect(onRetry).toHaveBeenCalled();
    });

    it('should call onRebook when rebook button is clicked', () => {
      const onRebook = vi.fn();

      render(
        <PaymentStateIndicator state="booking-failed" onRebook={onRebook} />
      );

      fireEvent.click(screen.getByText('Rebook'));
      expect(onRebook).toHaveBeenCalled();
    });
  });

  describe('payment-cancelled state', () => {
    it('should display cancellation message', () => {
      render(<PaymentStateIndicator state="payment-cancelled" />);

      expect(screen.getByText('Payment Cancelled')).toBeInTheDocument();
      expect(
        screen.getByText('You cancelled the payment process.')
      ).toBeInTheDocument();
    });

    it('should show retry payment and back to booking buttons', () => {
      const onRetry = vi.fn();
      const onRebook = vi.fn();

      render(
        <PaymentStateIndicator
          state="payment-cancelled"
          onRetry={onRetry}
          onRebook={onRebook}
        />
      );

      expect(screen.getByText('Retry Payment')).toBeInTheDocument();
      expect(screen.getByText('Back to Booking')).toBeInTheDocument();
    });
  });

  describe('appointment ID display', () => {
    it('should display appointment ID when provided', () => {
      render(
        <PaymentStateIndicator
          state="booking-confirmed"
          appointmentId="apt_123456"
        />
      );

      expect(screen.getByText('apt_123456')).toBeInTheDocument();
    });

    it('should not display appointment ID when not provided', () => {
      const { container } = render(
        <PaymentStateIndicator state="booking-confirmed" />
      );

      expect(container.textContent).not.toContain('Appointment ID');
    });
  });
});
