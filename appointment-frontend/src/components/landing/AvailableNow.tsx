'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { doctorService } from '@/services/doctor.service';

type Doctor = {
  id: string;
  specialization: string | null;
  priceCents: number;
  responseTimeMins: number | null;
  ratingAvg: number | null;
  reviewCount: number;
  user: { fullName: string };
};

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function AvailableNow() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    doctorService.instantAvailable()
      .then((data: any) => setDoctors(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setDoctors([]));
  }, []);

  // Fall back to static placeholders while loading or if no online doctors
  const items = doctors.length > 0 ? doctors : null;

  return (
    <section className="bg-surface border-y border-surface-variant py-25">
      <div className="max-w-container-max mx-auto px-margin">
        <div className="flex items-center gap-sm mb-xl">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <h2 className="font-h2 text-h2 text-on-surface">Available Now</h2>
          <span className="ml-2 text-xs text-on-surface-variant">
            {items ? `${items.length} doctor${items.length !== 1 ? 's' : ''} online` : 'Loading…'}
          </span>
        </div>

        {items ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {items.map(doc => (
              <div key={doc.id} className="bg-surface-container-lowest border border-surface-variant rounded-xl p-lg flex flex-col relative transition-all shadow-level-2">
                {doc.ratingAvg !== null && (
                  <div className="absolute top-lg right-lg bg-surface-container-high text-on-surface-variant font-label-xs text-label-xs px-sm py-xs rounded-full flex items-center gap-1">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {doc.ratingAvg.toFixed(1)} ({doc.reviewCount})
                  </div>
                )}
                <div className="flex items-center gap-md mb-md">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                    {initials(doc.user.fullName)}
                  </div>
                  <div>
                    <h3 className="font-h3 text-h3 text-on-surface">{doc.user.fullName}</h3>
                    <p className="font-body-md text-body-md text-secondary">{doc.specialization ?? 'General Practice'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-lg">
                  <span className="bg-primary-container/10 text-primary font-label-xs text-label-xs uppercase px-sm py-xs rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">verified</span> Online
                  </span>
                  {doc.responseTimeMins && (
                    <span className="bg-surface-container text-secondary font-label-xs text-label-xs uppercase px-sm py-xs rounded-full">
                      ~{doc.responseTimeMins}m response
                    </span>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/instant?doctorId=${doc.id}`)}
                  className="w-full bg-primary text-on-primary font-label-sm text-label-sm py-md rounded-lg hover:opacity-90 transition-colors mt-auto text-center"
                >
                  Consult Now
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-on-surface-variant">
            <p className="text-sm">No doctors online right now.</p>
            <a href="/doctors" className="mt-2 inline-block text-primary text-sm hover:underline">Browse all doctors →</a>
          </div>
        )}

        {items && (
          <div className="mt-8 text-center">
            <a href="/instant" className="inline-flex items-center gap-2 text-primary font-label-sm text-label-sm hover:underline">
              See all available doctors →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
