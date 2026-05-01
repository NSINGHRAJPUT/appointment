'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityManagerPage() {
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState('30');

  const handleSave = () => {
    // In a real app, send this to the backend
    console.log('Saved availability:', { selectedDays, startTime, endTime, slotDuration });
    alert('Availability saved successfully!');
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Availability Manager</h1>
        <p className="text-zinc-500">Define your working days, hours, and slot durations for appointments.</p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-3">Working Days</h2>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedDays.includes(day)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:border-blue-500 hover:text-blue-600'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-3">Working Hours</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1">Start Time</label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-zinc-300 rounded-md p-2 text-sm"
                />
              </div>
              <span className="text-zinc-500 mt-5">to</span>
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1">End Time</label>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border border-zinc-300 rounded-md p-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-3">Slot Duration</h2>
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 mb-1">Duration (minutes)</label>
              <select 
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="w-full border border-zinc-300 rounded-md p-2 text-sm bg-white"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-zinc-100">
          <Button onClick={handleSave}>Save Availability</Button>
        </div>
      </Card>
    </div>
  );
}
