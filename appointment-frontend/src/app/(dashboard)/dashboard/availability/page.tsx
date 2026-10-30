'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarClock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { availabilityService } from '@/services/availability.service';
import { getStoredToken } from '@/hooks/use-auth';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface AvailabilityRecord {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMins: number;
}

const inputCls =
  'w-full rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary';

export default function AvailabilityManagerPage() {
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState('30');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadAvailability = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await availabilityService.get(token);
        if (data && Array.isArray(data) && data.length > 0) {
          const first = data[0] as AvailabilityRecord;
          setStartTime(first.startTime);
          setEndTime(first.endTime);
          setSlotDuration(first.slotMins.toString());

          const daysWithAvailability = data.map(
            (record: AvailabilityRecord) => DAYS[record.dayOfWeek],
          );
          setSelectedDays(daysWithAvailability);
        }
      } catch (err) {
        console.error('Failed to load availability:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, []);

  const handleSave = async () => {
    const token = getStoredToken();
    if (!token) {
      setMessage('Please login as doctor');
      return;
    }

    if (selectedDays.length === 0) {
      setMessage('Please select at least one working day');
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const deleteResult = await availabilityService.deleteAll(token);
      void deleteResult;

      for (const day of selectedDays) {
        const dayOfWeek = DAYS.indexOf(day);
        await availabilityService.create(token, {
          dayOfWeek,
          startTime,
          endTime,
          slotMins: Number(slotDuration),
        });
      }
      setMessage('Availability updated successfully! Slots will be refreshed.');

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Error:', err);
      setMessage((err as Error).message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary">
          <CalendarClock className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Availability Manager
          </h1>
          <p className="text-on-surface-variant">
            Define your working days, hours, and slot durations for appointments.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-lowest">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-on-surface">
              Working Days
            </h2>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selectedDays.includes(day)
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-3 font-display text-lg font-semibold text-on-surface">
                Working Hours
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <span className="mt-5 text-on-surface-variant">to</span>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-3 font-display text-lg font-semibold text-on-surface">
                Slot Duration
              </h2>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Duration (minutes)
                </label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  className={inputCls}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
            {message && (
              <div
                className={`flex-1 rounded-2xl p-3 text-sm ${
                  message.toLowerCase().includes('fail') ||
                  message.toLowerCase().includes('error') ||
                  message.toLowerCase().includes('please')
                    ? 'border border-error/20 bg-error/10 text-error'
                    : 'border border-primary/20 bg-primary/10 text-primary'
                }`}
              >
                {message}
              </div>
            )}
            <Button onClick={handleSave} loading={saving} disabled={saving}>
              Save Availability
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
