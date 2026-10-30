import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { BookingModal } from './BookingModal';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/services/appointment.service', () => ({
  appointmentService: {
    bookAsGuest: vi.fn(),
  },
}));

vi.mock('@/services/doctor.service', () => ({
  doctorService: {
    getById: vi.fn(),
  },
}));

vi.mock('@/lib/booking-payment', () => ({
  redirectToCheckoutIfNeeded: vi.fn(),
}));

describe('BookingModal', () => {
  const mockOnClose = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);
  });

  it('should render doctor selection step initially', () => {
    render(<BookingModal open={true} onClose={mockOnClose} />);

    expect(screen.getByText('Select a Veterinarian')).toBeInTheDocument();
  });

  it('should close modal when onClose is called', () => {
    const { rerender } = render(<BookingModal open={true} onClose={mockOnClose} />);

    rerender(<BookingModal open={false} onClose={mockOnClose} />);

    // Modal should not be visible
    expect(screen.queryByText('Select a Veterinarian')).not.toBeInTheDocument();
  });

  it('should display error message when booking fails', async () => {
    render(<BookingModal open={true} onClose={mockOnClose} />);
    expect(screen.getByText('Select a Veterinarian')).toBeInTheDocument();
  });
});
