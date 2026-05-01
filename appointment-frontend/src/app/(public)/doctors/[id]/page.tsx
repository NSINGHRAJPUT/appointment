'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Star, MapPin, Check, X, CalendarDays } from 'lucide-react';
import { doctorService } from '@/services/doctor.service';
import { appointmentService } from '@/services/appointment.service';
import { otpService } from '@/services/otp.service';
import { getStoredToken } from '@/hooks/use-auth';
import { waLink } from '@/lib/api';

type Slot = { startAt: string; endAt: string };
type Doctor = {
  id: string;
  bio: string | null;
  specialization: string | null;
  priceCents: number;
  currency: string;
  yearsOfExperience: number | null;
  clinicName: string | null;
  clinicAddress: string | null;
  city: string | null;
  country: string | null;
  degree: string | null;
  university: string | null;
  ratingAvg: number | null;
  reviewCount: number;
  nextAvailableSlotAt: string | null;
  responseTimeMins: number | null;
  user: { fullName: string; whatsappNumber?: string };
  reviews: Array<{ id: string; rating: number; comment: string | null; createdAt: string; author: { fullName: string } }>;
};

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function fmtPrice(cents: number, currency: string) {
  return cents === 0 ? 'Free' : `${currency === 'INR' ? '₹' : '$'}${(cents / 100).toFixed(0)}`;
}

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    doctorService.getById(id as string)
      .then((data: any) => setDoctor(data))
      .catch(() => setDoctor(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );

  if (!doctor) return (
    <div className="max-w-lg mx-auto p-6 text-center">
      <p className="text-on-surface-variant">Doctor not found.</p>
      <a href="/doctors" className="mt-4 inline-block text-primary hover:underline">← Back to Doctors</a>
    </div>
  );

  const waUrl = waLink(doctor.user.whatsappNumber);

  return (
    <>
      {showBooking && <BookModal doctor={doctor} onClose={() => setShowBooking(false)} />}

      <main className="max-w-container-max mx-auto px-margin py-margin w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left column */}
          <div className="lg:col-span-8 flex flex-col gap-margin">
            {/* Header */}
            <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col sm:flex-row items-start sm:items-center gap-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-4xl border-4 border-surface-container-lowest shadow-sm shrink-0">
                {initials(doctor.user.fullName)}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-h1 text-h1 text-on-surface">{doctor.user.fullName}</h1>
                  <span className="bg-primary/10 text-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={11} strokeWidth={3} /> Verified
                  </span>
                </div>
                <p className="font-body-lg text-body-lg text-primary font-medium mb-3">
                  {doctor.specialization ?? 'General Practice'}
                  {doctor.degree && ` · ${doctor.degree}`}
                </p>
                <div className="flex flex-wrap gap-4 text-on-surface-variant font-body-md text-body-md">
                  {doctor.clinicName && (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">business</span>
                      {doctor.clinicName}
                    </div>
                  )}
                  {doctor.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} />
                      {doctor.city}{doctor.country ? `, ${doctor.country}` : ''}
                    </div>
                  )}
                  {doctor.ratingAvg !== null && (
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-on-surface">{doctor.ratingAvg.toFixed(1)}</span>
                      <span className="text-on-surface-variant">({doctor.reviewCount} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-sm">
              {[
                { value: doctor.yearsOfExperience ? `${doctor.yearsOfExperience}+` : '—', label: 'Years Exp.' },
                { value: doctor.ratingAvg ? doctor.ratingAvg.toFixed(1) : '—', label: 'Rating' },
                { value: doctor.responseTimeMins ? `~${doctor.responseTimeMins}m` : '—', label: 'Response' },
                { value: doctor.reviewCount.toString(), label: 'Reviews' },
              ].map(stat => (
                <div key={stat.label} className="bg-surface-container-low rounded-lg p-md flex flex-col items-center justify-center text-center border border-outline-variant/30">
                  <span className="font-h2 text-h2 text-on-surface mb-1">{stat.value}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </section>

            {/* About */}
            {doctor.bio && (
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
                <h2 className="font-h2 text-h2 text-on-surface mb-md">About</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant">{doctor.bio}</p>
                {(doctor.degree || doctor.university) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {doctor.degree && (
                      <span className="bg-surface-container px-3 py-1.5 rounded-full font-label-sm text-label-sm text-on-surface-variant border border-outline-variant/50">
                        {doctor.degree}
                      </span>
                    )}
                    {doctor.university && (
                      <span className="bg-surface-container px-3 py-1.5 rounded-full font-label-sm text-label-sm text-on-surface-variant border border-outline-variant/50">
                        {doctor.university}
                      </span>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Reviews */}
            {doctor.reviews.length > 0 && (
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
                <h2 className="font-h2 text-h2 text-on-surface mb-md">Patient Reviews</h2>
                <div className="space-y-4">
                  {doctor.reviews.slice(0, 5).map(r => (
                    <div key={r.id} className="border-b border-outline-variant/50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} size={12} className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-outline-variant'} />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-on-surface">{r.author.fullName}</span>
                        <span className="text-xs text-on-surface-variant ml-auto">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {r.comment && <p className="text-sm text-on-surface-variant">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right column — sticky CTA */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-24 flex flex-col gap-sm">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/30">
                  <span className="font-body-md text-body-md text-on-surface-variant">Consultation Fee</span>
                  <span className="font-h2 text-h2 text-on-surface">{fmtPrice(doctor.priceCents, doctor.currency)}</span>
                </div>
                <button
                  onClick={() => setShowBooking(true)}
                  className="w-full bg-primary hover:opacity-90 text-on-primary font-body-lg text-body-lg font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm mb-4 active:scale-[0.98]"
                >
                  <CalendarDays size={18} /> Book Appointment
                </button>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowBooking(true)}
                    className="w-full bg-surface hover:bg-surface-container-low text-on-surface border border-outline-variant font-body-md text-body-md font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-[20px]">chat</span>
                    Start Chat
                    {doctor.responseTimeMins && (
                      <span className="ml-auto text-on-surface-variant text-label-sm font-normal">~{doctor.responseTimeMins}m</span>
                    )}
                  </button>
                  {waUrl && (
                    <a href={waUrl} target="_blank" rel="noopener noreferrer"
                      className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#075E54] border border-[#25D366]/30 font-body-md text-body-md font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-[#25D366] text-[20px]">forum</span>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-full" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">End-to-end encrypted sessions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// ── Inline BookModal (same logic as doctors listing) ──────────────────────────
function BookModal({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    setIsGuest(!getStoredToken());
    doctorService.nextSlots(doctor.id, undefined, 12)
      .then((data: any) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [doctor.id]);

  async function handleSendOtp() {
    const target = guestPhone.trim() || guestEmail.trim();
    if (!target) { setError('Enter phone or email'); return; }
    setSendingOtp(true); setError(null);
    try {
      await otpService.send(target, guestPhone.trim() ? 'PHONE' : 'EMAIL');
      setOtpSent(true);
    } catch (e) { setError((e as Error).message); }
    finally { setSendingOtp(false); }
  }

  async function handleBook() {
    if (!selected) return;
    setBooking(true); setError(null);
    try {
      const token = getStoredToken();
      if (token) {
        await appointmentService.book(token, { doctorId: doctor.id, startAt: selected.startAt, endAt: selected.endAt, reason: reason.trim() || undefined });
      } else {
        if (!guestName.trim()) { setError('Name is required'); setBooking(false); return; }
        if (otpCode.length !== 6) { setError('Enter the 6-digit OTP'); setBooking(false); return; }
        const target = guestPhone.trim() || guestEmail.trim();
        await appointmentService.bookAsGuest({
          doctorId: doctor.id, startAt: selected.startAt, endAt: selected.endAt,
          patientName: guestName.trim(), patientPhone: guestPhone.trim(),
          patientEmail: guestEmail.trim() || undefined,
          otpCode, otpTarget: target, otpType: guestPhone.trim() ? 'PHONE' : 'EMAIL',
          reason: reason.trim() || undefined,
        });
      }
      setSuccess(true);
    } catch (e) { setError((e as Error).message); }
    finally { setBooking(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <div>
            <h2 className="font-h3 text-h3 text-on-surface">Book Appointment</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">{doctor.user.fullName} · {doctor.specialization ?? 'General'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-5">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Check size={28} strokeWidth={2.5} /></div>
              <p className="font-h3 text-h3 text-on-surface">Appointment Requested!</p>
              <a href="/dashboard" className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm hover:opacity-90 transition-all text-center">View in Dashboard</a>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                <span className="text-sm text-on-surface-variant">Consultation Fee</span>
                <span className="font-semibold text-on-surface">{fmtPrice(doctor.priceCents, doctor.currency)}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Available Slots</p>
                {loadingSlots ? (
                  <div className="flex items-center justify-center h-20"><Loader2 size={20} className="animate-spin text-primary" /></div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-4">No slots available in the next 30 days.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot, i) => {
                      const d = new Date(slot.startAt);
                      const isSel = selected?.startAt === slot.startAt;
                      return (
                        <button key={i} onClick={() => setSelected(slot)}
                          className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all ${isSel ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface hover:border-primary hover:bg-primary/5'}`}>
                          <div className="font-semibold">{d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                          <div className="opacity-80">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (optional)…" rows={2}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
              {isGuest && (
                <div className="space-y-3 rounded-xl border border-outline-variant p-4 bg-surface-container-low">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Book as Guest</p>
                  <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Full name *"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="Phone (for OTP)"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="Email (optional)"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  {!otpSent ? (
                    <button onClick={handleSendOtp} disabled={sendingOtp}
                      className="w-full py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20 hover:bg-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
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
              <button disabled={!selected || booking || (isGuest && !otpSent)} onClick={handleBook}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {booking ? <Loader2 size={16} className="animate-spin" /> : <CalendarDays size={16} />}
                {booking ? 'Booking…' : selected ? `Confirm — ${new Date(selected.startAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Select a slot'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
