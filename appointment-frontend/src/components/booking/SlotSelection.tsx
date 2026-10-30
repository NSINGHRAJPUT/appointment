'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { doctorService } from '@/services/doctor.service';

type Slot = { startAt: string; endAt: string };

function fmtSlot(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SlotSelection({
  doctorId,
  onSelect,
  onBack,
  backLabel = 'Back',
}: {
  doctorId: string;
  onSelect: (slotStartAt: string, slotEndAt?: string) => void;
  onBack: () => void;
  backLabel?: string;
}) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    doctorService
      .nextSlots(doctorId, undefined, 12)
      .then((data: Slot[] | unknown) => {
        setSlots(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setError('Failed to load available slots.');
        setSlots([]);
      })
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-on-surface-variant">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading slots...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-on-surface-variant">
        Choose an available time for your consultation.
      </p>

      {error && (
        <div className="rounded-xl border border-error/25 bg-error-container/50 p-3 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {slots.length === 0 && !error ? (
        <p className="py-6 text-center text-sm text-on-surface-variant">
          No slots available. Please try another veterinarian.
        </p>
      ) : (
        <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {slots.map((slot) => (
            <button
              key={slot.startAt}
              type="button"
              onClick={() => setSelectedSlot(slot)}
              className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                selectedSlot?.startAt === slot.startAt
                  ? 'border-primary bg-primary text-on-primary shadow-md'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              {fmtSlot(slot.startAt)}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          {backLabel}
        </Button>
        <Button
          onClick={() =>
            selectedSlot && onSelect(selectedSlot.startAt, selectedSlot.endAt)
          }
          disabled={!selectedSlot}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
