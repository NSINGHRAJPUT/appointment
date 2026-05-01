'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Star, Check, X, Zap } from 'lucide-react';
import { doctorService } from '@/services/doctor.service';
import { appointmentService } from '@/services/appointment.service';
import { otpService } from '@/services/otp.service';
import { getStoredToken } from '@/hooks/use-auth';

type Doctor = {
  id: string;
  specialization: string | null;
  priceCents: number;
  responseTimeMins: number | null;
  ratingAvg: number | null;
  reviewCount: number;
  nextAvailableSlotAt: string | null;
  user: { fullName: string; whatsappNumber?: string };
};

type Slot = { startAt: string; endAt: string };

function fmtPrice(cents: number) {
  return cents === 0 ? 'Free' : `₹${(cents / 100).toFixed(0)}`;
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function InstantConsultPage() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('doctorId');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Doctor | null>(null);

  // Booking state
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [chosenSlot, setChosenSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState('');

  // Guest / OTP state
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setIsGuest(!getStoredToken());
    doctorService.instantAvailable()
      .then((data: any) => {
        const list: Doctor[] = Array.isArray(data) ? data : [];
        setDoctors(list);
        if (preselectedId) {
          const pre = list.find(d => d.id === preselectedId);
          if (pre) selectDoctor(pre);
        }
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [preselectedId]);

  function selectDoctor(doc: Doctor) {
    setSelected(doc);
    setChosenSlot(null);
    setError(null);
    setLoadingSlots(true);
    doctorService.nextSlots(doc.id, undefined, 6)
      .then((data: any) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }

  async function handleSendOtp() {
    const target = guestPhone.trim() || guestEmail.trim();
    if (!target) { setError('Enter phone or email to receive OTP'); return; }
    setSendingOtp(true); setError(null);
    try {
      await otpService.send(target, guestPhone.trim() ? 'PHONE' : 'EMAIL');
      setOtpSent(true);
    } catch (e) { setError((e as Error).message); }
    finally { setSendingOtp(false); }
  }

  async function handleBook() {
    if (!selected || !chosenSlot) return;
    setBooking(true); setError(null);
    try {
      const token = getStoredToken();
      if (token) {
        await appointmentService.book(token, {
          doctorId: selected.id,
          startAt: chosenSlot.startAt,
          endAt: chosenSlot.endAt,
          reason: reason.trim() || undefined,
        });
      } else {
        if (!guestName.trim()) { setError('Name is required'); setBooking(false); return; }
        if (otpCode.length !== 6) { setError('Enter the 6-digit OTP'); setBooking(false); return; }
        const target = guestPhone.trim() || guestEmail.trim();
        await appointmentService.bookAsGuest({
          doctorId: selected.id,
          startAt: chosenSlot.startAt,
          endAt: chosenSlot.endAt,
          patientName: guestName.trim(),
          patientPhone: guestPhone.trim(),
          patientEmail: guestEmail.trim() || undefined,
          otpCode,
          otpTarget: target,
          otpType: guestPhone.trim() ? 'PHONE' : 'EMAIL',
          reason: reason.trim() || undefined,
          isInstant: true,
        });
      }
      setSuccess(true);
    } catch (e) { setError((e as Error).message); }
    finally { setBooking(false); }
  }

  if (success) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check size={36} className="text-primary" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Consultation Booked!</h1>
          <p className="text-on-surface-variant">
            Your appointment with <strong>{selected?.user.fullName}</strong> is confirmed.
            {chosenSlot && (
              <> Scheduled for {new Date(chosenSlot.startAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.</>
            )}
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <a href="/dashboard" className="w-full py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:opacity-90 transition-all text-center">
              View in Dashboard
            </a>
            <a href="/auth" className="w-full py-3 rounded-xl border border-outline-variant text-on-surface font-medium text-sm hover:bg-surface-container transition-all text-center">
              Create account to manage appointments
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-3">
          <Zap size={14} /> Instant Consult
        </div>
        <h1 className="text-3xl font-bold text-on-surface">Doctors Available Right Now</h1>
        <p className="text-on-surface-variant mt-2">No appointment needed — connect instantly with an online doctor.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Doctor list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
            {loading ? 'Finding doctors…' : `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''} online`}
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          )}

          {!loading && doctors.length === 0 && (
            <div className="text-center py-12 border border-outline-variant rounded-2xl">
              <p className="text-on-surface-variant text-sm">No doctors are online right now.</p>
              <a href="/doctors" className="mt-3 inline-block text-primary text-sm hover:underline">Browse all doctors →</a>
            </div>
          )}

          {doctors.map(doc => (
            <button
              key={doc.id}
              onClick={() => selectDoctor(doc)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${selected?.id === doc.id ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/40 bg-surface-container-lowest'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
                  {initials(doc.user.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-on-surface truncate">{doc.user.fullName}</p>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
                  </div>
                  <p className="text-xs text-on-surface-variant">{doc.specialization ?? 'General Practice'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {doc.ratingAvg !== null && (
                      <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        {doc.ratingAvg.toFixed(1)} ({doc.reviewCount})
                      </span>
                    )}
                    <span className="text-xs font-medium text-primary">{fmtPrice(doc.priceCents)}</span>
                    {doc.responseTimeMins && (
                      <span className="text-xs text-on-surface-variant">~{doc.responseTimeMins}m</span>
                    )}
                  </div>
                </div>
                {selected?.id === doc.id && <Check size={16} className="text-primary shrink-0" />}
              </div>
            </button>
          ))}
        </div>

        {/* Booking panel */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-5 h-fit sticky top-24">
          {!selected ? (
            <div className="text-center py-10 text-on-surface-variant">
              <Zap size={28} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a doctor to book instantly</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 pb-4 border-b border-outline-variant">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                  {initials(selected.user.fullName)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-on-surface">{selected.user.fullName}</p>
                  <p className="text-xs text-on-surface-variant">{selected.specialization ?? 'General Practice'} · {fmtPrice(selected.priceCents)}</p>
                </div>
              </div>

              {/* Slot picker */}
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Select Slot</p>
                {loadingSlots ? (
                  <div className="flex items-center justify-center h-16"><Loader2 size={18} className="animate-spin text-primary" /></div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No slots available.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot, i) => {
                      const d = new Date(slot.startAt);
                      const isChosen = chosenSlot?.startAt === slot.startAt;
                      return (
                        <button key={i} onClick={() => setChosenSlot(slot)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${isChosen ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface hover:border-primary hover:bg-primary/5'}`}>
                          <div className="font-semibold">{d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                          <div className="opacity-80">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reason */}
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Describe your concern (optional)…"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />

              {/* Guest fields */}
              {isGuest && (
                <div className="space-y-3 rounded-xl border border-outline-variant p-4 bg-surface-container-low">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Your Details</p>
                  <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Full name *"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="Phone number (for OTP)"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="Email (optional)"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  {!otpSent ? (
                    <button onClick={handleSendOtp} disabled={sendingOtp}
                      className="w-full py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {sendingOtp && <Loader2 size={14} className="animate-spin" />}
                      {sendingOtp ? 'Sending…' : 'Send OTP'}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-on-surface-variant">OTP sent — check your phone/email</p>
                      <input value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit OTP" maxLength={6}
                        className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                      <button onClick={handleSendOtp} disabled={sendingOtp} className="text-xs text-primary hover:underline">Resend OTP</button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
                  <X size={14} className="shrink-0" />{error}
                </div>
              )}

              <button
                disabled={!chosenSlot || booking || (isGuest && !otpSent)}
                onClick={handleBook}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {booking ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {booking ? 'Booking…' : 'Confirm Instant Consult'}
              </button>

              <p className="text-xs text-center text-on-surface-variant">
                Already have an account?{' '}
                <a href="/auth" className="text-primary hover:underline">Sign in</a> to auto-fill your details.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
