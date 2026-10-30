'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DoctorSelection } from './DoctorSelection';
import { SlotSelection } from './SlotSelection';
import { OTPVerification } from './OTPVerification';
import { PaymentStateIndicator, type PaymentState } from './PaymentStateIndicator';
import { appointmentService } from '@/services/appointment.service';
import { redirectToCheckoutIfNeeded } from '@/lib/booking-payment';
import { doctorService } from '@/services/doctor.service';
import { bookingOtpTarget } from '@/lib/booking-otp';
import { getStoredToken } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';

type BookingStep =
  | 'doctor'
  | 'slot'
  | 'details'
  | 'otp'
  | 'processing'
  | 'success';

export type BookingDoctorPreset = {
  id: string;
  fullName: string;
  specialization?: string | null;
  priceCents: number;
  currency?: string;
};

type BookingData = {
  doctorId?: string;
  doctorName?: string;
  specialization?: string | null;
  priceCents?: number;
  currency?: string;
  slotStartAt?: string;
  slotEndAt?: string;
  reason?: string;
  appointmentId?: string;
};

export function BookingWizard({
  open,
  onClose,
  doctor: presetDoctor,
  isInstant = false,
  skipDoctorStep = false,
}: {
  open: boolean;
  onClose: () => void;
  doctor?: BookingDoctorPreset | null;
  isInstant?: boolean;
  skipDoctorStep?: boolean;
}) {
  const hasPreset = Boolean(presetDoctor?.id || skipDoctorStep);
  const [step, setStep] = useState<BookingStep>(hasPreset ? 'slot' : 'doctor');
  const [bookingData, setBookingData] = useState<BookingData>(() =>
    presetDoctor
      ? {
          doctorId: presetDoctor.id,
          doctorName: presetDoctor.fullName,
          specialization: presetDoctor.specialization,
          priceCents: presetDoctor.priceCents,
          currency: presetDoctor.currency ?? 'INR',
        }
      : {},
  );
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [paymentState, setPaymentState] = useState<PaymentState>('creating-appointment');
  const [, setPatientIdentifier] = useState('');

  useEffect(() => {
    if (!open) return;
    const t = getStoredToken();
    setToken(t);
    if (presetDoctor) {
      setBookingData({
        doctorId: presetDoctor.id,
        doctorName: presetDoctor.fullName,
        specialization: presetDoctor.specialization,
        priceCents: presetDoctor.priceCents,
        currency: presetDoctor.currency ?? 'INR',
      });
      setStep('slot');
    } else {
      setBookingData({});
      setStep('doctor');
    }
    setReason('');
    setError('');
  }, [open, presetDoctor]);

  const handleDoctorSelect = async (doctorId: string) => {
    try {
      const doctor = (await doctorService.getById(doctorId)) as {
        priceCents?: number;
        currency?: string;
        specialization?: string | null;
        user?: { fullName?: string };
      };
      setBookingData({
        doctorId,
        doctorName: doctor.user?.fullName,
        specialization: doctor.specialization,
        priceCents: doctor.priceCents ?? 0,
        currency: doctor.currency ?? 'INR',
      });
      setStep('slot');
    } catch {
      setBookingData({ doctorId, priceCents: 0, currency: 'INR' });
      setStep('slot');
    }
  };

  const handleSlotSelect = async (slotStartAt: string, slotEndAt?: string) => {
    if (!bookingData.doctorId) return;
    let endAt = slotEndAt;
    if (!endAt) {
      try {
        const slots = (await doctorService.nextSlots(
          bookingData.doctorId,
          undefined,
          12,
        )) as { startAt: string; endAt: string }[];
        endAt =
          slots.find((s) => s.startAt === slotStartAt)?.endAt ??
          new Date(new Date(slotStartAt).getTime() + 30 * 60000).toISOString();
      } catch {
        endAt = new Date(new Date(slotStartAt).getTime() + 30 * 60000).toISOString();
      }
    }
    setBookingData((prev) => ({
      ...prev,
      slotStartAt,
      slotEndAt: endAt,
    }));
    setStep('details');
  };

  const bookAuthenticated = async () => {
    if (!token || !bookingData.doctorId || !bookingData.slotStartAt || !bookingData.slotEndAt) {
      setError('Missing booking details. Please start again.');
      return;
    }
    try {
      setError('');
      setStep('processing');
      setPaymentState('creating-appointment');

      const me = (await authService.me(token)) as {
        phone?: string | null;
        email?: string | null;
      };
      const identifier = me?.phone?.trim() || me?.email?.trim() || '';
      setPatientIdentifier(identifier);

      const appointment = (await appointmentService.book(token, {
        doctorId: bookingData.doctorId,
        startAt: bookingData.slotStartAt,
        endAt: bookingData.slotEndAt,
        reason: reason.trim() || undefined,
        isInstant: isInstant || undefined,
      })) as { id: string };

      setBookingData((prev) => ({ ...prev, appointmentId: appointment.id }));

      const priceCents = bookingData.priceCents ?? 0;
      if (priceCents <= 0) {
        setPaymentState('booking-confirmed');
        setStep('success');
        return;
      }

      setPaymentState('redirecting-to-payment');
      const checkoutResult = await redirectToCheckoutIfNeeded({
        appointmentId: appointment.id,
        doctorId: bookingData.doctorId,
        priceCents,
        currency: bookingData.currency ?? 'INR',
        patientIdentifier: identifier,
      });
      if (checkoutResult === 'free') {
        setPaymentState('booking-confirmed');
        setStep('success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment.');
      setPaymentState('booking-failed');
      setStep('details');
    }
  };

  const handleGuestConfirm = async ({
    name,
    phone,
    otp,
    email,
  }: {
    name: string;
    phone: string;
    otp: string;
    email?: string;
  }) => {
    if (!bookingData.doctorId || !bookingData.slotStartAt || !bookingData.slotEndAt) {
      setError('Missing booking details. Please start again.');
      return;
    }
    try {
      setError('');
      setStep('processing');
      setPaymentState('creating-appointment');
      setPatientIdentifier(phone);

      const appointment = (await appointmentService.bookAsGuest({
        doctorId: bookingData.doctorId,
        startAt: bookingData.slotStartAt,
        endAt: bookingData.slotEndAt,
        patientName: name,
        patientPhone: phone,
        patientEmail: email,
        otpCode: otp,
        otpTarget: bookingOtpTarget(phone),
        otpType: 'PHONE',
        reason: reason.trim() || 'Appointment booking',
        isInstant: isInstant || undefined,
      })) as { id: string };

      setBookingData((prev) => ({ ...prev, appointmentId: appointment.id }));

      const priceCents = bookingData.priceCents ?? 0;
      if (priceCents <= 0) {
        setPaymentState('booking-confirmed');
        setStep('success');
        return;
      }

      setPaymentState('redirecting-to-payment');
      const checkoutResult = await redirectToCheckoutIfNeeded({
        appointmentId: appointment.id,
        doctorId: bookingData.doctorId,
        priceCents,
        currency: bookingData.currency ?? 'INR',
        patientIdentifier: phone,
      });
      if (checkoutResult === 'free') {
        setPaymentState('booking-confirmed');
        setStep('success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment.');
      setPaymentState('booking-failed');
      setStep('otp');
    }
  };

  const handleClose = () => {
    setStep(hasPreset ? 'slot' : 'doctor');
    setError('');
    setReason('');
    onClose();
  };

  const titles: Record<BookingStep, string> = {
    doctor: 'Select a Veterinarian',
    slot: isInstant ? 'Pick the next available slot' : 'Select Time Slot',
    details: 'Consultation details',
    otp: 'Verify your details',
    processing: 'Processing booking',
    success: 'Booking confirmed',
  };

  return (
    <Modal open={open} title={titles[step]} onClose={handleClose} size="md">
      {error && step !== 'processing' && (
        <div className="mb-4 rounded-xl border border-error/25 bg-error-container/60 p-3 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {step === 'doctor' && <DoctorSelection onSelect={handleDoctorSelect} />}

      {step === 'slot' && bookingData.doctorId && (
        <div className="space-y-3">
          {(bookingData.doctorName || presetDoctor) && (
            <div className="rounded-xl bg-primary-container/50 px-3 py-2 text-sm text-on-surface-variant">
              <span className="font-medium text-on-surface">
                {bookingData.doctorName || presetDoctor?.fullName}
              </span>
              {(bookingData.specialization || presetDoctor?.specialization) && (
                <> · {bookingData.specialization || presetDoctor?.specialization}</>
              )}
            </div>
          )}
          {isInstant && (
            <p className="text-sm text-on-surface-variant">
              Instant consults book the soonest open slot with an online vet — you&apos;ll
              connect around that time.
            </p>
          )}
          <SlotSelection
            doctorId={bookingData.doctorId}
            onSelect={(start, end) => handleSlotSelect(start, end)}
            onBack={() => (hasPreset ? handleClose() : setStep('doctor'))}
            backLabel={hasPreset ? 'Cancel' : 'Back'}
          />
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4">
          <Input
            label="Reason for visit (optional)"
            placeholder="e.g. itchy skin, vaccination, follow-up"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {token ? (
            <div className="flex justify-between gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('slot')}>
                Back
              </Button>
              <Button onClick={bookAuthenticated}>Confirm booking</Button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <p className="text-sm text-on-surface-variant">
                Continue as guest with OTP, or{' '}
                <Link
                  href={`/auth?returnUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/doctors')}`}
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  sign in
                </Link>{' '}
                to skip verification.
              </p>
              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => setStep('slot')}>
                  Back
                </Button>
                <Button onClick={() => setStep('otp')}>Continue as guest</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'otp' && (
        <OTPVerification
          onConfirm={handleGuestConfirm}
          onBack={() => setStep('details')}
        />
      )}

      {step === 'processing' && (
        <PaymentStateIndicator
          state={paymentState}
          appointmentId={bookingData.appointmentId}
          errorMessage={error || undefined}
          onRetry={() => setStep(token ? 'details' : 'otp')}
          onRebook={handleClose}
        />
      )}

      {step === 'success' && (
        <div className="space-y-5 py-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-primary">
            <Check size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-on-surface-variant">
              Your appointment is booked
              {bookingData.doctorName ? ` with ${bookingData.doctorName}` : ''}.
            </p>
            {bookingData.appointmentId && (
              <p className="mt-2 font-mono text-xs text-on-surface-variant">
                ID: {bookingData.appointmentId}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {token ? (
              <Link
                href="/dashboard/appointments"
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
              >
                View appointments
              </Link>
            ) : (
              <>
                <Link
                  href={`/appointment-lookup?appointmentId=${bookingData.appointmentId ?? ''}`}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
                >
                  Track appointment
                </Link>
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-full border-2 border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary-container"
                >
                  Create account
                </Link>
              </>
            )}
            <Button variant="ghost" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** @deprecated Use BookingWizard — kept as alias for existing imports */
export function BookingModal(props: {
  open: boolean;
  onClose: () => void;
}) {
  return <BookingWizard {...props} />;
}
