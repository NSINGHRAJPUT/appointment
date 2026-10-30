'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Search, Stethoscope } from 'lucide-react';
import { appointmentService } from '@/services/appointment.service';
import { publicLookupSchema, formatZodError } from '@/lib/validation/schemas';

type LookupResult = Awaited<
  ReturnType<typeof appointmentService.publicLookup>
>['appointments'][number];

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

function AppointmentResultCard({ result }: { result: LookupResult }) {
  return (
    <div className="premium-card space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
          {result.status}
        </div>
        {result.paymentStatus && (
          <p className="text-xs text-on-surface-variant">
            Payment: <span className="font-medium text-on-surface">{result.paymentStatus}</span>
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-0.5">
              Date
            </p>
            <p className="font-semibold text-on-surface">{formatAppointmentDate(result.startAt)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-0.5">
              Time
            </p>
            <p className="font-semibold text-on-surface">
              {formatAppointmentTime(result.startAt, result.endAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-on-surface-variant">Appointment ID</p>
          <p className="font-medium break-all text-on-surface">{result.id}</p>
        </div>
        {result.patientName && (
          <div>
            <p className="text-on-surface-variant">Patient</p>
            <p className="font-medium text-on-surface">{result.patientName}</p>
          </div>
        )}
        {(result.maskedPhone || result.maskedEmail) && (
          <div>
            <p className="text-on-surface-variant">Contact on file</p>
            <p className="font-medium text-on-surface">
              {result.maskedPhone ?? result.maskedEmail}
            </p>
          </div>
        )}
        <div>
          <p className="text-on-surface-variant">Veterinarian</p>
          <p className="font-medium text-on-surface">{result.doctor.fullName}</p>
          <p className="text-on-surface-variant">
            {result.doctor.specialization ?? 'General Practice'}
            {result.doctor.clinicName ? ` • ${result.doctor.clinicName}` : ''}
          </p>
        </div>
        {result.reason && (
          <div>
            <p className="text-on-surface-variant">Reason</p>
            <p className="font-medium text-on-surface">{result.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AppointmentLookupClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(
    searchParams.get('appointmentId') ?? searchParams.get('query') ?? '',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LookupResult[]>([]);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResults([]);
    setSearched(false);

    const parsed = publicLookupSchema.safeParse({ query });
    if (!parsed.success) {
      setError(formatZodError(parsed.error));
      return;
    }

    setLoading(true);
    try {
      const data = await appointmentService.publicLookup({
        query: parsed.data.query,
      });
      setResults(data.appointments);
      setSearched(true);
    } catch (err) {
      setSearched(true);
      setError(
        err instanceof Error
          ? err.message
          : 'No appointment found for these details. Please check your appointment ID, mobile number, or email.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[70vh] w-full bg-surface-container-low py-16 px-margin">
      <div className="w-full max-w-[36rem] mx-auto">
        <div className="text-center mb-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
            <Search size={14} />
            Appointment lookup
          </p>
          <h1 className="font-bold text-3xl md:text-4xl text-on-surface mb-3 text-balance">
            Track your appointment
          </h1>
          <p className="text-on-surface-variant leading-relaxed max-w-prose mx-auto">
            Enter your appointment ID, mobile number, or email used when booking.
            Read-only access only.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="premium-card space-y-4 mb-6">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-on-surface">
              Appointment ID, mobile, or email
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Paste appointment ID, 9876543210, or you@email.com"
              autoComplete="off"
            />
          </label>
          {error && (
            <p className="text-sm text-error bg-error/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 font-semibold disabled:opacity-60"
          >
            {loading ? 'Looking up…' : 'Find appointment'}
          </button>
        </form>

        {searched && !loading && results.length === 0 && !error && (
          <div className="premium-card text-center py-10 px-6 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
              <Search size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-on-surface mb-1">No appointments found</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                We couldn&apos;t match that ID, phone, or email. Double-check the details from your
                confirmation email, or browse vets to book a new visit.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/doctors" className="btn-primary px-5 py-2.5 text-center inline-flex items-center justify-center gap-2">
                <Stethoscope size={16} />
                Browse doctors
              </Link>
              <Link href="/auth" className="btn-secondary px-5 py-2.5 text-center">
                Sign in to manage bookings
              </Link>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.length > 1 && (
              <p className="text-sm text-on-surface-variant text-center">
                Found {results.length} appointments
              </p>
            )}
            {results.map((result) => (
              <AppointmentResultCard key={result.id} result={result} />
            ))}
            <Link
              href="/auth"
              className="btn-secondary w-full py-2.5 text-center block"
            >
              Create account to manage bookings
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
