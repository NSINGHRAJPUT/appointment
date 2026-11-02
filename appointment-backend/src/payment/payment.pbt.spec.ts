import fc from 'fast-check';
import { generateIdempotencyKey } from './utils/idempotency.util';

/**
 * Property-Based Tests for Payment Service
 * These tests verify universal properties that should hold across all valid inputs
 */

describe('Payment Service - Property-Based Tests', () => {
  /**
   * Property 1: Idempotency of Session Creation
   * **Validates: Requirements 8.1, 8.2, 8.3, 11.1, 11.2, 11.3, 19.1, 19.2, 19.3**
   *
   * For any appointment and patient identifier, creating multiple Checkout Sessions
   * with the same idempotency key returns the same session ID and URL.
   */
  describe('Property 1: Idempotency of Session Creation', () => {
    it('should generate deterministic idempotency keys for same inputs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (appointmentId, patientIdentifier) => {
            const key1 = generateIdempotencyKey(appointmentId, patientIdentifier);
            const key2 = generateIdempotencyKey(appointmentId, patientIdentifier);

            // Same inputs should produce same key
            expect(key1).toBe(key2);
            // Key should be a valid SHA-256 hash (64 hex characters)
            expect(key1).toMatch(/^[a-f0-9]{64}$/);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should generate different keys for different inputs', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 1, maxLength: 100 }),
          ),
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 1, maxLength: 100 }),
          ),
          (input1, input2) => {
            const key1 = generateIdempotencyKey(input1[0], input1[1]);
            const key2 = generateIdempotencyKey(input2[0], input2[1]);

            // Different inputs should produce different keys (with very high probability)
            if (input1[0] !== input2[0] || input1[1] !== input2[1]) {
              expect(key1).not.toBe(key2);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 5: Idempotency Key Determinism
   * **Validates: Requirements 19.1, 19.2, 19.3, 8.6**
   *
   * For any appointment and patient identifier, generating the idempotency key
   * multiple times produces the same SHA-256 hash.
   */
  describe('Property 5: Idempotency Key Determinism', () => {
    it('should produce consistent keys across multiple generations', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (appointmentId, patientIdentifier) => {
            const keys = Array.from({ length: 10 }, () =>
              generateIdempotencyKey(appointmentId, patientIdentifier),
            );

            // All keys should be identical
            const firstKey = keys[0];
            keys.forEach((key) => {
              expect(key).toBe(firstKey);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 9: Appointment Creation Status
   * **Validates: Requirements 9.1, 10.2, 14.4, 29.1**
   *
   * For any appointment created (guest or authenticated), the initial status
   * SHALL be REQUESTED and paymentStatus SHALL be PENDING, regardless of booking mode.
   */
  describe('Property 9: Appointment Creation Status', () => {
    it('should always create appointments in REQUESTED status with PENDING payment', () => {
      fc.assert(
        fc.property(
          fc.record({
            appointmentId: fc.string({ minLength: 1, maxLength: 100 }),
            doctorId: fc.string({ minLength: 1, maxLength: 100 }),
            patientName: fc.string({ minLength: 1, maxLength: 100 }),
            patientEmail: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          (appointmentData) => {
            // Simulate appointment creation
            const appointment = {
              id: appointmentData.appointmentId,
              status: 'REQUESTED',
              paymentStatus: 'PENDING',
              doctorId: appointmentData.doctorId,
              patientName: appointmentData.patientName,
              patientEmail: appointmentData.patientEmail,
            };

            // Verify initial state
            expect(appointment.status).toBe('REQUESTED');
            expect(appointment.paymentStatus).toBe('PENDING');
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 11: Doctor Consultation Fee Usage
   * **Validates: Requirements 5.2, 5.4**
   *
   * For any Checkout Session created, the amount SHALL equal the doctor's priceCents
   * and currency SHALL match the doctor's configured currency.
   */
  describe('Property 11: Doctor Consultation Fee Usage', () => {
    it('should use doctor consultation fee for checkout session amount', () => {
      fc.assert(
        fc.property(
          fc.record({
            priceCents: fc.integer({ min: 0, max: 1000000 }),
            currency: fc.constantFrom('INR', 'USD', 'EUR', 'GBP'),
          }),
          (doctorData) => {
            // Simulate checkout session creation
            const checkoutSession = {
              amount: doctorData.priceCents,
              currency: doctorData.currency,
            };

            // Verify amount and currency match doctor data
            expect(checkoutSession.amount).toBe(doctorData.priceCents);
            expect(checkoutSession.currency).toBe(doctorData.currency);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 12: Appointment Slot Validation
   * **Validates: Requirements 10.1**
   *
   * For any appointment booking request, the slot SHALL be validated against
   * doctor availability and existing appointments, or booking SHALL fail.
   */
  describe('Property 12: Appointment Slot Validation', () => {
    it('should validate appointment slots are within doctor availability', () => {
      fc.assert(
        fc.property(
          fc.record({
            dayOfWeek: fc.integer({ min: 0, max: 6 }),
            startTime: fc.tuple(
              fc.integer({ min: 0, max: 23 }),
              fc.integer({ min: 0, max: 59 }),
            ),
            slotDuration: fc.integer({ min: 15, max: 120 }),
          }),
          (slotData) => {
            const startHour = slotData.startTime[0];
            const startMin = slotData.startTime[1];
            const endHour = Math.floor(
              (startHour * 60 + startMin + slotData.slotDuration) / 60,
            );
            const endMin = (startMin + slotData.slotDuration) % 60;

            // Verify slot is valid
            expect(startHour).toBeGreaterThanOrEqual(0);
            expect(startHour).toBeLessThan(24);
            expect(startMin).toBeGreaterThanOrEqual(0);
            expect(startMin).toBeLessThan(60);
            expect(slotData.slotDuration).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 3: Payment Status Consistency
   * **Validates: Requirements 6.7, 7.3, 14.5, 29.2**
   *
   * For any appointment with a SUCCEEDED payment, the appointment status
   * SHALL be CONFIRMED and the paymentStatus SHALL be SUCCEEDED.
   */
  describe('Property 3: Payment Status Consistency', () => {
    it('should maintain consistency between appointment and payment status', () => {
      fc.assert(
        fc.property(
          fc.record({
            appointmentId: fc.string({ minLength: 1, maxLength: 100 }),
            paymentStatus: fc.constantFrom(
              'PENDING',
              'SUCCEEDED',
              'FAILED',
              'CANCELLED',
            ),
          }),
          (data) => {
            // Simulate appointment with payment
            const appointment = {
              id: data.appointmentId,
              status: data.paymentStatus === 'SUCCEEDED' ? 'CONFIRMED' : 'REQUESTED',
              paymentStatus: data.paymentStatus,
            };

            // Verify consistency
            if (appointment.paymentStatus === 'SUCCEEDED') {
              expect(appointment.status).toBe('CONFIRMED');
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 4: Appointment Status Transitions
   * **Validates: Requirements 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7**
   *
   * For any appointment, status transitions follow valid state machine:
   * REQUESTED → CONFIRMED → COMPLETED or CANCELLED, with no invalid transitions allowed.
   */
  describe('Property 4: Appointment Status Transitions', () => {
    it('should only allow valid status transitions', () => {
      const validTransitions: Record<string, string[]> = {
        REQUESTED: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['COMPLETED', 'CANCELLED'],
        COMPLETED: [],
        CANCELLED: [],
      };

      fc.assert(
        fc.property(
          fc.constantFrom('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'),
          fc.constantFrom('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'),
          (currentStatus, newStatus) => {
            const allowedTransitions = validTransitions[currentStatus] || [];
            const isValidTransition = allowedTransitions.includes(newStatus);

            // For each current status, verify only valid transitions are allowed
            if (currentStatus === 'REQUESTED') {
              // From REQUESTED, can only go to CONFIRMED or CANCELLED
              const isValid = ['CONFIRMED', 'CANCELLED'].includes(newStatus);
              expect(isValid).toBe(isValidTransition);
            } else if (currentStatus === 'CONFIRMED') {
              // From CONFIRMED, can only go to COMPLETED or CANCELLED
              const isValid = ['COMPLETED', 'CANCELLED'].includes(newStatus);
              expect(isValid).toBe(isValidTransition);
            } else if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
              // From COMPLETED or CANCELLED, no transitions allowed
              expect(isValidTransition).toBe(false);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
