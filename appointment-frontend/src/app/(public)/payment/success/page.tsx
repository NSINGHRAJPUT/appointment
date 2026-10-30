'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Check, Clock, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentResultCard } from '@/components/payment/PaymentResultCard';
import { getStoredToken } from '@/hooks/use-auth';
import {
  paymentService,
  type VerifySessionResponse,
} from '@/services/payment.service';

type VerificationState = 'loading' | 'success' | 'error';

function formatAppointmentDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatAppointmentTime(startIso: string, endIso: string) {
  const start = new Date(startIso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const end = new Date(endIso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${start} – ${end}`;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [state, setState] = useState<VerificationState>('loading');
  const [checking, setChecking] = useState(false);
  const [data, setData] = useState<VerifySessionResponse | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setIsLoggedIn(Boolean(getStoredToken()));
  }, []);

  const runVerification = useCallback(async () => {
    if (!sessionId) {
      setState('error');
      setErrorMessage('No session ID provided. Please try again.');
      return;
    }

    setChecking(true);
    try {
      const result = await paymentService.verifySession({ sessionId });

      if (result.status === 'SUCCEEDED') {
        setData(result);
        setState('success');
        setErrorMessage('');
      } else {
        setState('error');
        setErrorMessage(
          result.status === 'PENDING'
            ? 'Payment is still processing. Please check again in a moment.'
            : 'Payment was not completed. Please try again or contact support.',
        );
      }
    } catch (error) {
      setState('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to verify payment. Please try again.',
      );
    } finally {
      setChecking(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void runVerification();
  }, [runVerification]);

  if ((state === 'loading' || checking) && state !== 'success') {
    return (
      <PaymentResultCard>
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-primary">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-on-surface">Verifying payment…</h1>
          <p className="text-on-surface-variant">
            Please wait while we confirm your payment and appointment.
          </p>
        </div>
      </PaymentResultCard>
    );
  }

  if (state === 'success' && data) {
    const { appointment } = data;
    return (
      <PaymentResultCard>
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-primary">
            <Check size={28} strokeWidth={2.5} />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-on-surface">Payment confirmed!</h1>
          <p className="mb-6 text-on-surface-variant leading-relaxed">
            Your appointment has been booked. We&apos;ve sent a confirmation email to your
            registered address.
          </p>

          <div className="mb-8 space-y-4 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-left text-sm">
            {(appointment.startAt || appointment.endAt) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-outline-variant/60">
                {appointment.startAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary border border-outline-variant">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        Date
                      </p>
                      <p className="font-semibold text-on-surface">
                        {formatAppointmentDate(appointment.startAt)}
                      </p>
                    </div>
                  </div>
                )}
                {appointment.startAt && appointment.endAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary border border-outline-variant">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        Time
                      </p>
                      <p className="font-semibold text-on-surface">
                        {formatAppointmentTime(appointment.startAt, appointment.endAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div>
              <p className="mb-1 text-on-surface-variant">Appointment ID</p>
              <p className="break-all font-medium text-on-surface">{appointment.id}</p>
            </div>
            {appointment.doctor?.user?.fullName && (
              <div>
                <p className="mb-1 text-on-surface-variant">Veterinarian</p>
                <p className="font-medium text-on-surface">
                  {appointment.doctor.user.fullName}
                </p>
              </div>
            )}
            <div>
              <p className="mb-1 text-on-surface-variant">Status</p>
              <p className="font-medium text-primary">{appointment.status}</p>
            </div>
          </div>

          <div className="space-y-3">
            {isLoggedIn ? (
              <Link href="/dashboard/appointments" className="block">
                <Button className="w-full">View my appointments</Button>
              </Link>
            ) : (
              <>
                <Link
                  href={`/appointment-lookup?appointmentId=${encodeURIComponent(appointment.id)}`}
                  className="block"
                >
                  <Button className="w-full">Track appointment</Button>
                </Link>
                <Link href="/auth" className="block">
                  <Button variant="ghost" className="w-full">
                    Create account
                  </Button>
                </Link>
                <Link href="/doctors" className="block">
                  <Button variant="ghost" className="w-full">
                    Book another
                  </Button>
                </Link>
              </>
            )}
            <Link href="/" className="block">
              <Button variant="ghost" className="w-full">
                Return home
              </Button>
            </Link>
          </div>
        </div>
      </PaymentResultCard>
    );
  }

  return (
    <PaymentResultCard>
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
          <X size={28} strokeWidth={2.5} />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-on-surface">Payment verification failed</h1>
        <p className="mb-6 text-on-surface-variant">{errorMessage}</p>

        <div className="space-y-3">
          {sessionId && (
            <Button
              onClick={() => void runVerification()}
              disabled={checking}
              className="w-full"
            >
              Check again
            </Button>
          )}
          <Link href="/appointment-lookup" className="block">
            <Button variant="ghost" className="w-full">
              Look up appointment
            </Button>
          </Link>
          <Link href="/doctors" className="block">
            <Button variant="ghost" className="w-full">
              Back to booking
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="ghost" className="w-full">
              Return home
            </Button>
          </Link>
        </div>
      </div>
    </PaymentResultCard>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <PaymentResultCard>
          <p className="text-center text-on-surface-variant">Loading…</p>
        </PaymentResultCard>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
