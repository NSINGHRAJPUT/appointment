import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import PaymentSuccessPage from './page';
import { paymentService } from '@/services/payment.service';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(),
}));

vi.mock('@/services/payment.service', () => ({
  paymentService: {
    verifySession: vi.fn(),
  },
}));

describe('PaymentSuccessPage', () => {
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
    mockSearchParams.set('session_id', 'cs_test_123');
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);

    vi.mocked(paymentService.verifySession).mockResolvedValue({
      status: 'SUCCEEDED',
      appointment: {
        id: 'apt_123',
        status: 'CONFIRMED',
        paymentStatus: 'SUCCEEDED',
        startAt: '2025-05-15T10:00:00Z',
        endAt: '2025-05-15T10:30:00Z',
        doctorId: 'doc_123',
        doctor: { user: { fullName: 'Dr. Smith' } },
      },
      payment: {
        id: 'pay_123',
        appointmentId: 'apt_123',
        stripeSessionId: 'cs_test_123',
        amount: 5000,
        currency: 'INR',
        status: 'SUCCEEDED',
        idempotencyKey: 'key',
        createdAt: '2025-05-15T09:00:00Z',
        updatedAt: '2025-05-15T09:05:00Z',
      },
    });
  });

  it('should display loading state initially', () => {
    render(<PaymentSuccessPage />);
    expect(screen.getByText('Verifying payment…')).toBeInTheDocument();
  });

  it('should display error when no session ID is provided', async () => {
    mockSearchParams.clear();
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);

    render(<PaymentSuccessPage />);

    await waitFor(() => {
      expect(
        screen.getByText('No session ID provided. Please try again.'),
      ).toBeInTheDocument();
    });
  });

  it('should display success state after verification', async () => {
    render(<PaymentSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment confirmed!')).toBeInTheDocument();
    });

    expect(paymentService.verifySession).toHaveBeenCalledWith({
      sessionId: 'cs_test_123',
    });
  });

  it('should have check again button in error state', async () => {
    vi.mocked(paymentService.verifySession).mockResolvedValueOnce({
      status: 'PENDING',
      appointment: {
        id: 'apt_123',
        status: 'REQUESTED',
        paymentStatus: 'PENDING',
        startAt: '',
        endAt: '',
        doctorId: 'doc_123',
      },
    });

    render(<PaymentSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('Check again')).toBeInTheDocument();
    });
  });
});
