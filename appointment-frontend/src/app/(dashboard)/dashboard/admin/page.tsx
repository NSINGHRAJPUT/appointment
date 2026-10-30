"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { adminService } from "@/services/admin.service";
import { authService } from "@/services/auth.service";
import { getStoredToken } from "@/hooks/use-auth";
import { 
  Calendar, 
  Check, 
  NotepadText, 
  User, 
  X, 
  Mail, 
  Phone, 
  MapPin,
  Briefcase,
  Award,
  DollarSign,
  FileText,
  Users,
  Activity,
  TrendingUp,
  Clock,
  Shield,
  BookOpen,
  LayoutDashboard,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { blogService, type Blog } from "@/services/blog.service";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type Stats = {
  users: number;
  doctors: number;
  patients: number;
  pendingDoctors: number;
  appointments: number;
};
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
    const [statsData, pendingData, doctorsData, patientsData, apptsData] =
      await Promise.all([
        adminService.dashboard(token),
        adminService.pendingDoctors(token, 1, 20) as Promise<{
          items: PendingDoctor[];
        }>,
        adminService.allUsers(token, 1, 200, 'DOCTOR') as Promise<{
          items: any[];
          total: number;
        }>,
        adminService.allUsers(token, 1, 300, 'PATIENT') as Promise<{
          items: any[];
          total: number;
        }>,
        adminService.allAppointments(token, 1, 50) as Promise<{ items: any[] }>,
      ]);

    setStats(statsData);
    setPending(pendingData.items ?? []);
    setUsersList([
      ...(doctorsData.items ?? []),
      ...(patientsData.items ?? []),
    ]);
    setAppointmentsList(apptsData.items ?? []);
  }

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/auth");
      return;
    }
    authService
      .me(token)
      .then((data: any) => {
        if (data?.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }
        setMe(data);
        return load(token);
      })
      .catch(() => router.replace("/auth"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleApproval(doctorId: string, approve: boolean) {
    const token = getStoredToken();
    if (!token) return;
    setActionId(doctorId);
    try {
      await adminService.approveDoctor(
        token,
        doctorId,
        approve,
        approve ? undefined : "Rejected by admin",
      );
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
    <main className="grow max-w-container-max mx-auto w-full px-margin py-margin">
      <AdminSidebar
        me={me}
        stats={stats}
        error={error}
        pending={pending}
        handleApproval={handleApproval}
        actionId={actionId}
        users={usersList}
        appointments={appointmentsList}
      />
    </main>
  );
}

type AdminSection = "dashboard" | "doctors" | "users" | "appointments" | "blogs";

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ReactNode; badge?: (p: PendingDoctor[]) => number }[] = [
  { id: "dashboard",    label: "Dashboard",         icon: <LayoutDashboard size={18} /> },
  { id: "doctors",      label: "Doctor Approvals",  icon: <NotepadText size={18} />, badge: (p) => p.length },
  { id: "users",        label: "User Management",   icon: <Users size={18} /> },
  { id: "appointments", label: "Appointments",       icon: <Calendar size={18} /> },
  { id: "blogs",        label: "Blog Management",    icon: <BookOpen size={18} /> },
];

function AdminSidebar({
  me,
  stats,
  error,
  pending,
  handleApproval,
  actionId,
  users,
  appointments,
}: {
  me: any;
  stats: Stats | null;
  error: string | null;
  pending: PendingDoctor[];
  handleApproval: (id: string, approve: boolean) => void;
  actionId: string | null;
  users: any[];
  appointments: any[];
}) {
  const [active, setActive] = useState<AdminSection>("dashboard");

  return (
    <div className="flex gap-6 items-start">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white rounded-2xl border border-outline-variant overflow-hidden sticky top-24">
        <div className="p-4 border-b border-outline-variant">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Management</p>
        </div>
        <nav className="p-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const badge = item.badge?.(pending);
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active === item.id
                    ? "bg-primary text-white"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
                {badge ? (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    active === item.id ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"
                  }`}>{badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error mb-6">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {active === "dashboard" && (
        <DashboardTab me={me} stats={stats} pendingCount={pending.length} />
      )}

      {active === "doctors" && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-h2 text-h2 text-on-surface">
              Doctor Approvals
            </h2>
            {pending.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm">
                {pending.length} pending
              </span>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="premium-card flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Check size={28} />
              </div>
              <p className="font-bold text-lg text-on-surface">All caught up!</p>
              <p className="text-sm text-on-surface-variant">
                No pending doctor applications right now.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
              <div className="divide-y divide-outline-variant">
                {pending.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 hover:bg-surface transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-h3 text-h3 shrink-0">
                          {doc.user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-h3 text-h3 text-on-surface text-sm">
                            {doc.user.fullName}
                          </p>
                          <p className="font-body-md text-body-md text-secondary">
                            {doc.specialization ?? "—"}
                            {doc.city ? ` • ${doc.city}` : ""}
                          </p>
                          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                            {doc.user.email}
                            {doc.licenseNumber
                              ? ` • License: ${doc.licenseNumber}`
                              : ""}
                          </p>
                          {doc.submittedAt && (
                            <p className="font-label-xs text-label-xs text-on-surface-variant mt-1 uppercase tracking-wider">
                              Submitted{" "}
                              {new Date(doc.submittedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:shrink-0">
                        <button
                          disabled={actionId === doc.id}
                          onClick={() => handleApproval(doc.id, true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary font-label-sm text-label-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {actionId === doc.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
                          ) : (
                            <Check size={16} />
                          )}
                          Approve
                        </button>
                        <button
                          disabled={actionId === doc.id}
                          onClick={() => handleApproval(doc.id, false)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-error/30 text-error font-label-sm text-label-sm hover:bg-error/5 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          <X size={16} />
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

      {active === "users" && <UserManagementTab users={users} />}

      {active === "appointments" && (
        <AppointmentsTab appointments={appointments} />
      )}
      {active === "blogs" && <BlogManagementTab />}
      </div>
    </div>
  );
}

function DashboardTab({
  me,
  stats,
  pendingCount,
}: {
  me: any;
  stats: Stats | null;
  pendingCount: number;
}) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Operations</p>
        <h1 className="font-bold text-3xl text-on-surface mb-2">Admin dashboard</h1>
        <p className="text-on-surface-variant leading-relaxed">
          Welcome back, {me?.fullName ?? "Admin"}. Here&apos;s what needs your
          attention.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-outline-variant hover:border-primary/25 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-5">
            <div className="h-12 w-12 rounded-2xl bg-primary-container flex items-center justify-center text-primary">
              <Users size={22} />
            </div>
            <div className="flex items-center gap-1 text-primary text-xs font-semibold uppercase tracking-wide">
              <TrendingUp size={14} />
              Network
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">
              Total users
            </p>
            <p className="text-4xl font-bold text-on-surface tracking-tight">{stats?.users ?? "—"}</p>
            <p className="text-xs text-on-surface-variant mt-2">
              {stats?.doctors ?? 0} veterinarians · {stats?.patients ?? 0} pet parents
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-outline-variant hover:border-primary/25 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-5">
            <div className="h-12 w-12 rounded-2xl bg-tertiary-container flex items-center justify-center text-tertiary">
              <Clock size={22} />
            </div>
            <div className="flex items-center gap-1 text-tertiary text-xs font-semibold uppercase tracking-wide">
              <Activity size={14} />
              Queue
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">
              Pending approvals
            </p>
            <p className="text-4xl font-bold text-on-surface tracking-tight">
              {stats?.pendingDoctors ?? pendingCount ?? "—"}
            </p>
            <p className="text-xs text-on-surface-variant mt-2">Awaiting verification</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-outline-variant hover:border-primary/25 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-5">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-on-primary">
              <Calendar size={22} />
            </div>
            <div className="flex items-center gap-1 text-primary text-xs font-semibold uppercase tracking-wide">
              <TrendingUp size={14} />
              Bookings
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">
              Appointments
            </p>
            <p className="text-4xl font-bold text-on-surface tracking-tight">
              {stats?.appointments ?? "—"}
            </p>
            <p className="text-xs text-on-surface-variant mt-2">Total bookings</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BlogManagementTab() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const emptyBlog: Omit<Blog, 'id' | 'publishedAt' | 'createdAt'> = {
    title: '', slug: '', excerpt: '', content: '',
    coverImage: '', category: 'Health Tips', author: '', readMins: 5, status: 'DRAFT',
  };

  const token = typeof window !== 'undefined' ? getStoredToken() : null;

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await blogService.listAll(token, 1, 50);
      setBlogs(res.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!token || !editing) return;
    setLoading(true);
    setError(null);
    try {
      if (isNew) {
        await blogService.create(token, editing as any);
        setSuccess('Blog created');
      } else {
        await blogService.update(token, editing.id, editing as any);
        setSuccess('Blog updated');
      }
      setEditing(null);
      setIsNew(false);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token || !confirm('Delete this blog?')) return;
    setLoading(true);
    setError(null);
    try {
      await blogService.remove(token, id);
      setSuccess('Blog deleted');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function slugify(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-h2 text-h2 text-on-surface">Blog Management</h2>
        <button
          onClick={() => { setEditing({ ...emptyBlog } as any); setIsNew(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary font-label-sm text-label-sm hover:opacity-90 transition-all"
        >
          <Plus size={16} /> New Blog
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error mb-4">
          <X size={16} />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-full bg-primary-container border border-primary/20 px-4 py-3 text-sm text-primary mb-4">
          <Check size={16} />{success}
        </div>
      )}

      {loading && !editing ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
          {blogs.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">No blogs yet. Create your first one!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-high border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">Title</th>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">Category</th>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">Author</th>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">Published</th>
                    <th className="px-6 py-3 text-center font-semibold text-on-surface text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {blogs.map((blog) => (
                    <tr key={blog.id} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-on-surface">{blog.title}</p>
                        <p className="text-xs text-on-surface-variant">{blog.slug}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface">{blog.category}</td>
                      <td className="px-6 py-4 text-sm text-on-surface">{blog.author}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          blog.status === 'PUBLISHED' ? 'bg-primary-container text-primary' : 'bg-amber-50 text-amber-700'
                        }`}>{blog.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setEditing({ ...blog }); setIsNew(false); }}
                            className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors flex items-center gap-1"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(blog.id)}
                            className="px-3 py-1.5 rounded-lg border border-error/30 text-error text-xs font-medium hover:bg-error/5 transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Blog Editor Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen size={24} className="text-white" />
                <h3 className="text-xl font-bold text-white">{isNew ? 'New Blog Post' : 'Edit Blog Post'}</h3>
              </div>
              <button onClick={() => setEditing(null)} className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={(editing as any).title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: slugify(e.target.value) } as any)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={(editing as any).slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value } as any)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={(editing as any).author}
                    onChange={(e) => setEditing({ ...editing, author: e.target.value } as any)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={(editing as any).category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value } as any)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none"
                  >
                    {['Health Tips', 'Doctor Interviews', 'Technology', 'Research'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Read Time (mins)</label>
                  <input
                    type="number"
                    value={(editing as any).readMins}
                    onChange={(e) => setEditing({ ...editing, readMins: Number(e.target.value) } as any)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={(editing as any).status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as any } as any)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cover Image</label>
                  <div className="flex flex-col gap-2">
                    {(editing as any).coverImage && (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-gray-200">
                        <img src={(editing as any).coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditing({ ...editing, coverImage: '' } as any)}
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <label className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                      imageUploading ? 'border-primary/40 bg-primary/5 cursor-not-allowed' : 'border-gray-300 hover:border-primary hover:bg-primary/5'
                    }`}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={imageUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !token) return;
                          setImageUploading(true);
                          try {
                            const url = await blogService.uploadImage(token, file);
                            setEditing({ ...editing, coverImage: url } as any);
                          } catch (err) {
                            setError((err as Error).message);
                          } finally {
                            setImageUploading(false);
                            e.target.value = '';
                          }
                        }}
                      />
                      {imageUploading ? (
                        <><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /><span className="text-sm text-primary font-medium">Uploading...</span></>
                      ) : (
                        <><Plus size={16} className="text-gray-500" /><span className="text-sm text-gray-500 font-medium">{(editing as any).coverImage ? 'Replace image' : 'Upload cover image'}</span><span className="text-xs text-gray-400">(JPG, PNG, WebP · max 5MB)</span></>
                      )}
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Excerpt</label>
                  <textarea
                    rows={2}
                    value={(editing as any).excerpt}
                    onChange={(e) => setEditing({ ...editing, excerpt: e.target.value } as any)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
                  <RichTextEditor
                    value={(editing as any).content}
                    onChange={(html) => setEditing({ ...editing, content: html } as any)}
                    token={token ?? ""}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-3xl flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Check size={18} />}
                {isNew ? 'Create Blog' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function UserManagementTab({ users }: { users: any[] }) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userTab, setUserTab] = useState<"doctors" | "patients">("doctors");

  const doctors = users.filter((u) => u.role === "DOCTOR");
  const patients = users.filter((u) => u.role === "PATIENT");

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setEditingUser(null);
  };

  const handleEditUser = (user: any) => {
    setEditingUser({ ...user });
    setSelectedUser(null);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    const token =
      typeof window !== "undefined"
        ? getStoredToken()
        : null;
    if (!token) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {

      // Prepare update data
      const updateData: any = {
        fullName: editingUser.fullName,
        phoneNumber: editingUser.phoneNumber,
        gender: editingUser.gender,
        whatsappNumber: editingUser.whatsappNumber,
      };

      // Add doctor profile fields if applicable
      if (editingUser.role === "DOCTOR" && editingUser.doctorProfile) {
        updateData.specialization = editingUser.doctorProfile.specialization;
        updateData.licenseNumber = editingUser.doctorProfile.licenseNumber;
        updateData.clinicName = editingUser.doctorProfile.clinicName;
        updateData.city = editingUser.doctorProfile.city;
        updateData.yearsOfExperience =
          editingUser.doctorProfile.yearsOfExperience;
        updateData.bio = editingUser.doctorProfile.bio;
        updateData.priceCents = editingUser.doctorProfile.priceCents;
        updateData.currency = "INR";
        updateData.onboardingStatus =
          editingUser.doctorProfile.onboardingStatus;
      }

      // Add patient profile fields if applicable
      if (editingUser.role === "PATIENT" && editingUser.patientProfile) {
        updateData.address = editingUser.patientProfile.address;
      }

      await adminService.updateUserProfile(token, editingUser.id, updateData);
      setSuccess("User updated successfully");
      setEditingUser(null);
      // Refresh users list
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error("Error saving user:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: any) => {
    const token =
      typeof window !== "undefined" ? getStoredToken() : null;
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      if (user.isActive) {
        await adminService.deactivateUser(token, user.id);
        setSuccess("User deactivated successfully");
      } else {
        await adminService.activateUser(token, user.id);
        setSuccess("User activated successfully");
      }
      setSelectedUser(null);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-h2 text-h2 text-on-surface">User Management</h2>
        <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
          {users.length} Total
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error mb-4">
          <X size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-full bg-primary-container border border-primary/20 px-4 py-3 text-sm text-primary mb-4">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-outline-variant mb-6">
        <button
          className={`pb-2 px-1 font-medium ${userTab === "doctors" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          onClick={() => setUserTab("doctors")}
        >
          Doctors ({doctors.length})
        </button>
        <button
          className={`pb-2 px-1 font-medium ${userTab === "patients" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          onClick={() => setUserTab("patients")}
        >
          Patients ({patients.length})
        </button>
      </div>

      {/* Doctors Table */}
      {userTab === "doctors" && (
        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
          {doctors.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-body-md text-body-md">
              No doctors found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-high border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                      Onboarding
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-on-surface text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {doctors.map((doctor) => (
                    <tr
                      key={doctor.id}
                      className="hover:bg-surface transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                            {doctor.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-on-surface text-sm">
                              {doctor.fullName}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {doctor.phoneNumber || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-on-surface">
                          {doctor.email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-on-surface">
                          {doctor.doctorProfile?.specialization || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${doctor.isActive ? "bg-primary-container text-primary" : "bg-error/10 text-error"}`}
                        >
                          {doctor.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            doctor.doctorProfile?.onboardingStatus ===
                            "APPROVED"
                              ? "bg-primary/10 text-primary"
                              : doctor.doctorProfile?.onboardingStatus ===
                                  "SUBMITTED"
                                ? "bg-amber-50 text-amber-700"
                                : doctor.doctorProfile?.onboardingStatus ===
                                    "REJECTED"
                                  ? "bg-error/10 text-error"
                                  : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {doctor.doctorProfile?.onboardingStatus || "DRAFT"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewUser(doctor)}
                            className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                            title="View details"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditUser(doctor)}
                            className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                            title="Edit user"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(doctor)}
                            disabled={loading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              doctor.isActive
                                ? "border border-error/30 text-error hover:bg-error/5"
                                : "border border-primary/30 text-primary hover:bg-primary-container"
                            } disabled:opacity-50`}
                            title={doctor.isActive ? "Deactivate" : "Activate"}
                          >
                            {doctor.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Patients Table */}
      {userTab === "patients" && (
        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
          {patients.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-body-md text-body-md">
              No patients found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-high border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-on-surface text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-surface transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary font-semibold shrink-0">
                            {patient.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-on-surface text-sm">
                              {patient.fullName}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {patient.phoneNumber || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-on-surface">
                          {patient.email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-on-surface">
                          {patient.phoneNumber || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${patient.isActive ? "bg-primary-container text-primary" : "bg-error/10 text-error"}`}
                        >
                          {patient.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-on-surface-variant">
                          {new Date(patient.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewUser(patient)}
                            className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                            title="View details"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditUser(patient)}
                            className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                            title="Edit user"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(patient)}
                            disabled={loading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              patient.isActive
                                ? "border border-error/30 text-error hover:bg-error/5"
                                : "border border-primary/30 text-primary hover:bg-primary-container"
                            } disabled:opacity-50`}
                            title={patient.isActive ? "Deactivate" : "Activate"}
                          >
                            {patient.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* View User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-8 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedUser.fullName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedUser.role === 'DOCTOR' ? 'bg-primary text-on-primary' : 
                        selectedUser.role === 'ADMIN' ? 'bg-secondary text-on-secondary' : 
                        'bg-tertiary text-on-tertiary'
                      }`}>
                        {selectedUser.role}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedUser.isActive ? 'bg-primary text-on-primary' : 'bg-error text-on-error'
                      }`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body - Two Column Layout */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <User size={20} className="text-primary" />
                  Contact Information
                </h4>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-primary mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-primary mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedUser.phoneNumber || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedUser.whatsappNumber || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield size={18} className="text-primary mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedUser.gender || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information (Doctors only) */}
              {selectedUser.doctorProfile && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Briefcase size={20} className="text-primary" />
                    Professional Details
                  </h4>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Award size={18} className="text-primary mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                          {selectedUser.doctorProfile.specialization || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FileText size={18} className="text-primary mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Onboarding Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                          selectedUser.doctorProfile.onboardingStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          selectedUser.doctorProfile.onboardingStatus === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' :
                          selectedUser.doctorProfile.onboardingStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedUser.doctorProfile.onboardingStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Information (Patients only) */}
              {selectedUser.patientProfile && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <User size={20} className="text-primary" />
                    Patient Details
                  </h4>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-primary mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                          {selectedUser.patientProfile.address || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-gray-50 rounded-b-3xl flex gap-3">
              <button
                onClick={() => handleEditUser(selectedUser)}
                className="flex-1 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
              >
                Edit Profile
              </button>
              <button
                onClick={() => handleToggleActive(selectedUser)}
                disabled={loading}
                className={`flex-1 px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl ${
                  selectedUser.isActive
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-primary text-on-primary hover:bg-primary-hover'
                } disabled:opacity-50`}
              >
                {loading ? 'Processing...' : selectedUser.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-8 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold">
                    {editingUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Edit User Profile</h3>
                    <p className="text-white/80 text-sm mt-1">{editingUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body - Multi-column Form */}
            <div className="p-8">
              {/* Basic Information */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                  <User size={20} className="text-primary" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <User size={16} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editingUser.fullName}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, fullName: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Phone size={16} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editingUser.phoneNumber || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Shield size={16} />
                      Gender
                    </label>
                    <select
                      value={editingUser.gender || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, gender: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Phone size={16} className="text-green-600" />
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={editingUser.whatsappNumber || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          whatsappNumber: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Doctor Profile */}
              {editingUser.role === "DOCTOR" && editingUser.doctorProfile && (
                <div className="mb-8 bg-primary-container/50 rounded-2xl p-6 border-2 border-primary/20">
                  <h4 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-6">
                    <Briefcase size={20} className="text-primary" />
                    Professional Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Award size={16} />
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={editingUser.doctorProfile.specialization || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            doctorProfile: {
                              ...editingUser.doctorProfile,
                              specialization: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-white"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <FileText size={16} />
                        License Number
                      </label>
                      <input
                        type="text"
                        value={editingUser.doctorProfile.licenseNumber || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            doctorProfile: {
                              ...editingUser.doctorProfile,
                              licenseNumber: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-white"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Briefcase size={16} />
                        Clinic Name
                      </label>
                      <input
                        type="text"
                        value={editingUser.doctorProfile.clinicName || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            doctorProfile: {
                              ...editingUser.doctorProfile,
                              clinicName: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-white"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <MapPin size={16} />
                        City
                      </label>
                      <input
                        type="text"
                        value={editingUser.doctorProfile.city || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            doctorProfile: {
                              ...editingUser.doctorProfile,
                              city: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-white"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Clock size={16} />
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        value={editingUser.doctorProfile.yearsOfExperience || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            doctorProfile: {
                              ...editingUser.doctorProfile,
                              yearsOfExperience: e.target.value
                                ? Number(e.target.value)
                                : null,
                            },
                          })
                        }
                        className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-white"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <DollarSign size={16} />
                        Consultation Price (INR)
                      </label>
                      <input
                        type="number"
                        value={
                          editingUser.doctorProfile.priceCents
                            ? editingUser.doctorProfile.priceCents / 100
                            : ""
                        }
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            doctorProfile: {
                              ...editingUser.doctorProfile,
                              priceCents: e.target.value
                                ? Math.round(Number(e.target.value) * 100)
                                : 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <FileText size={16} />
                        Bio
                      </label>
                      <textarea
                        value={editingUser.doctorProfile.bio || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            doctorProfile: {
                              ...editingUser.doctorProfile,
                              bio: e.target.value,
                            },
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors resize-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Activity size={16} />
                        Onboarding Status
                      </label>
                      <select
                        value={editingUser.doctorProfile.onboardingStatus || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            doctorProfile: {
                              ...editingUser.doctorProfile,
                              onboardingStatus: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-white"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Profile */}
              {editingUser.role === "PATIENT" && editingUser.patientProfile && (
                <div className="mb-8 bg-green-50/50 rounded-2xl p-6 border-2 border-green-100">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                    <User size={20} className="text-green-600" />
                    Patient Information
                  </h4>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <MapPin size={16} />
                      Address
                    </label>
                    <input
                      type="text"
                      value={editingUser.patientProfile.address || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          patientProfile: {
                            ...editingUser.patientProfile,
                            address: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-gray-50 rounded-b-3xl flex gap-3">
              <button
                onClick={handleSaveUser}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <X size={20} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function AppointmentsTab({ appointments }: { appointments: any[] }) {
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    REQUESTED: { label: 'Awaiting Approval', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONFIRMED: { label: 'Confirmed', cls: 'bg-primary/10 text-primary border-primary/20' },
    COMPLETED: { label: 'Completed', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-error/10 text-error border-error/20' },
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-h2 text-h2 text-on-surface">
          Platform Appointments
        </h2>
        <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
          {appointments.length} Total
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant font-body-md text-body-md">
            No appointments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-high border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-on-surface text-sm">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-on-surface text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {appointments.map((appt) => {
                  const statusInfo = STATUS_LABEL[appt.status] || { label: appt.status, cls: 'bg-surface text-on-surface' };
                  return (
                    <tr
                      key={appt.id}
                      className="hover:bg-surface transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                            {appt.doctor?.user?.fullName?.charAt(0) ?? '?'}
                          </div>
                          <p className="text-sm text-on-surface font-medium">
                            {appt.doctor?.user?.fullName ?? 'Unknown'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-on-surface font-medium">
                          {appt.patientName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-on-surface">
                          {new Date(appt.startAt).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-on-surface-variant">
                          {appt.isInstant ? 'Instant' : 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedAppt(appt)}
                            className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                            title="View details"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-8 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold">
                    {selectedAppt.doctor?.user?.fullName?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Appointment Details</h3>
                    <p className="text-white/80 text-sm mt-1">Dr. {selectedAppt.doctor?.user?.fullName ?? 'Unknown'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAppt(null)}
                  className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Doctor Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Briefcase size={20} className="text-primary" />
                    Doctor Information
                  </h4>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <User size={18} className="text-primary mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                          Dr. {selectedAppt.doctor?.user?.fullName ?? 'N/A'}
                        </p>
                      </div>
                    </div>

                    {selectedAppt.doctor?.specialization && (
                      <div className="flex items-start gap-3">
                        <Award size={18} className="text-primary mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {selectedAppt.doctor.specialization}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedAppt.doctor?.priceCents !== undefined && (
                      <div className="flex items-start gap-3">
                        <DollarSign size={18} className="text-primary mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {selectedAppt.doctor.priceCents === 0 ? 'Free' : `₹${(selectedAppt.doctor.priceCents / 100).toFixed(0)}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <User size={20} className="text-primary" />
                    Patient Information
                  </h4>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <User size={18} className="text-primary mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedAppt.patientName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone size={18} className="text-primary mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedAppt.patientPhone}</p>
                      </div>
                    </div>

                    {selectedAppt.patientEmail && (
                      <div className="flex items-start gap-3">
                        <Mail size={18} className="text-primary mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedAppt.patientEmail}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="mt-8 space-y-4">
                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Calendar size={20} className="text-primary" />
                  Appointment Details
                </h4>

                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date & Time</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedAppt.startAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedAppt.isInstant ? 'Instant Consultation' : 'Scheduled Appointment'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      STATUS_LABEL[selectedAppt.status]?.cls ?? 'bg-gray-100 text-gray-700'
                    }`}>
                      {STATUS_LABEL[selectedAppt.status]?.label ?? selectedAppt.status}
                    </span>
                  </div>

                  {selectedAppt.reason && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Reason</p>
                      <p className="text-sm font-medium text-gray-900">{selectedAppt.reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-gray-50 rounded-b-3xl flex gap-3">
              <a
                href={`/appointments/${selectedAppt.id}`}
                className="flex-1 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl text-center"
              >
                View Full Details
              </a>
              <button
                onClick={() => setSelectedAppt(null)}
                className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
