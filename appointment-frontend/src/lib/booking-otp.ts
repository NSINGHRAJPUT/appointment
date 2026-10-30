import { otpService } from '@/services/otp.service';
import { isValidPhone } from './phone';

export async function sendBookingOtp(phone: string, email?: string) {
  const trimmedPhone = phone.trim();
  if (!isValidPhone(trimmedPhone)) {
    throw new Error('A valid phone number is required');
  }

  const trimmedEmail = email?.trim();
  await otpService.send(
    trimmedPhone,
    'PHONE',
    trimmedEmail || undefined,
  );
}

export function bookingOtpTarget(phone: string) {
  return phone.trim();
}
