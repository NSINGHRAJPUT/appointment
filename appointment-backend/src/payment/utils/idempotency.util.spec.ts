import { generateIdempotencyKey } from './idempotency.util';

describe('Idempotency Key Generation', () => {
  describe('generateIdempotencyKey', () => {
    it('should generate a deterministic key for the same inputs', () => {
      const appointmentId = 'apt-123';
      const patientIdentifier = 'patient@example.com';

      const key1 = generateIdempotencyKey(appointmentId, patientIdentifier);
      const key2 = generateIdempotencyKey(appointmentId, patientIdentifier);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different appointment IDs', () => {
      const patientIdentifier = 'patient@example.com';

      const key1 = generateIdempotencyKey('apt-123', patientIdentifier);
      const key2 = generateIdempotencyKey('apt-456', patientIdentifier);

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different patient identifiers', () => {
      const appointmentId = 'apt-123';

      const key1 = generateIdempotencyKey(appointmentId, 'patient1@example.com');
      const key2 = generateIdempotencyKey(appointmentId, 'patient2@example.com');

      expect(key1).not.toBe(key2);
    });

    it('should return a 64-character hex string (SHA-256)', () => {
      const key = generateIdempotencyKey('apt-123', 'patient@example.com');

      expect(key).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle phone numbers as patient identifiers', () => {
      const appointmentId = 'apt-123';
      const phoneNumber = '+1234567890';

      const key1 = generateIdempotencyKey(appointmentId, phoneNumber);
      const key2 = generateIdempotencyKey(appointmentId, phoneNumber);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should be unique for different appointment + patient combinations', () => {
      const keys = new Set();

      for (let i = 0; i < 100; i++) {
        const key = generateIdempotencyKey(
          `apt-${i}`,
          `patient${i}@example.com`,
        );
        keys.add(key);
      }

      expect(keys.size).toBe(100);
    });
  });
});
