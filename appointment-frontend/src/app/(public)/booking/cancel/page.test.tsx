import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import PaymentCancelPage from './page';
import { paymentService } from '@/services/payment.service';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(),
}));

vi.mock('@/services/payment.service', () => ({
  paymentService: {
    verifySession: vi.fn(),
    createCheckoutSession: vi.fn(),
  },
}));

describe('PaymentCancelPage', () => {
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);
    vi.mocked(paymentService.verifySession).mockRejectedValue(
      new Error('No session'),
    );
  });

  it('should display cancellation message when no session id', async () => {
    render(<PaymentCancelPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment cancelled')).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        /You cancelled the payment process. Your appointment booking has not been completed./,
      ),
    ).toBeInTheDocument();
  });

  it('should display warning about slot availability', async () => {
    render(<PaymentCancelPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Your appointment slot may no longer be available/),
      ).toBeInTheDocument();
    });
  });

  it('should have browse doctors button', async () => {
    render(<PaymentCancelPage />);

    await waitFor(() => {
      expect(screen.getByText('Browse doctors')).toBeInTheDocument();
    });
    const browseButton = screen.getByText('Browse doctors');
    expect(browseButton.closest('a')).toHaveAttribute('href', '/doctors');
  });

  it('should have return home button', async () => {
    render(<PaymentCancelPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Return home').length).toBeGreaterThan(0);
    });
    const homeButtons = screen.getAllByText('Return home');
    expect(homeButtons[0].closest('a')).toHaveAttribute('href', '/');
  });
});
