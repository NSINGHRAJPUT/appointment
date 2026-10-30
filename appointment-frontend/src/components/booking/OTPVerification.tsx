'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { sendBookingOtp } from '@/lib/booking-otp';
import { guestBookingSchema, formatZodError } from '@/lib/validation/schemas';
import { isValidIndianMobile } from '@/lib/validation/phone';

export function OTPVerification({
  onConfirm,
  onBack,
}: {
  onConfirm: (details: {
    name: string;
    phone: string;
    otp: string;
    email?: string;
  }) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    const parsed = guestBookingSchema
      .pick({ patientName: true, patientPhone: true, patientEmail: true })
      .safeParse({
        patientName: name.trim(),
        patientPhone: phone,
        patientEmail: email.trim(),
        otpCode: '000000',
      });
    if (!parsed.success) {
      setError(formatZodError(parsed.error));
      return;
    }

    setError('');
    setIsSending(true);
    try {
      await sendBookingOtp(
        parsed.data.patientPhone,
        parsed.data.patientEmail || undefined,
      );
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirm = () => {
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setError('');
    onConfirm({
      name: name.trim(),
      phone: phone.trim(),
      otp,
      email: email.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-on-surface-variant">
        {step === 'details'
          ? 'Enter your details to proceed. No signup required.'
          : `Enter the 6-digit code sent to ${phone}${email.trim() ? ` and ${email.trim()}` : ''}.`}
      </p>

      {error && (
        <div className="rounded-xl border border-error/25 bg-error-container/50 p-3 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {step === 'details' ? (
        <div className="space-y-4">
          <Input
            type="text"
            label="Full name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="tel"
            label="Phone"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
            }
          />
          <Input
            type="email"
            label="Email (optional)"
            placeholder="For confirmation & OTP backup"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button
              onClick={handleSendOTP}
              disabled={!name.trim() || !isValidIndianMobile(phone) || isSending}
              loading={isSending}
            >
              Send OTP
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-on-surface-variant rounded-xl bg-surface-container-low px-3 py-2">
            Check SMS or email for your code. If delivery is delayed in this demo
            environment, ask your admin for the OTP configuration.
          </p>
          <Input
            type="text"
            label="Verification code"
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            maxLength={6}
          />
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep('details')}>
              Change details
            </Button>
            <Button onClick={handleConfirm} disabled={otp.length !== 6}>
              Confirm booking
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
