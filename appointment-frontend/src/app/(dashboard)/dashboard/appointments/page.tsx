"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/hooks/use-auth";
import { appointmentService } from "@/services/appointment.service";
import { Calendar, Stethoscope, User, Video } from "lucide-react";

export default function AllAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [userRole, setUserRole] = useState<'PATIENT' | 'DOCTOR' | 'ADMIN' | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/auth");
      return;
    }

    import('@/services/auth.service').then(({ authService }) => {
      authService.me(token).then((me: any) => setUserRole(me.role)).catch(console.error);
    });

    appointmentService
      .myAppointments(token)
      .then((data: any) => {
        setAppointments(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const upcoming = appointments.filter(
    (a) => ["CONFIRMED", "REQUESTED"].includes(a.status) && new Date(a.startAt) > new Date()
  );
  const past = appointments.filter(
    (a) => a.status === "COMPLETED" || a.status === "CANCELLED" || new Date(a.startAt) <= new Date()
  );

  const displayList = filter === 'upcoming' ? upcoming : past;

  return (
    <>
      <style>{`body { background-color: #f8fafc; } .premium-card { background-color: #ffffff; border-radius: 0.75rem; border: 1px solid #e2e8f0; padding: 24px; } .btn-primary { background-color: #00685f; color: #ffffff; border-radius: 0.5rem; transition: background-color 0.2s; } .btn-primary:hover { background-color: #005049; }`}</style>
      
      <main className="max-w-[1000px] mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <a href="/dashboard" className="text-sm text-primary hover:underline">← Dashboard</a>
        </div>

        <section className="mb-8">
          <h1 className="font-h1 text-h1 text-on-surface mb-2">My Appointments</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">View and manage all your scheduled and past appointments.</p>
        </section>

        <div className="flex gap-2 mb-6 border-b border-surface-variant/50 pb-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 font-label-sm rounded-lg transition-colors ${filter === 'upcoming' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 font-label-sm rounded-lg transition-colors ${filter === 'past' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            Past ({past.length})
          </button>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              No {filter} appointments found.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {displayList.map((appt) => (
                <div key={appt.id} className="p-4 sm:p-6 hover:bg-surface transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined">
                        {userRole === 'DOCTOR' ? <User /> : <Stethoscope />}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-h3 text-h3 text-on-surface">
                        {userRole === 'DOCTOR' ? appt.patientName : appt.doctor?.user?.fullName}
                      </h3>
                      <p className="font-body-md text-secondary text-sm">
                        {userRole === 'DOCTOR' 
                          ? `${appt.patientPhone} ${appt.reason ? `• ${appt.reason}` : ''}`
                          : appt.doctor?.specialization ?? 'General Practice'
                        }
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]"><Calendar /></span>
                        <span className="text-xs font-medium">
                          {new Date(appt.startAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-2 sm:ml-auto pl-16 sm:pl-0">
                    <span className={`px-2 py-1 rounded font-label-xs text-label-xs uppercase tracking-wider w-fit ${
                      appt.status === 'CONFIRMED' ? 'bg-primary/10 text-primary' :
                      appt.status === 'COMPLETED' ? 'bg-surface-container-high text-on-surface-variant' :
                      appt.status === 'CANCELLED' ? 'bg-error/10 text-error' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {appt.status}
                    </span>
                    <a
                      href={`/appointments/${appt.id}`}
                      className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
