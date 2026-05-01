"use client";

import { useEffect, useState } from "react";
import { appointmentService } from "@/services/appointment.service";
import { getStoredToken } from "@/hooks/use-auth";
import {
  Calendar,
  HandHelping,
  MapPin,
  MessageSquare,
  Search,
  Stethoscope,
  Video,
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
  REQUESTED: "bg-secondary-container/40 text-secondary",
  COMPLETED: "bg-surface-container-high text-on-surface-variant",
  CANCELLED: "bg-error/10 text-error",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString())
    return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (d.toDateString() === tomorrow.toDateString())
    return `Tomorrow, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return (
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + `, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  );
}

export function PatientDashboard({ me }: { me: Me }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    appointmentService
      .myAppointments(token)
      .then((data: any) =>
        setAppointments(Array.isArray(data) ? data : (data.items ?? [])),
      )
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter(
    (a) =>
      ["CONFIRMED", "REQUESTED"].includes(a.status) &&
      new Date(a.startAt) > new Date(),
  );
  const past = appointments.filter(
    (a) => a.status === "COMPLETED" || new Date(a.startAt) <= new Date(),
  );
  const nextAppt = upcoming[0] ?? null;

  return (
    <>
      <style>{`body { background-color: #f8fafc; } .premium-card { background-color: #ffffff; border-radius: 0.75rem; border: 1px solid #e2e8f0; padding: 24px; } .premium-card:hover { box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.02); } .btn-primary { background-color: #00685f; color: #ffffff; border-radius: 0.5rem; transition: background-color 0.2s; } .btn-primary:hover { background-color: #005049; } .btn-secondary { background-color: #ffffff; color: #505f76; border: 1px solid #e2e8f0; border-radius: 0.5rem; transition: background-color 0.2s; } .btn-secondary:hover { background-color: #f5faf8; }`}</style>

      <main className="grow max-w-container-max mx-auto w-full px-margin py-margin grid grid-cols-1 lg:grid-cols-12 gap-margin">
        {/* ── Left Column ── */}
        <div className="lg:col-span-8 flex flex-col gap-margin">
          {/* Welcome */}
          <section>
            <h1 className="font-h1 text-h1 text-on-surface mb-2">
              Welcome back, {me.fullName.split(" ")[0]}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Here's a summary of your health profile and upcoming activities.
            </p>
          </section>

          {/* Next Appointment */}
          <section>
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-h2 text-h2 text-on-surface">
                Upcoming Appointment
              </h2>
            </div>

            {loading ? (
              <div className="premium-card flex items-center justify-center h-32">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : nextAppt ? (
              <div className="premium-card relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-surface-container flex items-center justify-center text-primary border-2 border-surface">
                      <span className="material-symbols-outlined text-[28px]">
                        <Stethoscope />
                      </span>
                    </div>
                    <div>
                      <h3 className="font-h3 text-h3 text-on-surface">
                        {nextAppt.doctor.user.fullName}
                      </h3>
                      <p className="font-body-md text-body-md text-secondary">
                        {nextAppt.doctor.specialization ?? "General Practice"} •{" "}
                        {nextAppt.doctor.clinicName ?? "Video Consult"}
                      </p>
                      {nextAppt.reason && (
                        <p className="font-body-md  text-on-surface-variant text-xs mt-1 italic">
                          "{nextAppt.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 border-l-0 sm:border-l border-surface-variant pl-0 sm:pl-6">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">
                        <Calendar />
                      </span>
                      <span className="font-label-sm text-label-sm">
                        {formatDate(nextAppt.startAt)}
                      </span>
                    </div>
                    {nextAppt.status === "CONFIRMED" ? (
                      <div className="flex gap-2 mt-2">
                        <a
                          href={`/appointments/${nextAppt.id}`}
                          className="btn-secondary px-4 py-2 font-label-sm flex items-center justify-center gap-2"
                        >
                          View Details
                        </a>
                        <a
                          href="/call"
                          className="btn-primary px-6 py-2 font-label-sm w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            <Video />
                          </span>
                          Join Call
                        </a>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2 items-center">
                        <span className="px-3 py-1 rounded-full bg-secondary-container/40 text-secondary font-label-sm text-label-sm">
                          Awaiting Confirmation
                        </span>
                        <a
                          href={`/appointments/${nextAppt.id}`}
                          className="btn-secondary px-4 py-2 font-label-sm flex items-center justify-center gap-2 border border-outline"
                        >
                          View Details
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="premium-card flex flex-col items-center justify-center gap-4 py-10 text-center">
                <div className="h-14 w-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[28px]">
                    <Calendar />
                  </span>
                </div>
                <div>
                  <p className="font-h3 text-h3 text-on-surface">
                    No upcoming appointments
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Book a consultation with a specialist today.
                  </p>
                </div>
                <a
                  href="/doctors"
                  className="btn-primary px-6 py-2 font-label-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    <Search />
                  </span>
                  Find a Doctor
                </a>
              </div>
            )}
          </section>

          {/* Past Appointments */}
          <section>
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-h2 text-h2 text-on-surface">
                Past Appointments
              </h2>
              <a className="font-label-sm text-label-sm text-primary hover:underline" href="/dashboard/appointments">View All</a>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : past.length === 0 ? (
                <div className="p-6 text-center text-on-surface-variant font-body-md text-body-md">
                  No past appointments yet.
                </div>
              ) : (
                <div className="divide-y divide-[#E2E8F0]">
                  {past.slice(0, 5).map((appt) => (
                    <a
                      href={`/appointments/${appt.id}`}
                      key={appt.id}
                      className="block p-4 hover:bg-surface transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined">
                              <Stethoscope />
                            </span>
                          </div>
                          <div>
                            <p className="font-h3 text-h3 text-on-surface text-sm">
                              {appt.doctor.user.fullName}
                            </p>
                            <p className="font-body-md  text-secondary text-xs">
                              {appt.doctor.specialization ?? "General Practice"} •{" "}
                              {new Date(appt.startAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded font-label-xs text-label-xs uppercase tracking-wider ${STATUS_STYLES[appt.status] ?? ""}`}
                        >
                          {appt.status}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-4 flex flex-col gap-margin">
          {/* Stats */}
          <section className="grid grid-cols-2 gap-4">
            <div className="premium-card flex flex-col gap-1 p-4">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                Total Visits
              </span>
              <span className="font-h1 text-h1 text-on-surface">
                {loading
                  ? "—"
                  : appointments.filter((a) => a.status === "COMPLETED").length}
              </span>
            </div>
            <div className="premium-card flex flex-col gap-1 p-4">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                Upcoming
              </span>
              <span className="font-h1 text-h1 text-primary">
                {loading ? "—" : upcoming.length}
              </span>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="font-h2 text-h2 text-on-surface mb-md">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/doctors"
                className="premium-card flex flex-col items-center justify-center gap-3 text-center p-6 hover:border-primary/30 transition-all"
              >
                <div className="h-12 w-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">
                    <Stethoscope />
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface">
                  Book New
                  <br />
                  Appointment
                </span>
              </a>
              <a
                href="/communication"
                className="premium-card flex flex-col items-center justify-center gap-3 text-center p-6 hover:border-primary/30 transition-all"
              >
                <div className="h-12 w-12 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[24px]">
                    <MessageSquare />
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface">
                  Messages
                </span>
              </a>
              <a
                href="/call"
                className="premium-card flex flex-col items-center justify-center gap-3 text-center p-6 hover:border-primary/30 transition-all"
              >
                <div className="h-12 w-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">
                    <Video />
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface">
                  Video
                  <br />
                  Call
                </span>
              </a>
              <a
                href="/contact"
                className="premium-card flex flex-col items-center justify-center gap-3 text-center p-6 hover:border-primary/30 transition-all"
              >
                <div className="h-12 w-12 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[24px]">
                    <HandHelping />
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface">
                  Contact
                  <br />
                  Support
                </span>
              </a>
            </div>
          </section>

          {/* Profile Card */}
          <section>
            <div className="premium-card flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-h2 text-h2 shrink-0">
                  {me.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-h3 text-h3 text-on-surface">
                    {me.fullName}
                  </p>
                  <p className="font-body-md  text-on-surface-variant text-xs">
                    {me.email}
                  </p>
                </div>
              </div>
              {me.patientProfile?.gender && (
                <p className="font-body-md  text-on-surface-variant text-sm">
                  <span className="font-medium text-on-surface">Gender:</span>{" "}
                  {me.patientProfile.gender}
                </p>
              )}
              {me.patientProfile?.address && (
                <p className="font-body-md  text-on-surface-variant text-sm flex items-start gap-1">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">
                    <MapPin />
                  </span>
                  {me.patientProfile.address}
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
