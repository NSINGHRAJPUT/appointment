"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/hooks/use-auth";
import { appointmentService } from "@/services/appointment.service";
import { Calendar, CalendarDays, Search, Stethoscope, User } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-primary/10 text-primary",
  REQUESTED: "bg-secondary-container/50 text-secondary",
  COMPLETED: "bg-surface-container-high text-on-surface-variant",
  CANCELLED: "bg-error/10 text-error",
};

export default function AllAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [userRole, setUserRole] = useState<"PATIENT" | "DOCTOR" | "ADMIN" | null>(
    null,
  );

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/auth");
      return;
    }

    import("@/services/auth.service").then(({ authService }) => {
      authService
        .me(token)
        .then((me: any) => setUserRole(me.role))
        .catch(console.error);
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
    (a) =>
      ["CONFIRMED", "REQUESTED"].includes(a.status) &&
      new Date(a.startAt) > new Date(),
  );
  const past = appointments.filter(
    (a) =>
      a.status === "COMPLETED" ||
      a.status === "CANCELLED" ||
      new Date(a.startAt) <= new Date(),
  );

  const displayList = filter === "upcoming" ? upcoming : past;

  return (
    <>
      <style>{`body { background-color: var(--background); }`}</style>

      <main className="mx-auto w-full max-w-[1000px] px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-primary hover:underline"
          >
            ← Dashboard
          </Link>
        </div>

        <section className="mb-8">
          <h1 className="font-display text-h1 font-semibold text-on-surface mb-2">
            My Appointments
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            View and manage all your scheduled and past appointments.
          </p>
        </section>

        <div className="mb-6 flex gap-2 border-b border-outline-variant pb-2">
          <button
            onClick={() => setFilter("upcoming")}
            className={`rounded-full px-4 py-2 font-label-sm transition-colors ${
              filter === "upcoming"
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`rounded-full px-4 py-2 font-label-sm transition-colors ${
              filter === "past"
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            Past ({past.length})
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<CalendarDays className="h-7 w-7" />}
                title={`No ${filter} appointments`}
                description={
                  filter === "upcoming"
                    ? userRole === "DOCTOR"
                      ? "When patients book with you, they will show up here."
                      : "Book a consultation with a trusted vet to get started."
                    : "Completed and cancelled visits will appear here."
                }
                actionLabel={
                  filter === "upcoming" && userRole !== "DOCTOR"
                    ? "Find a vet"
                    : undefined
                }
                href={
                  filter === "upcoming" && userRole !== "DOCTOR"
                    ? "/doctors"
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {displayList.map((appt) => (
                <div
                  key={appt.id}
                  className="flex flex-col gap-4 p-4 transition-colors hover:bg-surface-container-low sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="flex items-start gap-4 sm:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary">
                      {userRole === "DOCTOR" ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Stethoscope className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-h3 text-h3 text-on-surface">
                        {userRole === "DOCTOR"
                          ? appt.patientName
                          : appt.doctor?.user?.fullName}
                      </h3>
                      <p className="font-body-md text-sm text-secondary">
                        {userRole === "DOCTOR"
                          ? `${appt.patientPhone ?? ""} ${appt.reason ? `• ${appt.reason}` : ""}`
                          : (appt.doctor?.specialization ?? "General Practice")}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-on-surface-variant">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          {new Date(appt.startAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pl-16 sm:ml-auto sm:items-end sm:pl-0">
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 font-label-xs text-label-xs uppercase tracking-wider ${
                        STATUS_STYLES[appt.status] ??
                        "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {appt.status}
                    </span>
                    <Link
                      href={`/appointments/${appt.id}`}
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && filter === "upcoming" && userRole !== "DOCTOR" && displayList.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              href="/doctors"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Search className="h-4 w-4" />
              Book another visit
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
