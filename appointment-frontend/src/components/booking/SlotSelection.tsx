'use client';

import { useState } from 'react';
import { Button } from '../ui/button';

const MOCK_SLOTS = [
  { time: '09:00 AM', available: true },
  { time: '09:30 AM', available: false },
  { time: '10:00 AM', available: true },
  { time: '10:30 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '11:30 AM', available: false },
  { time: '02:00 PM', available: true },
  { time: '02:30 PM', available: true },
];

export function SlotSelection({ onSelect, onBack }: { onSelect: (slot: string) => void, onBack: () => void }) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedSlot) {
      onSelect(selectedSlot);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-500 mb-4">
        Choose an available time slot for your consultation today.
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {MOCK_SLOTS.map((slot) => (
          <button
            key={slot.time}
            disabled={!slot.available}
            onClick={() => setSelectedSlot(slot.time)}
            className={`py-2 px-3 text-sm rounded-md border transition-all ${
              !slot.available 
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed' 
                : selectedSlot === slot.time
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-zinc-700 border-zinc-300 hover:border-blue-500 hover:text-blue-600'
            }`}
          >
            {slot.time}
          </button>
        ))}
      </div>

      <div className="pt-4 flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleContinue} disabled={!selectedSlot}>
          Continue
        </Button>
      </div>
    </div>
  );
}
