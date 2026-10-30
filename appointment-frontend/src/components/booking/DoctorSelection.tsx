'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { Loader2 } from 'lucide-react';
import { doctorService } from '@/services/doctor.service';

type DoctorListItem = {
  id: string;
  specialization: string | null;
  priceCents: number;
  photoUrl?: string | null;
  user: { fullName: string };
};

function fmtPrice(cents: number) {
  return cents === 0 ? 'Free' : `₹${(cents / 100).toFixed(0)}`;
}

export function DoctorSelection({
  onSelect,
}: {
  onSelect: (doctorId: string) => void;
}) {
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ limit: '12', page: '1' });
    doctorService
      .list(params)
      .then((data) => {
        const list = data as { items?: DoctorListItem[] };
        setDoctors(list.items ?? []);
      })
      .catch(() => {
        setError('Failed to load veterinarians. Please try again.');
        setDoctors([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-on-surface-variant">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading veterinarians...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-on-surface-variant">
        Select a demo veterinarian to book your appointment.
      </p>

      {error && (
        <div className="rounded-xl border border-error/25 bg-error-container/50 p-3 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {doctors.length === 0 && !error ? (
        <p className="py-6 text-center text-sm text-on-surface-variant">
          No veterinarians available right now.
        </p>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {doctors.map((doctor) => (
            <button
              key={doctor.id}
              type="button"
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                selectedId === doctor.id
                  ? 'border-primary bg-primary-container'
                  : 'border-outline-variant hover:border-primary/50'
              }`}
              onClick={() => setSelectedId(doctor.id)}
            >
              <Avatar
                src={doctor.photoUrl}
                name={doctor.user.fullName}
                alt={doctor.user.fullName}
                size={40}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-on-surface">
                  {doctor.user.fullName}
                </div>
                <div className="text-xs text-on-surface-variant">
                  {doctor.specialization ?? 'General Practice'} ·{' '}
                  {fmtPrice(doctor.priceCents)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={() => selectedId && onSelect(selectedId)} disabled={!selectedId}>
          Continue
        </Button>
      </div>
    </div>
  );
}
