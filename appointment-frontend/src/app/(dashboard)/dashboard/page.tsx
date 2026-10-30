"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { doctorService } from "@/services/doctor.service";
import { getStoredToken } from "@/hooks/use-auth";
import { PatientDashboard } from "./_patient";
import {
  ArrowRight,
  Activity,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ClipboardList,
  MessageSquare,
  NotebookPen,
  Sparkles,
  Stethoscope,
  User,
  Video,
  type LucideIcon,
} from "lucide-react";

type Me = {
  id: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  fullName: string;
  doctorProfile: any;
  patientProfile: any;
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/auth");
      return;
    }
    authService
      .me(token)
      .then((data) => setMe(data as Me))
      .catch(() => router.replace("/auth"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!me) return null;

  if (me.role === "ADMIN") {
    router.replace("/dashboard/admin");
    return null;
  }

  if (me.role === "DOCTOR") {
    return <DoctorDashboard me={me} />;
  }

  return <PatientDashboard me={me} />;
}

function DoctorDashboard({ me }: { me: Me }) {
  const [isOnline, setIsOnline] = useState<boolean>(
    me.doctorProfile?.isOnline ?? false,
  );
  const [bookingMode, setBookingMode] = useState<
    "INSTANT" | "APPROVAL_REQUIRED"
  >(me.doctorProfile?.bookingMode ?? "INSTANT");
  const [savingSettings, setSavingSettings] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoadingAppts(false);
      return;
    }
    let active = true;
    setLoadingAppts(true);
    setAppointmentsError(false);
    import("@/services/appointment.service").then(({ appointmentService }) => {
      appointmentService
        .myAppointments(token)
        .then((data: any) => {
          if (!active) return;
          setAppointments(Array.isArray(data) ? data : (data.items ?? []));
        })
        .catch(() => {
          if (!active) return;
          setAppointmentsError(true);
          setAppointments([]);
        })
        .finally(() => {
          if (active) setLoadingAppts(false);
        });
    });
    return () => {
      active = false;
    };
  }, []);

  async function toggleOnline() {
    const token = getStoredToken();
    if (!token) return;
    const next = !isOnline;
    setSavingSettings(true);
    try {
      await doctorService.updateSettings(token, { isOnline: next });
      setIsOnline(next);
    } finally {
      setSavingSettings(false);
    }
  }

  async function toggleBookingMode() {
    const token = getStoredToken();
    if (!token) return;
    const next = bookingMode === "INSTANT" ? "APPROVAL_REQUIRED" : "INSTANT";
    setSavingSettings(true);
    try {
      await doctorService.updateSettings(token, { bookingMode: next });
      setBookingMode(next);
    } finally {
      setSavingSettings(false);
    }
  }
  const { upcoming, past, nextAppt, requestCount, completedCount } = useMemo(() => {
    const now = Date.now();
    const upcoming = appointments
      .filter(
        (a) =>
          ["CONFIRMED", "REQUESTED"].includes(a.status) &&
          new Date(a.startAt).getTime() > now,
      )
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
    const past = appointments
      .filter(
        (a) => a.status === "COMPLETED" || new Date(a.startAt).getTime() <= now,
      )
      .sort(
        (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
      );
    return {
      upcoming,
      past,
      nextAppt: upcoming[0] ?? null,
      requestCount: appointments.filter((a) => a.status === "REQUESTED").length,
      completedCount: appointments.filter((a) => a.status === "COMPLETED").length,
    };
  }, [appointments]);

  const firstName = me.fullName.split(" ")[0] ?? me.fullName;
  const specialty = me.doctorProfile?.specialization ?? "Veterinary care";
  const location = me.doctorProfile?.city ?? "Location not set";

  return (
    <>
      <style>{`body { background-color: var(--background); }`}</style>

      <main className="w-full max-w-container-max mx-auto px-margin py-margin flex flex-col gap-margin">
        <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-ink via-brand-forest to-primary text-white p-8 sm:p-10 shadow-xl shadow-primary/15">
          <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 -left-12 w-80 h-80 rounded-full bg-brand-teal-light/20 blur-2xl" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-6 items-end">
            <div className="min-w-0 w-full">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium mb-4">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                Practice command center
              </div>
              <h1 className="font-h1 text-h1 sm:text-[36px] leading-tight">
                Welcome back, Dr. {firstName}
              </h1>
              <p className="mt-2 text-white/80 text-base leading-relaxed max-w-2xl">
                Track upcoming consults, review patient requests, and keep your
                availability ready for pet parents.
              </p>
            </div>
            <Link
              href="/dashboard/availability"
              className="no-pill inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white text-primary font-semibold px-6 py-3 shadow-lg hover:scale-[1.03] active:scale-95 transition-transform w-full md:w-auto"
            >
              <CalendarCheck className="h-[18px] w-[18px]" />
              Manage Availability
            </Link>
          </div>

          <div className="relative z-10 mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <DoctorHeroStat
              icon={CalendarCheck}
              label="Upcoming"
              value={loadingAppts ? "—" : String(upcoming.length)}
            />
            <DoctorHeroStat
              icon={Clock}
              label="Requests"
              value={loadingAppts ? "—" : String(requestCount)}
            />
            <DoctorHeroStat
              icon={CheckCircle2}
              label="Completed"
              value={loadingAppts ? "—" : String(completedCount)}
            />
            <DoctorHeroStat
              icon={Activity}
              label="Status"
              value={isOnline ? "Online" : "Offline"}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin">
          <div className="lg:col-span-8 flex flex-col gap-margin">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-h2 text-h2 text-on-surface">
                  Next Consultation
                </h2>
                {upcoming.length > 1 && (
                  <span className="text-label-sm text-on-surface-variant">
                    +{upcoming.length - 1} more scheduled
                  </span>
                )}
              </div>

              {loadingAppts ? (
                <div className="premium-card">
                  <div className="flex items-center gap-4 animate-pulse">
                    <div className="h-16 w-16 rounded-2xl bg-surface-container-high" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-surface-container-high" />
                      <div className="h-3 w-1/2 rounded bg-surface-container-high" />
                    </div>
                  </div>
                </div>
              ) : appointmentsError ? (
                <div className="premium-card text-center py-8 text-on-surface-variant">
                  Couldn&apos;t load appointments. Please refresh the page.
                </div>
              ) : nextAppt ? (
                <div className="premium-card relative overflow-hidden group p-0!">
                  <div className="h-1.5 w-full bg-linear-to-r from-primary to-brand-teal-light" />
                  <div className="absolute top-0 right-0 w-36 h-36 bg-primary-container/30 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
                  <div className="relative p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-16 w-16 rounded-2xl bg-primary-container flex items-center justify-center text-primary shrink-0 shadow-inner">
                          <User className="h-7 w-7" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-h3 text-h3 text-on-surface truncate">
                            {nextAppt.patientName}
                          </h3>
                          <p className="font-body-md text-body-md text-secondary truncate">
                            {nextAppt.patientPhone ?? "Phone not provided"}
                            {nextAppt.reason ? ` • ${nextAppt.reason}` : ""}
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-on-surface-variant">
                            <Calendar className="h-4 w-4" />
                            <span className="font-label-sm text-label-sm">
                              {formatAppointmentDate(nextAppt.startAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                        {nextAppt.status === "CONFIRMED" ? (
                          <Link
                            href={`/appointments/${nextAppt.id}`}
                            className="btn-primary px-6 py-2.5 font-label-sm flex items-center justify-center gap-2"
                          >
                            <Video className="h-[18px] w-[18px]" />
                            View Details
                          </Link>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/50 text-secondary font-label-sm text-label-sm">
                              <Clock className="h-3.5 w-3.5" />
                              New Request
                            </span>
                            <Link
                              href={`/appointments/${nextAppt.id}`}
                              className="btn-secondary px-4 py-2.5 font-label-sm flex items-center justify-center gap-2"
                            >
                              Review Request
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="premium-card flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary-container flex items-center justify-center text-primary">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-h3 text-h3 text-on-surface">
                      No upcoming appointments
                    </p>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      Your practice is clear for the moment.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/availability"
                    className="btn-primary px-6 py-2.5 font-label-sm flex items-center gap-2"
                  >
                    <CalendarCheck className="h-[18px] w-[18px]" />
                    Update Availability
                  </Link>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-h2 text-h2 text-on-surface">
                  Recent Patients
                </h2>
                <Link
                  className="font-label-sm text-label-sm text-primary hover:underline inline-flex items-center gap-1"
                  href="/dashboard/appointments"
                >
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="premium-card p-0! overflow-hidden">
                {loadingAppts ? (
                  <div className="divide-y divide-outline-variant">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-4 flex items-center gap-4 animate-pulse"
                      >
                        <div className="h-11 w-11 rounded-xl bg-surface-container-high" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/3 rounded bg-surface-container-high" />
                          <div className="h-2 w-1/2 rounded bg-surface-container-high" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : past.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 p-10 text-center">
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      No past appointments yet.
                    </p>
                    <Link
                      href="/dashboard/availability"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Keep your calendar ready →
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant">
                    {past.slice(0, 5).map((appt) => (
                      <Link
                        href={`/appointments/${appt.id}`}
                        key={appt.id}
                        className="group flex items-center justify-between gap-3 p-4 hover:bg-surface-container-low transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-11 w-11 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-h3 text-on-surface text-sm truncate">
                              {appt.patientName}
                            </p>
                            <p className="text-secondary text-xs truncate">
                              {formatShortDate(appt.startAt)}
                              {appt.reason ? ` • ${appt.reason}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-1 rounded-md font-label-xs text-label-xs uppercase tracking-wider ${doctorStatusStyle(appt.status)}`}>
                            {appt.status}
                          </span>
                          <ArrowRight className="h-4 w-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-margin">
            <section>
              <div className="premium-card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-primary-container/30 rounded-bl-full -mr-6 -mt-6" />
                <div className="relative flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary to-brand-teal-light flex items-center justify-center text-white font-h2 text-h2 shrink-0 shadow-md">
                    <Stethoscope className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-h3 text-h3 text-on-surface truncate">
                      Dr. {me.fullName}
                    </p>
                    <p className="text-on-surface-variant text-xs truncate">
                      {specialty} • {location}
                    </p>
                  </div>
                </div>
                <div className="relative mt-4 pt-4 border-t border-outline-variant">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full font-label-sm text-label-sm ${
                      me.doctorProfile?.onboardingStatus === "APPROVED"
                        ? "bg-primary/10 text-primary"
                        : "bg-tertiary-container/20 text-tertiary"
                    }`}
                  >
                    {me.doctorProfile?.onboardingStatus ?? "DRAFT"}
                  </span>
                  {me.doctorProfile?.subSpecialties?.length > 0 && (
                    <p className="mt-3 text-xs text-on-surface-variant leading-relaxed">
                      Also: {me.doctorProfile.subSpecialties.join(", ")}
                    </p>
                  )}
                </div>
                <Link
                  href="/dashboard/profile"
                  className="relative mt-4 btn-secondary w-full px-4 py-2.5 font-label-sm flex items-center justify-center gap-2"
                >
                  Update Profile
                </Link>
              </div>
            </section>

            <section>
              <h2 className="font-h2 text-h2 text-on-surface mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <DoctorQuickAction
                  href="/dashboard/profile"
                  icon={NotebookPen}
                  label="Update Profile"
                  tone="primary"
                />
                <DoctorQuickAction
                  href="/dashboard/availability"
                  icon={CalendarCheck}
                  label="Availability"
                  tone="primary"
                />
                <DoctorQuickAction
                  href="/chat"
                  icon={MessageSquare}
                  label="Messages"
                  tone="secondary"
                  className="col-span-2"
                />
              </div>
            </section>

            <section>
              <div className="premium-card flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-h2 text-h2 text-on-surface">
                      Consult Settings
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Control how patients can book you.
                    </p>
                  </div>
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      Online Status
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {isOnline
                        ? "Visible on home page & instant consult"
                        : "Turn on to appear in Available Now"}
                    </p>
                  </div>
                  <button
                    onClick={toggleOnline}
                    disabled={savingSettings}
                    aria-label="Toggle online status"
                    className={`relative w-11 h-6 rounded-full transition-colors ${isOnline ? "bg-primary" : "bg-outline-variant"} disabled:opacity-50`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isOnline ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      Booking Mode
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {bookingMode === "INSTANT"
                        ? "Auto-confirm bookings"
                        : "Switch to Instant to appear in Available Now"}
                    </p>
                  </div>
                  <button
                    onClick={toggleBookingMode}
                    disabled={savingSettings}
                    className="px-3 py-1 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 bg-white border-outline-variant text-on-surface hover:border-primary hover:text-primary"
                  >
                    {bookingMode === "INSTANT" ? "INSTANT" : "APPROVAL"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function formatAppointmentDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function doctorStatusStyle(status: string) {
  if (status === "COMPLETED") return "bg-surface-container-high text-on-surface-variant";
  if (status === "CANCELLED") return "bg-error/10 text-error";
  if (status === "REQUESTED") return "bg-secondary-container/50 text-secondary";
  return "bg-primary/10 text-primary";
}

function DoctorHeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-4">
      <div className="flex items-center gap-2 text-white/70 text-label-xs uppercase tracking-wider">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-1 font-h1 text-[24px] sm:text-[28px] font-semibold leading-none">
        {value}
      </p>
    </div>
  );
}

function DoctorQuickAction({
  href,
  icon: Icon,
  label,
  tone,
  className = "",
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  tone: "primary" | "secondary";
  className?: string;
}) {
  const toneClasses =
    tone === "primary"
      ? "bg-primary-container text-primary"
      : "bg-secondary-container/40 text-secondary";
  return (
    <Link
      href={href}
      className={`premium-card group flex flex-col items-center justify-center gap-3 text-center p-6 hover:border-primary/40 hover:-translate-y-0.5 transition-all ${className}`}
    >
      <div
        className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${toneClasses}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <span className="font-label-sm text-label-sm text-on-surface">
        {label}
      </span>
    </Link>
  );
}
