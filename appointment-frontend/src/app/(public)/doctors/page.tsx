"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Star,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  CalendarDays,
  SlidersHorizontal,
  X,
  Loader2,
} from "lucide-react";
import { doctorService } from "@/services/doctor.service";
import { appointmentService } from "@/services/appointment.service";
import { otpService } from "@/services/otp.service";
import { getStoredToken } from "@/hooks/use-auth";

// ── Types ──────────────────────────────────────────────────────────────────
type Slot = { startAt: string; endAt: string };

interface Doctor {
  id: string;
  specialization: string | null;
  priceCents: number;
  city: string | null;
  country: string | null;
  onlineConsultation: boolean;
  yearsOfExperience: number | null;
  ratingAvg: number | null;
  reviewCount: number;
  nextAvailableSlotAt: string | null;
  user: { id: string; fullName: string; whatsappNumber?: string };
}

const SPECIALTIES = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Psychiatry",
  "Orthopedics",
  "Gastroenterology",
  "Urology",
  "Oncology",
  "Endocrinology",
  "Ophthalmology",
  "ENT",
];
const ITEMS_PER_PAGE = 12;

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtPrice(cents: number) {
  return cents === 0 ? "Free" : `₹${(cents / 100).toFixed(0)}`;
}
function fmtSlot(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins <= 0) return "Available now";
  if (diffMins < 60) return `In ${diffMins} min`;
  const today = now.toDateString() === d.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (today)
    return `Today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (d.toDateString() === tomorrow.toDateString())
    return `Tomorrow ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
function isSoon(iso: string | null) {
  if (!iso) return false;
  return new Date(iso).getTime() - Date.now() < 4 * 60 * 60 * 1000;
}
function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Book Modal ─────────────────────────────────────────────────────────────
function BookModal({
  doctor,
  onClose,
}: {
  doctor: Doctor;
  onClose: () => void;
}) {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Guest OTP state
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    setIsGuest(!getStoredToken());
    doctorService
      .nextSlots(doctor.id, undefined, 12)
      .then((data: any) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [doctor.id]);

  async function handleSendOtp() {
    const target = guestPhone.trim() || guestEmail.trim();
    if (!target) {
      setError("Enter phone or email to receive OTP");
      return;
    }
    setSendingOtp(true);
    setError(null);
    try {
      await otpService.send(target, guestPhone.trim() ? "PHONE" : "EMAIL");
      setOtpSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleBook() {
    if (!selected) return;
    setBooking(true);
    setError(null);
    try {
      const token = getStoredToken();
      if (token) {
        await appointmentService.book(token, {
          doctorId: doctor.id,
          startAt: selected.startAt,
          endAt: selected.endAt,
          reason: reason.trim() || undefined,
        });
      } else {
        if (!guestName.trim()) {
          setError("Name is required");
          setBooking(false);
          return;
        }
        if (otpCode.length !== 6) {
          setError("Enter the 6-digit OTP");
          setBooking(false);
          return;
        }
        const target = guestPhone.trim() || guestEmail.trim();
        await appointmentService.bookAsGuest({
          doctorId: doctor.id,
          startAt: selected.startAt,
          endAt: selected.endAt,
          patientName: guestName.trim(),
          patientPhone: guestPhone.trim(),
          patientEmail: guestEmail.trim() || undefined,
          otpCode,
          otpTarget: target,
          otpType: guestPhone.trim() ? "PHONE" : "EMAIL",
          reason: reason.trim() || undefined,
        });
      }
      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full  max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <div>
            <h2 className="font-h3 text-h3 text-on-surface">
              Book Appointment
            </h2>
            <p className="font-body-md text-on-surface-variant text-sm mt-0.5">
              {doctor.user.fullName} · {doctor.specialization ?? "General"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-h3 text-h3 text-on-surface">
                  Appointment Requested!
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  {new Date(selected!.startAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm hover:opacity-90 transition-all"
              >
                View in Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Fee */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                <span className="font-body-md text-body-md text-on-surface-variant">
                  Consultation Fee
                </span>
                <span className="font-h3 text-h3 text-on-surface">
                  {fmtPrice(doctor.priceCents)}
                </span>
              </div>

              {/* Slots */}
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
                  Available Slots
                </p>
                {loadingSlots ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-4">
                    No slots available in the next 30 days.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot, i) => {
                      const d = new Date(slot.startAt);
                      const isSelected = selected?.startAt === slot.startAt;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelected(slot)}
                          className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? "bg-primary text-on-primary border-primary"
                              : "border-outline-variant text-on-surface hover:border-primary hover:bg-primary/5"
                          }`}
                        >
                          <div className="font-semibold">
                            {d.toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="opacity-80">
                            {d.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                  Reason (optional)
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly describe your concern..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Guest fields — shown only when not logged in */}
              {isGuest && (
                <div className="space-y-3 rounded-xl border border-outline-variant p-4 bg-surface-container-low">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Book as Guest
                  </p>
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your full name *"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Phone number (for OTP)"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {!otpSent ? (
                    <button
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      className="w-full py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sendingOtp ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : null}
                      {sendingOtp ? "Sending OTP…" : "Send OTP"}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-on-surface-variant">
                        OTP sent — check your phone/email
                      </p>
                      <input
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        className="text-xs text-primary hover:underline"
                      >
                        Resend OTP
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
                  <X size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                disabled={!selected || booking || (isGuest && !otpSent)}
                onClick={handleBook}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {booking ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CalendarDays size={16} />
                )}
                {booking
                  ? "Booking…"
                  : selected
                    ? `Confirm — ${new Date(selected.startAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                    : "Select a slot"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Doctor Card ────────────────────────────────────────────────────────────
function DoctorCard({
  doc,
  onBook,
}: {
  doc: Doctor;
  onBook: (d: Doctor) => void;
}) {
  const slot = fmtSlot(doc.nextAvailableSlotAt);
  const soon = isSoon(doc.nextAvailableSlotAt);
  return (
    <article className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200 flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base border border-primary/20 shrink-0">
          {initials(doc.user.fullName)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm text-on-surface flex items-center gap-1.5 leading-snug">
            {doc.user.fullName}
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-on-primary shrink-0">
              <Check size={9} strokeWidth={3} />
            </span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {doc.specialization ?? "General Practice"}
          </p>
          {doc.city && (
            <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">
                location_on
              </span>
              {doc.city}
              {doc.country ? `, ${doc.country}` : ""}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            {doc.ratingAvg !== null ? (
              <>
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="font-label-sm text-label-sm font-bold text-on-surface">
                  {doc.ratingAvg.toFixed(1)}
                </span>
                <span className="text-xs text-on-surface-variant">
                  ({doc.reviewCount})
                </span>
              </>
            ) : (
              <span className="text-xs text-on-surface-variant">
                No reviews yet
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 py-3 border-y border-outline-variant">
        <div>
          <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider mb-1">
            Fee
          </p>
          <p className="font-bold text-base text-on-surface leading-none">
            {fmtPrice(doc.priceCents)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider mb-1">
            Next Available
          </p>
          {slot ? (
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${soon ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-surface-container text-on-surface-variant border-outline-variant"}`}
            >
              {soon ? <Clock size={10} /> : <CalendarDays size={10} />}
              {slot}
            </div>
          ) : (
            <span className="text-xs text-on-surface-variant">Unavailable</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onBook(doc)}
          className="flex-1 bg-primary text-on-primary text-sm font-medium py-2 px-4 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Book Now
        </button>
        <a
          href="/communication"
          aria-label={`Chat with ${doc.user.fullName}`}
          className="w-9 h-9 flex items-center justify-center border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
        >
          <MessageCircle size={15} />
        </a>
      </div>
    </article>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"next" | "rating">("next");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(ITEMS_PER_PAGE),
        sortBy,
        ...(debouncedSearch ? { q: debouncedSearch } : {}),
        ...(availableOnly ? { availableOnly: "true" } : {}),
        // city filter via first selected spec used as q if no search
      });
      // send each selected spec as separate q if no text search
      if (!debouncedSearch && selectedSpecs.length === 1) {
        params.set("q", selectedSpecs[0]);
      }
      const data: any = await doctorService.list(params);
      setDoctors(data.items ?? []);
      setTotal(data.items?.length ?? 0);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedSpecs, availableOnly, sortBy]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const toggleSpec = (spec: string) => {
    setPage(1);
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec],
    );
  };

  const clearAll = () => {
    setSearch("");
    setSelectedSpecs([]);
    setAvailableOnly(false);
    setSortBy("next");
    setPage(1);
  };

  const hasFilters =
    selectedSpecs.length > 0 || availableOnly || debouncedSearch;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const FilterPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-on-surface">Filters</h2>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <X size={11} /> Clear all
          </button>
        )}
      </div>

      {/* Specialization */}
      <div className="border-b border-outline-variant pb-5">
        <h3 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
          Specialization
        </h3>
        <div className="space-y-2.5">
          {SPECIALTIES.map((spec) => {
            const checked = selectedSpecs.includes(spec);
            return (
              <label
                key={spec}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  onClick={() => toggleSpec(spec)}
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${checked ? "bg-primary border-primary" : "border-outline-variant group-hover:border-primary"}`}
                >
                  {checked && (
                    <Check
                      size={10}
                      className="text-on-primary"
                      strokeWidth={3}
                    />
                  )}
                </div>
                <span className="text-sm text-on-surface group-hover:text-primary transition-colors">
                  {spec}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Availability */}
      <div className="border-b border-outline-variant pb-5">
        <h3 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
          Availability
        </h3>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            onClick={() => {
              setAvailableOnly((v) => !v);
              setPage(1);
            }}
            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${availableOnly ? "bg-primary border-primary" : "border-outline-variant group-hover:border-primary"}`}
          >
            {availableOnly && (
              <Check size={10} className="text-on-primary" strokeWidth={3} />
            )}
          </div>
          <span className="text-sm text-on-surface group-hover:text-primary transition-colors">
            Available now
          </span>
        </label>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
          Sort By
        </h3>
        <div className="flex gap-2">
          {(["next", "rating"] as const).map((val) => (
            <button
              key={val}
              onClick={() => {
                setSortBy(val);
                setPage(1);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${sortBy === val ? "bg-primary/10 border-primary text-primary" : "border-outline-variant text-on-surface-variant hover:bg-surface-container"}`}
            >
              {val === "next" ? "Soonest" : "Top Rated"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {bookingDoctor && (
        <BookModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
        />
      )}

      <main className="flex-1 max-w-container-max mx-auto w-full px-6 py-10 flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-60 shrink-0">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sticky top-25">
            <FilterPanel />
            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/15">
              <h3 className="font-semibold text-sm text-on-surface mb-1">
                Need help?
              </h3>
              <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">
                Our support team is available 24/7.
              </p>
              <a
                href="/contact"
                className="block w-full py-2 px-3 rounded-lg bg-white border border-outline-variant text-on-surface text-xs font-medium hover:bg-surface-container transition-colors text-center"
              >
                Contact Support
              </a>
            </div>
          </div>
        </aside>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 bg-surface-container-lowest p-5 overflow-y-auto shadow-xl">
              <FilterPanel />
            </div>
          </div>
        )}

        {/* Main Content */}
        <section className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="font-bold text-2xl text-on-surface leading-tight">
                {selectedSpecs.length === 1
                  ? `${selectedSpecs[0]} Specialists`
                  : "Find Doctors"}
              </h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {loading
                  ? "Loading…"
                  : `${doctors.length} specialist${doctors.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="md:hidden flex items-center gap-2 py-2 px-3 rounded-lg border border-outline-variant text-sm text-on-surface hover:bg-surface-container transition-colors"
              >
                <SlidersHorizontal size={14} /> Filters
                {hasFilters && (
                  <span className="w-4 h-4 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center">
                    {selectedSpecs.length + (availableOnly ? 1 : 0)}
                  </span>
                )}
              </button>
              <div className="relative flex-1 sm:flex-none sm:w-56">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search doctors, specialty…"
                  className="w-full pl-8 pr-8 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedSpecs.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full border border-primary/20"
                >
                  {s}
                  <button onClick={() => toggleSpec(s)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
              {availableOnly && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full border border-primary/20">
                  Available now
                  <button onClick={() => setAvailableOnly(false)}>
                    <X size={10} />
                  </button>
                </span>
              )}
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full border border-primary/20">
                  "{debouncedSearch}"
                  <button onClick={() => setSearch("")}>
                    <X size={10} />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : doctors.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <DoctorCard key={doc.id} doc={doc} onBook={setBookingDoctor} />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                <Search size={24} className="text-on-surface-variant" />
              </div>
              <h3 className="font-semibold text-on-surface mb-1">
                No doctors found
              </h3>
              <p className="text-sm text-on-surface-variant mb-4">
                Try adjusting your search or filters.
              </p>
              <button
                onClick={clearAll}
                className="text-sm text-primary hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from(
                { length: Math.min(totalPages, 7) },
                (_, i) => i + 1,
              ).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === n ? "bg-primary text-on-primary" : "border border-outline-variant text-on-surface hover:bg-surface-container"}`}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
