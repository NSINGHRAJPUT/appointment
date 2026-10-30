import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentService } from './payment.service';
import * as apiModule from '@/lib/api';

// Mock the apiFetch function
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session successfully', async () => {
      const mockResponse = {
        sessionId: 'cs_test_123',
        sessionUrl: 'https://checkout.stripe.com/pay/cs_test_123',
        appointmentId: 'apt_123',
      };

      vi.mocked(apiModule.apiFetch).mockResolvedValueOnce(mockResponse);

      const input = {
        appointmentId: 'apt_123',
        doctorId: 'doc_123',
        patientIdentifier: 'patient@example.com',
      };

      const result = await paymentService.createCheckoutSession(input);

      expect(result).toEqual(mockResponse);
      expect(apiModule.apiFetch).toHaveBeenCalledWith(
        '/payments/create-session',
        {
          method: 'POST',
          body: JSON.stringify(input),
        }
      );
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Stripe API error';
      vi.mocked(apiModule.apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      const input = {
        appointmentId: 'apt_123',
        doctorId: 'doc_123',
        patientIdentifier: 'patient@example.com',
      };

      await expect(paymentService.createCheckoutSession(input)).rejects.toThrow(
        errorMessage
      );
    });
  });

  describe('verifySession', () => {
    it('should verify a session successfully', async () => {
      const mockResponse = {
        status: 'SUCCEEDED' as const,
        appointment: {
          id: 'apt_123',
          status: 'CONFIRMED' as const,
          paymentStatus: 'SUCCEEDED' as const,
          startAt: '2025-05-15T10:00:00Z',
          endAt: '2025-05-15T10:30:00Z',
          doctorId: 'doc_123',
        },
        payment: {
          id: 'pay_123',
          appointmentId: 'apt_123',
          stripeSessionId: 'cs_test_123',
          amount: 5000,
          currency: 'INR',
          status: 'SUCCEEDED' as const,
          idempotencyKey: 'idem_key_123',
          createdAt: '2025-05-15T09:00:00Z',
          updatedAt: '2025-05-15T09:05:00Z',
        },
      };

      vi.mocked(apiModule.apiFetch).mockResolvedValueOnce(mockResponse);

      const input = { sessionId: 'cs_test_123' };

      const result = await paymentService.verifySession(input);

      expect(result).toEqual(mockResponse);
      expect(apiModule.apiFetch).toHaveBeenCalledWith(
        '/payments/verify-session',
        {
          method: 'POST',
          body: JSON.stringify(input),
        }
      );
    });

    it('should handle verification errors', async () => {
      const errorMessage = 'Payment not completed';
      vi.mocked(apiModule.apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      const input = { sessionId: 'cs_test_123' };

      await expect(paymentService.verifySession(input)).rejects.toThrow(
        errorMessage
      );
    });
  });

  describe('getPayment', () => {
    it('should fetch payment details successfully', async () => {
      const mockResponse = {
        id: 'pay_123',
        appointmentId: 'apt_123',
        stripeSessionId: 'cs_test_123',
        amount: 5000,
        currency: 'INR',
        status: 'SUCCEEDED' as const,
        idempotencyKey: 'idem_key_123',
        createdAt: '2025-05-15T09:00:00Z',
        updatedAt: '2025-05-15T09:05:00Z',
      };

      vi.mocked(apiModule.apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await paymentService.getPayment('apt_123', 'token_123');

      expect(result).toEqual(mockResponse);
      expect(apiModule.apiFetch).toHaveBeenCalledWith(
        '/payments/apt_123',
        undefined,
        'token_123'
      );
    });

    it('should fetch payment without token', async () => {
      const mockResponse = {
        id: 'pay_123',
        appointmentId: 'apt_123',
        stripeSessionId: 'cs_test_123',
        amount: 5000,
        currency: 'INR',
        status: 'SUCCEEDED' as const,
        idempotencyKey: 'idem_key_123',
        createdAt: '2025-05-15T09:00:00Z',
        updatedAt: '2025-05-15T09:05:00Z',
      };

      vi.mocked(apiModule.apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await paymentService.getPayment('apt_123');

      expect(result).toEqual(mockResponse);
      expect(apiModule.apiFetch).toHaveBeenCalledWith(
        '/payments/apt_123',
        undefined,
        undefined
      );
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Payment not found';
      vi.mocked(apiModule.apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(paymentService.getPayment('apt_123')).rejects.toThrow(
        errorMessage
      );
    });
  });
});
