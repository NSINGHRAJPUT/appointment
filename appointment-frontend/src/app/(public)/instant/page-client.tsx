'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Star, Check, Zap } from 'lucide-react';
import { doctorService } from '@/services/doctor.service';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

type Doctor = {
  id: string;
  specialization: string | null;
  priceCents: number;
  responseTimeMins: number | null;
  ratingAvg: number | null;
  reviewCount: number;
  nextAvailableSlotAt: string | null;
  photoUrl?: string | null;
  user: { fullName: string; whatsappNumber?: string };
};

function fmtPrice(cents: number) {
  return cents === 0 ? 'Free' : `₹${(cents / 100).toFixed(0)}`;
}

function InstantConsultPageContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('doctorId');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    doctorService
      .instantAvailable()
      .then((data: any) => {
        const list: Doctor[] = Array.isArray(data) ? data : [];
        setDoctors(list);
        if (preselectedId) {
          const pre = list.find((d) => d.id === preselectedId);
          if (pre) {
            setSelected(pre);
            setBookingOpen(true);
          }
        }
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [preselectedId]);

  return (
    <>
      <BookingWizard
        open={bookingOpen && Boolean(selected)}
        onClose={() => setBookingOpen(false)}
        isInstant
        doctor={
          selected
            ? {
                id: selected.id,
                fullName: selected.user.fullName,
                specialization: selected.specialization,
                priceCents: selected.priceCents,
              }
            : null
        }
      />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Zap size={14} /> Instant consult
          </div>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Vets available right now
          </h1>
          <p className="mt-2 max-w-xl mx-auto text-on-surface-variant">
            Book the soonest open slot with an online demo veterinarian — you&apos;ll
            connect around that time for a video consult.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        )}

        {!loading && doctors.length === 0 && (
          <EmptyState
            icon={<Zap size={24} />}
            title="No vets online right now"
            description="You can still book a scheduled visit with any demo veterinarian on PawCare."
            actionLabel="Browse all vets"
            href="/doctors"
          />
        )}

        {!loading && doctors.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {doctors.map((doc) => {
              const active = selected?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setSelected(doc);
                    setBookingOpen(true);
                  }}
                  className={`rounded-2xl border p-5 text-left transition-all ${
                    active
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-outline-variant bg-surface-container-lowest hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={doc.user.fullName}
                      src={doc.photoUrl}
                      size={48}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-on-surface">
                          {doc.user.fullName}
                        </p>
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-primary"
                          title="Online"
                        />
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {doc.specialization ?? 'General Practice'}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        {doc.ratingAvg !== null && (
                          <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                            <Star
                              size={10}
                              className="fill-amber-400 text-amber-400"
                            />
                            {doc.ratingAvg.toFixed(1)} ({doc.reviewCount})
                          </span>
                        )}
                        <span className="text-xs font-medium text-primary">
                          {fmtPrice(doc.priceCents)}
                        </span>
                        {doc.responseTimeMins && (
                          <span className="text-xs text-on-surface-variant">
                            ~{doc.responseTimeMins}m
                          </span>
                        )}
                      </div>
                    </div>
                    {active && <Check size={16} className="shrink-0 text-primary" />}
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary">
                      <Zap size={12} /> Book next slot
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && doctors.length > 0 && (
          <div className="mt-10 text-center">
            <p className="mb-3 text-sm text-on-surface-variant">
              Prefer a scheduled visit?
            </p>
            <Link href="/doctors">
              <Button variant="outline">Browse all veterinarians</Button>
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

export default function InstantConsultPageInner() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      }
    >
      <InstantConsultPageContent />
    </Suspense>
  );
}
