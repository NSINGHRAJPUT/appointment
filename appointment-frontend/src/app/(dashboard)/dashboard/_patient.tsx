"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { appointmentService } from "@/services/appointment.service";
import { getStoredToken } from "@/hooks/use-auth";
import { videoCallEnabled } from "@/lib/features";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  HandHelping,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  Stethoscope,
  Video,
  type LucideIcon,
} from "lucide-react";

type Me = {
  id: string;
  fullName: string;
  email: string;
  patientProfile: any;
};

type Appointment = {
  id: string;
  startAt: string;
  endAt: string;
  status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  reason: string | null;
  doctor: {
    id: string;
    specialization: string | null;
    clinicName: string | null;
    user: { fullName: string };
  };
};

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-primary/10 text-primary",
  REQUESTED: "bg-secondary-container/50 text-secondary",
  COMPLETED: "bg-surface-container-high text-on-surface-variant",
  CANCELLED: "bg-error/10 text-error",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`;
  return (
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + `, ${time}`
  );
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PatientDashboard({ me }: { me: Me }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    appointmentService
      .myAppointments(token)
      .then((data: any) => {
        if (!active) return;
        setAppointments(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setAppointments([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const { upcoming, past, nextAppt, completedCount, pendingCount } = useMemo(() => {
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
      completedCount: appointments.filter((a) => a.status === "COMPLETED").length,
      pendingCount: appointments.filter((a) => a.status === "REQUESTED").length,
    };
  }, [appointments]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <>
      <style>{`body { background-color: var(--background); }`}</style>

      <main className="w-full max-w-container-max mx-auto px-margin py-margin flex flex-col gap-margin">
        {/* ── Hero Header ── */}
        <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-forest via-primary to-brand-teal-light text-white p-8 sm:p-10 shadow-xl shadow-primary/20">
          <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-6 items-end">
            <div className="min-w-0 w-full">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium mb-4">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                Pet care, simplified
              </div>
              <h1 className="font-h1 text-h1 sm:text-[36px] leading-tight">
                {greeting}, {me.fullName.split(" ")[0]}
              </h1>
              <p className="mt-2 text-white/80 text-base leading-relaxed max-w-2xl">
                {nextAppt
                  ? "You have an upcoming appointment. Here's everything at a glance."
                  : "Book a consultation with a trusted vet in just a few taps."}
              </p>
            </div>
            <Link
              href="/doctors"
              className="no-pill inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white text-primary font-semibold px-6 py-3 shadow-lg hover:scale-[1.03] active:scale-95 transition-transform w-full md:w-auto"
            >
              <Search className="h-[18px] w-[18px]" />
              Find a Vet
            </Link>
          </div>

          {/* Stat pills */}
          <div className="relative z-10 mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <HeroStat
              icon={CheckCircle2}
              label="Total Visits"
              value={loading ? "—" : String(completedCount)}
            />
            <HeroStat
              icon={CalendarClock}
              label="Upcoming"
              value={loading ? "—" : String(upcoming.length)}
            />
            <HeroStat
              icon={Clock}
              label="Pending"
              value={loading ? "—" : String(pendingCount)}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin">
          {/* ── Left Column ── */}
          <div className="lg:col-span-8 flex flex-col gap-margin">
            {/* Next Appointment */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-h2 text-h2 text-on-surface">
                  Next Appointment
                </h2>
                {upcoming.length > 1 && (
                  <span className="text-label-sm text-on-surface-variant">
                    +{upcoming.length - 1} more scheduled
                  </span>
                )}
              </div>

              {loading ? (
                <div className="premium-card">
                  <div className="flex items-center gap-4 animate-pulse">
                    <div className="h-16 w-16 rounded-2xl bg-surface-container-high" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-surface-container-high" />
                      <div className="h-3 w-1/2 rounded bg-surface-container-high" />
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="premium-card text-center py-8 text-on-surface-variant">
                  Couldn&apos;t load your appointments. Please refresh the page.
                </div>
              ) : nextAppt ? (
                <div className="premium-card relative overflow-hidden group p-0!">
                  <div className="h-1.5 w-full bg-linear-to-r from-primary to-brand-teal-light" />
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary-container flex items-center justify-center text-primary shrink-0 shadow-inner">
                          <Stethoscope className="h-7 w-7" />
                        </div>
                        <div>
                          <h3 className="font-h3 text-h3 text-on-surface">
                            {nextAppt.doctor.user.fullName}
                          </h3>
                          <p className="font-body-md text-body-md text-secondary">
                            {nextAppt.doctor.specialization ?? "General Practice"}{" "}
                            • {nextAppt.doctor.clinicName ?? "Video Consult"}
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-on-surface-variant">
                            <CalendarDays className="h-4 w-4" />
                            <span className="font-label-sm text-label-sm">
                              {formatDate(nextAppt.startAt)}
                            </span>
                          </div>
                          {nextAppt.reason && (
                            <p className="text-on-surface-variant text-xs mt-2 italic">
                              &quot;{nextAppt.reason}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                        {nextAppt.status === "CONFIRMED" ? (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Link
                              href={`/appointments/${nextAppt.id}`}
                              className="btn-secondary px-4 py-2.5 font-label-sm flex items-center justify-center gap-2"
                            >
                              View Details
                            </Link>
                            {videoCallEnabled && (
                              <Link
                                href={`/call?appointmentId=${nextAppt.id}`}
                                className="btn-primary px-6 py-2.5 font-label-sm flex items-center justify-center gap-2"
                              >
                                <Video className="h-[18px] w-[18px]" />
                                Join Call
                              </Link>
                            )}
                          </div>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/50 text-secondary font-label-sm text-label-sm">
                              <Clock className="h-3.5 w-3.5" />
                              Awaiting Confirmation
                            </span>
                            <Link
                              href={`/appointments/${nextAppt.id}`}
                              className="btn-secondary px-4 py-2.5 font-label-sm flex items-center justify-center gap-2"
                            >
                              View Details
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
                    <CalendarDays className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-h3 text-h3 text-on-surface">
                      No upcoming appointments
                    </p>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      Book a consultation with a trusted vet today.
                    </p>
                  </div>
                  <Link
                    href="/doctors"
                    className="btn-primary px-6 py-2.5 font-label-sm flex items-center gap-2"
                  >
                    <Search className="h-[18px] w-[18px]" />
                    Find a Vet
                  </Link>
                </div>
              )}
            </section>

            {/* Past Appointments */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-h2 text-h2 text-on-surface">
                  Recent Activity
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
                {loading ? (
                  <div className="divide-y divide-outline-variant">
                    {[0, 1, 2].map((i) => (
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
                      href="/doctors"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <Search className="h-4 w-4" />
                      Find a vet
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
                            <Stethoscope className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-h3 text-on-surface text-sm truncate">
                              {appt.doctor.user.fullName}
                            </p>
                            <p className="text-secondary text-xs truncate">
                              {appt.doctor.specialization ?? "General Practice"}{" "}
                              • {formatShortDate(appt.startAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-1 rounded-md font-label-xs text-label-xs uppercase tracking-wider ${STATUS_STYLES[appt.status] ?? ""}`}
                          >
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

          {/* ── Right Column ── */}
          <div className="lg:col-span-4 flex flex-col gap-margin">
            {/* Profile Card */}
            <section>
              <div className="premium-card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-primary-container/30 rounded-bl-full -mr-6 -mt-6" />
                <div className="relative flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary to-brand-teal-light flex items-center justify-center text-white font-h2 text-h2 shrink-0 shadow-md">
                    {initials(me.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-h3 text-h3 text-on-surface truncate">
                      {me.fullName}
                    </p>
                    <p className="text-on-surface-variant text-xs truncate">
                      {me.email}
                    </p>
                  </div>
                </div>
                {(me.patientProfile?.gender || me.patientProfile?.address) && (
                  <div className="relative mt-4 pt-4 border-t border-outline-variant space-y-2">
                    {me.patientProfile?.gender && (
                      <p className="text-on-surface-variant text-sm">
                        <span className="font-medium text-on-surface">
                          Gender:
                        </span>{" "}
                        {me.patientProfile.gender}
                      </p>
                    )}
                    {me.patientProfile?.address && (
                      <p className="text-on-surface-variant text-sm flex items-start gap-1.5">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                        {me.patientProfile.address}
                      </p>
                    )}
                  </div>
                )}
                <Link
                  href="/dashboard/profile"
                  className="relative mt-4 btn-secondary w-full px-4 py-2.5 font-label-sm flex items-center justify-center gap-2"
                >
                  Manage Profile
                </Link>
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="font-h2 text-h2 text-on-surface mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <QuickAction
                  href="/doctors"
                  icon={Stethoscope}
                  label="Book Appointment"
                  tone="primary"
                />
                <QuickAction
                  href="/chat"
                  icon={MessageSquare}
                  label="Messages"
                  tone="secondary"
                />
                {videoCallEnabled && nextAppt?.status === "CONFIRMED" && (
                  <QuickAction
                    href={`/call?appointmentId=${nextAppt.id}`}
                    icon={Video}
                    label="Video Call"
                    tone="primary"
                  />
                )}
                <QuickAction
                  href="/contact"
                  icon={HandHelping}
                  label="Support"
                  tone="secondary"
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-4 ${className}`}
    >
      <div className="flex items-center gap-2 text-white/70 text-label-xs uppercase tracking-wider">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-1 font-h1 text-[28px] font-semibold leading-none">
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  tone: "primary" | "secondary";
}) {
  const toneClasses =
    tone === "primary"
      ? "bg-primary-container text-primary"
      : "bg-secondary-container/40 text-secondary";
  return (
    <Link
      href={href}
      className="premium-card group flex flex-col items-center justify-center gap-3 text-center p-6 hover:border-primary/40 hover:-translate-y-0.5 transition-all"
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
