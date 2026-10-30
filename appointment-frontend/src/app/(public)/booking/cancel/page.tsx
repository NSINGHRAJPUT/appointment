'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Calendar, Check, Clock, Loader2, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentResultCard } from '@/components/payment/PaymentResultCard';
import {
  paymentService,
  type VerifySessionResponse,
} from '@/services/payment.service';

type PageState = 'loading' | 'cancelled' | 'success' | 'error';

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

function PaymentCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [state, setState] = useState<PageState>('loading');
  const [checking, setChecking] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [data, setData] = useState<VerifySessionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const runVerification = useCallback(async () => {
    if (!sessionId) {
      setState('cancelled');
      return;
    }

    setChecking(true);
    try {
      const result = await paymentService.verifySession({ sessionId });
      setData(result);

      if (result.status === 'SUCCEEDED') {
        setState('success');
      } else if (result.status === 'PENDING') {
        setState('cancelled');
        setErrorMessage('Payment is still pending. You can check again if you completed payment.');
      } else {
        setState('cancelled');
        setErrorMessage('');
      }
    } catch (error) {
      setState('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to verify payment status.',
      );
    } finally {
      setChecking(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void runVerification();
  }, [runVerification]);

  async function handleRetryPayment() {
    if (!data?.appointment?.id || !data.appointment.doctorId) return;

    setRetrying(true);
    try {
      const patientIdentifier =
        data.appointment.patientPhone?.trim() ||
        data.appointment.patientEmail?.trim() ||
        '';

      const checkout = await paymentService.createCheckoutSession({
        appointmentId: data.appointment.id,
        doctorId: data.appointment.doctorId,
        patientIdentifier,
      });

      window.location.href = checkout.sessionUrl;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to start payment retry.',
      );
      setState('error');
    } finally {
      setRetrying(false);
    }
  }

  if (state === 'loading' || (checking && state !== 'success')) {
    return (
      <PaymentResultCard>
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-primary">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-on-surface">Checking payment…</h1>
          <p className="text-on-surface-variant">Please wait while we verify your payment status.</p>
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
          <p className="mb-6 text-on-surface-variant">
            Your payment was successful and your appointment is confirmed.
          </p>
          {appointment.startAt && appointment.endAt && (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-left text-sm">
              <div className="flex items-start gap-3">
                <Calendar size={16} className="mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider">Date</p>
                  <p className="font-semibold text-on-surface">
                    {formatAppointmentDate(appointment.startAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={16} className="mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider">Time</p>
                  <p className="font-semibold text-on-surface">
                    {formatAppointmentTime(appointment.startAt, appointment.endAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() =>
                router.push(
                  sessionId
                    ? `/payment/success?session_id=${encodeURIComponent(sessionId)}`
                    : '/payment/success',
                )
              }
            >
              View confirmation
            </Button>
            <Link href="/appointment-lookup" className="block">
              <Button variant="ghost" className="w-full">
                Track appointment
              </Button>
            </Link>
            <Link href="/dashboard/appointments" className="block">
              <Button variant="ghost" className="w-full">
                View my appointments
              </Button>
            </Link>
          </div>
        </div>
      </PaymentResultCard>
    );
  }

  const appointment = data?.appointment;

  return (
    <PaymentResultCard>
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-container/50 text-tertiary">
          <AlertTriangle size={28} />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-on-surface">
          {state === 'error' ? 'Verification failed' : 'Payment cancelled'}
        </h1>
        <p className="mb-6 text-on-surface-variant leading-relaxed">
          {errorMessage ||
            'You cancelled the payment process. Your appointment booking has not been completed.'}
        </p>

        {appointment?.startAt && appointment?.endAt && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-left text-sm">
            <div className="flex items-start gap-3">
              <Calendar size={16} className="mt-0.5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider">Date</p>
                <p className="font-semibold text-on-surface">
                  {formatAppointmentDate(appointment.startAt)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={16} className="mt-0.5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider">Time</p>
                <p className="font-semibold text-on-surface">
                  {formatAppointmentTime(appointment.startAt, appointment.endAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-tertiary/25 bg-tertiary-container/30 p-4 text-left">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            <strong className="text-on-surface">Note:</strong> Your appointment slot may no longer
            be available. If you already paid, use Check again to confirm your booking. Otherwise
            rebook or browse other veterinarians.
          </p>
        </div>

        <div className="space-y-3">
          {sessionId && (
            <Button
              onClick={() => void runVerification()}
              disabled={checking}
              className="w-full"
            >
              {checking ? 'Checking…' : 'Check again'}
            </Button>
          )}
          {data?.appointment?.id && data.payment && (
            <Button
              onClick={() => void handleRetryPayment()}
              disabled={retrying}
              variant="outline"
              className="w-full"
            >
              {retrying ? 'Redirecting…' : 'Retry payment'}
            </Button>
          )}
          {appointment?.doctorId && (
            <Link href={`/doctors/${appointment.doctorId}`} className="block">
              <Button variant="outline" className="w-full gap-2">
                <Calendar size={16} />
                Rebook with this vet
              </Button>
            </Link>
          )}
          <Link href="/doctors" className="block">
            <Button variant="ghost" className="w-full gap-2">
              <Stethoscope size={16} />
              Browse doctors
            </Button>
          </Link>
          <Link href="/appointment-lookup" className="block">
            <Button variant="ghost" className="w-full">
              Look up appointment
            </Button>
          </Link>
          <Link href="/auth" className="block">
            <Button variant="ghost" className="w-full">
              Sign in
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

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <PaymentResultCard>
          <p className="text-center text-on-surface-variant">Loading…</p>
        </PaymentResultCard>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
