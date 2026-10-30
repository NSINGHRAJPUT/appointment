'use client';

import Link from 'next/link';
import {
  Check,
  Clock,
  CalendarDays,
  MapPin,
  Star,
  Video,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export type DoctorCardModel = {
  id: string;
  specialization: string | null;
  priceCents: number;
  city?: string | null;
  country?: string | null;
  onlineConsultation?: boolean;
  ratingAvg: number | null;
  reviewCount: number;
  nextAvailableSlotAt: string | null;
  photoUrl?: string | null;
  user: { fullName: string };
};

function fmtPrice(cents: number) {
  return cents === 0 ? 'Free' : `₹${(cents / 100).toFixed(0)}`;
}

function fmtSlot(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffMins = Math.round((d.getTime() - now.getTime()) / 60000);
  if (diffMins <= 0) return 'Available now';
  if (diffMins < 60) return `In ${diffMins} min`;
  const today = now.toDateString() === d.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (today)
    return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (d.toDateString() === tomorrow.toDateString())
    return `Tomorrow ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function isSoon(iso: string | null) {
  if (!iso) return false;
  return new Date(iso).getTime() - Date.now() < 4 * 60 * 60 * 1000;
}

export function DoctorCard({
  doc,
  onBook,
}: {
  doc: DoctorCardModel;
  onBook: (d: DoctorCardModel) => void;
}) {
  const slot = fmtSlot(doc.nextAvailableSlotAt);
  const soon = isSoon(doc.nextAvailableSlotAt);

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg">
      <div className="flex gap-4">
        <Avatar
          name={doc.user.fullName}
          src={doc.photoUrl}
          size={56}
          className="rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/doctors/${doc.id}`}
            className="inline-flex items-center gap-1.5 font-semibold text-sm text-on-surface leading-snug hover:text-primary"
          >
            {doc.user.fullName}
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-on-primary shrink-0">
              <Check size={9} strokeWidth={3} />
            </span>
          </Link>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {doc.specialization ?? 'General Practice'}
            {doc.onlineConsultation && (
              <span className="ml-2 inline-flex items-center gap-0.5 text-primary">
                <Video size={10} /> Online
              </span>
            )}
          </p>
          {doc.city && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-on-surface-variant">
              <MapPin size={12} />
              {doc.city}
              {doc.country ? `, ${doc.country}` : ''}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            {doc.ratingAvg !== null ? (
              <>
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-on-surface">
                  {doc.ratingAvg.toFixed(1)}
                </span>
                <span className="text-xs text-on-surface-variant">
                  ({doc.reviewCount})
                </span>
              </>
            ) : (
              <span className="text-xs text-on-surface-variant">No reviews yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-y border-outline-variant py-3">
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            Fee
          </p>
          <p className="text-base font-bold leading-none text-on-surface">
            {fmtPrice(doc.priceCents)}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            Next available
          </p>
          {slot ? (
            <div
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                soon
                  ? 'border-primary/20 bg-primary-container text-primary'
                  : 'border-outline-variant bg-surface-container text-on-surface-variant'
              }`}
            >
              {soon ? <Clock size={10} /> : <CalendarDays size={10} />}
              {slot}
            </div>
          ) : (
            <span className="text-xs text-on-surface-variant">Unavailable</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/doctors/${doc.id}`}
          className="inline-flex flex-1 items-center justify-center rounded-full border-2 border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/40 hover:text-primary"
        >
          View profile
        </Link>
        <Button className="flex-1" onClick={() => onBook(doc)}>
          Book
        </Button>
      </div>
    </article>
  );
}
