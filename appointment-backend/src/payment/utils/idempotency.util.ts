import * as crypto from 'crypto';

/**
 * Generate a deterministic idempotency key from appointmentId and patientIdentifier
 * Uses SHA-256 hashing to create a unique, reproducible key
 */
export function generateIdempotencyKey(
  appointmentId: string,
  patientIdentifier: string,
): string {
  const combined = `${appointmentId}:${patientIdentifier}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}
