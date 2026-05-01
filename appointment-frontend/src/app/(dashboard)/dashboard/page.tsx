"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from '@/services/auth.service';
import { doctorService } from '@/services/doctor.service';
import { getStoredToken } from '@/hooks/use-auth';
import { PatientDashboard } from './_patient';
import { Calendar, CalendarCheck, MessageSquare, NotebookPen, Stethoscope, User, Video } from "lucide-react";

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

// ─── Doctor Dashboard (existing design kept intact) ───────────────────────────
function DoctorDashboard({ me }: { me: Me }) {
  const [isOnline, setIsOnline] = useState<boolean>(me.doctorProfile?.isOnline ?? false);
  const [bookingMode, setBookingMode] = useState<'INSTANT' | 'APPROVAL_REQUIRED'>(me.doctorProfile?.bookingMode ?? 'INSTANT');
  const [savingSettings, setSavingSettings] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    import('@/services/appointment.service').then(({ appointmentService }) => {
      appointmentService.myAppointments(token)
        .then((data: any) => {
          setAppointments(Array.isArray(data) ? data : (data.items ?? []));
        })
        .finally(() => setLoadingAppts(false));
    });
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
    const next = bookingMode === 'INSTANT' ? 'APPROVAL_REQUIRED' : 'INSTANT';
    setSavingSettings(true);
    try {
      await doctorService.updateSettings(token, { bookingMode: next });
      setBookingMode(next);
    } finally {
      setSavingSettings(false);
    }
  }
  const upcoming = appointments.filter((a) => ["CONFIRMED", "REQUESTED"].includes(a.status) && new Date(a.startAt) > new Date());
  const past = appointments.filter((a) => a.status === "COMPLETED" || new Date(a.startAt) <= new Date());
  const nextAppt = upcoming[0] ?? null;

  return (
    <>
      <style>{`body { background-color: #f8fafc; } .premium-card { background-color: #ffffff; border-radius: 0.75rem; border: 1px solid #e2e8f0; padding: 24px; } .premium-card:hover { box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.02); } .btn-primary { background-color: #00685f; color: #ffffff; border-radius: 0.5rem; transition: background-color 0.2s; } .btn-primary:hover { background-color: #005049; } .btn-secondary { background-color: #ffffff; color: #505f76; border: 1px solid #e2e8f0; border-radius: 0.5rem; transition: background-color 0.2s; } .btn-secondary:hover { background-color: #f5faf8; }`}</style>
      <main className="flex-grow max-w-[1440px] mx-auto w-full px-margin py-margin grid grid-cols-1 lg:grid-cols-12 gap-margin">
        <div className="lg:col-span-8 flex flex-col gap-margin">
          <section>
            <h1 className="font-h1 text-h1 text-on-surface mb-2">
              Welcome back, {me.fullName}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Here's a summary of your practice and upcoming appointments.
            </p>
          </section>
          
          {/* Upcoming Appointment */}
          <section>
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-h2 text-h2 text-on-surface">Upcoming Appointments</h2>
            </div>
            
            {loadingAppts ? (
              <div className="premium-card flex items-center justify-center h-32">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : nextAppt ? (
              <div className="premium-card relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-surface-container flex items-center justify-center text-primary border-2 border-surface">
                      <span className="material-symbols-outlined text-[28px]"><User /></span>
                    </div>
                    <div>
                      <h3 className="font-h3 text-h3 text-on-surface">{nextAppt.patientName}</h3>
                      <p className="font-body-md text-body-md text-secondary">
                        {nextAppt.patientPhone} {nextAppt.reason ? `• ${nextAppt.reason}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 border-l-0 sm:border-l border-surface-variant pl-0 sm:pl-6">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]"><Calendar /></span>
                      <span className="font-label-sm text-label-sm">
                        {new Date(nextAppt.startAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {nextAppt.status === "CONFIRMED" ? (
                      <a href={`/appointments/${nextAppt.id}`} className="btn-primary px-6 py-2 mt-2 font-label-sm w-full sm:w-auto flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}><Video /></span>
                        View Details
                      </a>
                    ) : (
                      <a href={`/appointments/${nextAppt.id}`} className="px-6 py-2 mt-2 font-label-sm w-full sm:w-auto flex items-center justify-center gap-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-all">
                        Review Request
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="premium-card flex flex-col items-center justify-center gap-4 py-10 text-center">
                <div className="h-14 w-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[28px]"><Calendar /></span>
                </div>
                <div>
                  <p className="font-h3 text-h3 text-on-surface">No upcoming appointments</p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">You have no scheduled appointments at the moment.</p>
                </div>
              </div>
            )}
          </section>

          {/* Past Appointments */}
          <section>
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-h2 text-h2 text-on-surface">Past Appointments</h2>
              <a className="font-label-sm text-label-sm text-primary hover:underline" href="/dashboard/appointments">View All</a>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
              {loadingAppts ? (
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
                    <a href={`/appointments/${appt.id}`} key={appt.id} className="block p-4 hover:bg-surface transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined"><User /></span>
                          </div>
                          <div>
                            <p className="font-h3 text-h3 text-on-surface text-sm">{appt.patientName}</p>
                            <p className="font-body-md text-secondary text-xs">
                              {new Date(appt.startAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded font-label-xs text-label-xs uppercase tracking-wider ${
                          appt.status === 'COMPLETED' ? 'bg-surface-container-high text-on-surface-variant' :
                          appt.status === 'CANCELLED' ? 'bg-error/10 text-error' :
                          'bg-primary/10 text-primary'
                        }`}>
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
        <div className="lg:col-span-4 flex flex-col gap-margin">
          <section>
            <h2 className="font-h2 text-h2 text-on-surface mb-md">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <a href="/dashboard/onboarding" className="premium-card flex flex-col items-center justify-center gap-3 text-center p-6 hover:border-primary/30 transition-all">
                <div className="h-12 w-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]"><NotebookPen /></span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface">Update<br />Profile</span>
              </a>
              <a href="/dashboard/availability" className="premium-card flex flex-col items-center justify-center gap-3 text-center p-6 hover:border-primary/30 transition-all">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined text-[24px]"><CalendarCheck /></span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface">Manage<br />Availability</span>
              </a>
              <a href="/communication" className="premium-card flex flex-col items-center justify-center gap-3 text-center p-6 hover:border-primary/30 transition-all col-span-2">
                <div className="h-12 w-12 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[24px]"><MessageSquare /></span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface">Messages</span>
              </a>
            </div>
          </section>
          <section>
            <div className="premium-card flex flex-col gap-3">
              <h2 className="font-h2 text-h2 text-on-surface">Profile Status</h2>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full font-label-sm text-label-sm ${me.doctorProfile?.onboardingStatus === "APPROVED" ? "bg-primary/10 text-primary" : "bg-tertiary-container/20 text-tertiary"}`}>
                  {me.doctorProfile?.onboardingStatus ?? "DRAFT"}
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                {me.doctorProfile?.specialization ?? "No specialization set"} {me.doctorProfile?.city ? `• ${me.doctorProfile.city}` : ""}
              </p>
            </div>
          </section>
          <section>
            <div className="premium-card flex flex-col gap-3">
              <h2 className="font-h2 text-h2 text-on-surface">Consult Settings</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">Online Status</p>
                  <p className="text-xs text-on-surface-variant">{isOnline ? 'Visible for instant consult' : 'Currently offline'}</p>
                </div>
                <button
                  onClick={toggleOnline}
                  disabled={savingSettings}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isOnline ? 'bg-primary' : 'bg-outline-variant'} disabled:opacity-50`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isOnline ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">Booking Mode</p>
                  <p className="text-xs text-on-surface-variant">{bookingMode === 'INSTANT' ? 'Auto-confirm bookings' : 'Manually approve each booking'}</p>
                </div>
                <button
                  onClick={toggleBookingMode}
                  disabled={savingSettings}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 bg-surface-container border-outline-variant text-on-surface hover:border-primary hover:text-primary"
                >
                  {bookingMode === 'INSTANT' ? 'INSTANT' : 'APPROVAL'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
