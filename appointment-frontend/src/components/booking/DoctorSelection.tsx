'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Avatar } from '../ui/avatar';

// Dummy data for doctors
const MOCK_DOCTORS = [
  { id: '1', name: 'Dr. Sarah Smith', specialization: 'General Physician', available: true },
  { id: '2', name: 'Dr. John Doe', specialization: 'Cardiologist', available: true },
  { id: '3', name: 'Dr. Emily Chen', specialization: 'Dermatologist', available: false },
];

export function DoctorSelection({ onSelect }: { onSelect: (doctorId: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-500 mb-4">
        Select a doctor from our recommendations or choose the best available.
      </div>
      
      <div className="space-y-3">
        {MOCK_DOCTORS.map((doctor) => (
          <div 
            key={doctor.id} 
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedId === doctor.id ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-blue-300'}`}
            onClick={() => doctor.available && setSelectedId(doctor.id)}
          >
            <div className="flex items-center gap-3">
              <Avatar src="" name={doctor.name.charAt(4)} alt={doctor.name} />
              <div className="flex-1">
                <div className="font-medium text-zinc-900 flex items-center gap-2">
                  {doctor.name}
                  {!doctor.available && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Offline</span>}
                </div>
                <div className="text-xs text-zinc-500">{doctor.specialization}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleContinue} disabled={!selectedId}>
          Continue
        </Button>
      </div>
    </div>
  );
}
