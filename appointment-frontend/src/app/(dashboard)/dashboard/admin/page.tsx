"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminService } from '@/services/admin.service';
import { authService } from '@/services/auth.service';
import { getStoredToken } from '@/hooks/use-auth';
import { Calendar, Check, NotepadText, User, X } from "lucide-react";

type Stats = { users: number; pendingDoctors: number; appointments: number };
type PendingDoctor = {
  id: string;
  specialization: string | null;
  city: string | null;
  licenseNumber: string | null;
  submittedAt: string | null;
  user: { fullName: string; email: string };
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [usersList, setUsersList] = useState<any[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);

  async function load(token: string) {
    const [statsData, pendingData, usersData, apptsData] = await Promise.all([
      adminService.dashboard(token),
      adminService.pendingDoctors(token, 1, 20) as Promise<{ items: PendingDoctor[] }>,
      adminService.allUsers(token, 1, 50) as Promise<{ items: any[] }>,
      adminService.allAppointments(token, 1, 50) as Promise<{ items: any[] }>,
    ]);
    setStats(statsData);
    setPending(pendingData.items ?? []);
    setUsersList(usersData.items ?? []);
    setAppointmentsList(apptsData.items ?? []);
  }

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { router.replace('/auth'); return; }
    authService.me(token).then((data: any) => {
      if (data?.role !== "ADMIN") { router.replace("/dashboard"); return; }
      setMe(data);
      return load(token);
    }).catch(() => router.replace("/auth")).finally(() => setLoading(false));
  }, [router]);

  async function handleApproval(doctorId: string, approve: boolean) {
    const token = getStoredToken();
    if (!token) return;
    setActionId(doctorId);
    try {
      await adminService.approveDoctor(token, doctorId, approve, approve ? undefined : "Rejected by admin");
      await load(token);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <style>{`body { background-color: #f8fafc; } .premium-card { background-color: #ffffff; border-radius: 0.75rem; border: 1px solid #e2e8f0; padding: 24px; } .premium-card:hover { box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.02); }`}</style>

      <main className="flex-grow max-w-[1440px] mx-auto w-full px-margin py-margin flex flex-col gap-margin">

        {/* Header */}
        <section>
          <h1 className="font-h1 text-h1 text-on-surface mb-2">
            Admin Dashboard
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Welcome back, {me?.fullName ?? "Admin"}. Here's what needs your attention.
          </p>
        </section>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
          <div className="premium-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]"><User /></span>
            </div>
            <div>
              <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Total Users</p>
              <p className="font-h1 text-h1 text-on-surface">{stats?.users ?? "—"}</p>
            </div>
          </div>
          <div className="premium-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-tertiary-container/30 flex items-center justify-center text-tertiary flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]"><NotepadText /></span>
            </div>
            <div>
              <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Pending Doctors</p>
              <p className="font-h1 text-h1 text-on-surface">{stats?.pendingDoctors ?? "—"}</p>
            </div>
          </div>
          <div className="premium-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-secondary-container/40 flex items-center justify-center text-secondary flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]"><Calendar/></span>
            </div>
            <div>
              <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Appointments</p>
              <p className="font-h1 text-h1 text-on-surface">{stats?.appointments ?? "—"}</p>
            </div>
          </div>
        </section>

        <TabsSection pending={pending} handleApproval={handleApproval} actionId={actionId} users={usersList} appointments={appointmentsList} />

      </main>
    </>
  );
}

function TabsSection({ pending, handleApproval, actionId, users, appointments }: { pending: PendingDoctor[], handleApproval: (id: string, approve: boolean) => void, actionId: string | null, users: any[], appointments: any[] }) {
  const [activeTab, setActiveTab] = useState<'doctors' | 'users' | 'appointments'>('doctors');

  return (
    <div className="mt-8">
      <div className="flex space-x-4 border-b border-zinc-200 mb-6">
        <button 
          className={`pb-2 px-1 font-medium ${activeTab === 'doctors' ? 'border-b-2 border-primary text-primary' : 'text-zinc-500 hover:text-zinc-700'}`}
          onClick={() => setActiveTab('doctors')}
        >
          Doctor Management
        </button>
        <button 
          className={`pb-2 px-1 font-medium ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-zinc-500 hover:text-zinc-700'}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button 
          className={`pb-2 px-1 font-medium ${activeTab === 'appointments' ? 'border-b-2 border-primary text-primary' : 'text-zinc-500 hover:text-zinc-700'}`}
          onClick={() => setActiveTab('appointments')}
        >
          Appointments
        </button>
      </div>

      {activeTab === 'doctors' && (
        <section>
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-h2 text-h2 text-on-surface">Doctor Approvals</h2>
            {pending.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm">
                {pending.length} pending
              </span>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="premium-card flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[28px]"><Check/></span>
              </div>
              <p className="font-h3 text-h3 text-on-surface">All caught up!</p>
              <p className="font-body-md text-body-md text-on-surface-variant">No pending doctor applications right now.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
              <div className="divide-y divide-[#E2E8F0]">
                {pending.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-surface transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-h3 text-h3 flex-shrink-0">
                          {doc.user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-h3 text-h3 text-on-surface text-sm">{doc.user.fullName}</p>
                          <p className="font-body-md text-body-md text-secondary text-xs">
                            {doc.specialization ?? "—"}{doc.city ? ` • ${doc.city}` : ""}
                          </p>
                          <p className="font-body-md text-body-md text-on-surface-variant text-xs mt-0.5">
                            {doc.user.email}
                            {doc.licenseNumber ? ` • License: ${doc.licenseNumber}` : ""}
                          </p>
                          {doc.submittedAt && (
                            <p className="font-label-xs text-label-xs text-on-surface-variant mt-1 uppercase tracking-wider">
                              Submitted {new Date(doc.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:flex-shrink-0">
                        <button
                          disabled={actionId === doc.id}
                          onClick={() => handleApproval(doc.id, true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {actionId === doc.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
                          ) : (
                            <span className="material-symbols-outlined text-[16px]"><Check/></span>
                          )}
                          Approve
                        </button>
                        <button
                          disabled={actionId === doc.id}
                          onClick={() => handleApproval(doc.id, false)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-error/30 text-error font-label-sm text-label-sm hover:bg-error/5 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]"><X /></span>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'users' && (
        <section>
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-h2 text-h2 text-on-surface">Registered Users</h2>
            <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
              {users.length} Total
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            {users.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-body-md text-body-md">
                No users found.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {users.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-surface transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-h3 text-h3 shrink-0">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-h3 text-h3 text-on-surface text-sm">{user.fullName}</p>
                          <p className="font-body-md text-secondary text-xs">{user.email} {user.phoneNumber ? `• ${user.phoneNumber}` : ""}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded font-label-xs text-label-xs uppercase tracking-wider ${user.role === 'DOCTOR' ? 'bg-primary/10 text-primary' : user.role === 'ADMIN' ? 'bg-tertiary-container/30 text-tertiary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'appointments' && (
        <section>
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-h2 text-h2 text-on-surface">Platform Appointments</h2>
            <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
              {appointments.length} Total
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-body-md text-body-md">
                No appointments found.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {appointments.map((appt) => (
                  <div key={appt.id} className="p-4 hover:bg-surface transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined"><Calendar /></span>
                        </div>
                        <div>
                          <p className="font-h3 text-h3 text-on-surface text-sm">
                            Doctor: {appt.doctor?.user?.fullName ?? "Unknown"} • Patient: {appt.patientName}
                          </p>
                          <p className="font-body-md text-secondary text-xs mt-0.5">
                            {new Date(appt.startAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded font-label-xs text-label-xs uppercase tracking-wider ${
                          appt.status === 'CONFIRMED' ? 'bg-primary/10 text-primary' :
                          appt.status === 'COMPLETED' ? 'bg-surface-container-high text-on-surface-variant' :
                          appt.status === 'CANCELLED' ? 'bg-error/10 text-error' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {appt.status}
                        </span>
                        <a href={`/appointments/${appt.id}`} className="text-primary hover:underline text-sm font-medium">
                          View Details
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>

  )}
