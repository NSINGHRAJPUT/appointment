'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, MessageCircle, Phone, Check, X, Star } from 'lucide-react';
import { videoCallEnabled } from '@/lib/features';
import { getStoredToken } from '@/hooks/use-auth';
import { appointmentService } from '@/services/appointment.service';
import { apiFetch, waLink } from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type Appointment = {
  id: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  startAt: string;
  endAt: string;
  reason: string | null;
  isInstant: boolean;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  doctor?: {
    id: string;
    specialization: string | null;
    priceCents: number;
    user: { fullName: string; whatsappNumber?: string };
  };
  patient?: {
    id: string;
    user: { fullName: string; whatsappNumber?: string };
  };
  conversation: { id: string } | null;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  REQUESTED: { label: 'Awaiting Approval', cls: 'bg-secondary-container/50 text-secondary border-secondary/20' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-primary/10 text-primary border-primary/20' },
  COMPLETED: { label: 'Completed', cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-error/10 text-error border-error/20' },
};

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelDialogMode, setCancelDialogMode] = useState<'cancel' | 'reject'>('cancel');
  const [approving, setApproving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [userRole, setUserRole] = useState<'PATIENT' | 'DOCTOR' | 'ADMIN' | null>(null);

  // Review state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { router.replace('/auth'); return; }
    
    import('@/services/auth.service').then(({ authService }) => {
      authService.me(token).then((me: any) => setUserRole(me.role)).catch(console.error);
    });

    // Fetch appointment by ID directly - most efficient approach
    import('@/services/appointment.service').then(({ appointmentService }) => {
      appointmentService.getById(token, id)
        .then((data: any) => {
          setAppt(data);
          if (!data) setError('Appointment not found');
        })
        .catch(e => setError((e as Error).message))
        .finally(() => setLoading(false));
    });
  }, [id, router]);

  async function handleCancel() {
    const token = getStoredToken();
    if (!token || !appt) return;
    setCancelling(true);
    try {
      await appointmentService.updateStatus(token, appt.id, 'CANCELLED');
      setAppt(prev => prev ? { ...prev, status: 'CANCELLED' } : prev);
      setCancelDialogOpen(false);
    } catch (e) { setError((e as Error).message); }
    finally { setCancelling(false); }
  }

  function openCancelDialog(mode: 'cancel' | 'reject') {
    setCancelDialogMode(mode);
    setCancelDialogOpen(true);
  }

  async function handleApprove() {
    const token = getStoredToken();
    if (!token || !appt) return;
    setApproving(true);
    try {
      await appointmentService.updateStatus(token, appt.id, 'CONFIRMED');
      setAppt(prev => prev ? { ...prev, status: 'CONFIRMED' } : prev);
    } catch (e) { setError((e as Error).message); }
    finally { setApproving(false); }
  }

  async function handleComplete() {
    const token = getStoredToken();
    if (!token || !appt) return;
    setCompleting(true);
    try {
      await appointmentService.updateStatus(token, appt.id, 'COMPLETED');
      setAppt(prev => prev ? { ...prev, status: 'COMPLETED' } : prev);
    } catch (e) { setError((e as Error).message); }
    finally { setCompleting(false); }
  }

  async function handleReview() {
    const token = getStoredToken();
    if (!token || !appt || rating === 0) return;
    setSubmittingReview(true);
    try {
      await apiFetch(`/reviews`, {
        method: 'POST',
        body: JSON.stringify({ appointmentId: appt.id, rating, comment: comment.trim() || undefined }),
      }, token);
      setReviewDone(true);
    } catch (e) { setError((e as Error).message); }
    finally { setSubmittingReview(false); }
  }

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );

  if (error || !appt) return (
    <div className="max-w-lg mx-auto p-6 text-center">
      <p className="text-error">{error ?? 'Appointment not found'}</p>
      <a href="/dashboard" className="mt-4 inline-block text-primary hover:underline">← Back to Dashboard</a>
    </div>
  );

  const statusInfo = STATUS_LABEL[appt.status] || { label: appt.status, cls: 'bg-surface text-on-surface' };
  const waUrl = appt.doctor?.user.whatsappNumber ? waLink(appt.doctor.user.whatsappNumber) : (appt.patient?.user.whatsappNumber ? waLink(appt.patient.user.whatsappNumber) : null);
  const canCancel = ['REQUESTED', 'CONFIRMED'].includes(appt.status);
  const canChat = ['CONFIRMED', 'COMPLETED'].includes(appt.status);
  const canCall = appt.status === 'CONFIRMED' && videoCallEnabled;
  const canReview = appt.status === 'COMPLETED' && !reviewDone && userRole === 'PATIENT';
  const canApprove = appt.status === 'REQUESTED' && (userRole === 'DOCTOR' || userRole === 'ADMIN');
  const canComplete = appt.status === 'CONFIRMED' && (userRole === 'DOCTOR' || userRole === 'ADMIN');
  const chatHref = appt.conversation?.id
    ? `/chat?conversationId=${appt.conversation.id}`
    : `/chat?appointmentId=${appt.id}`;

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <a href="/dashboard" className="text-sm text-primary hover:underline">← Dashboard</a>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.cls}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Doctor card */}
      {appt.doctor && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-container text-primary flex items-center justify-center font-bold text-lg">
              {appt.doctor.user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-on-surface">Dr. {appt.doctor.user.fullName}</h1>
              <p className="text-sm text-on-surface-variant">{appt.doctor.specialization ?? 'General Practice'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Patient card */}
      {(userRole === 'DOCTOR' || userRole === 'ADMIN') && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container/40 text-secondary flex items-center justify-center font-bold text-lg">
              {appt.patientName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-on-surface">Patient: {appt.patientName}</h1>
              <p className="text-sm text-on-surface-variant">{appt.patientPhone} {appt.patientEmail ? `• ${appt.patientEmail}` : ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Info */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Date & Time</p>
            <p className="font-medium text-on-surface">
              {new Date(appt.startAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Type</p>
            <p className="font-medium text-on-surface">
              {appt.isInstant ? 'Instant Consult' : 'Scheduled'}
            </p>
          </div>
          {appt.reason && (
            <div className="col-span-2">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Reason</p>
              <p className="text-on-surface">{appt.reason}</p>
            </div>
          )}
        </div>

        {/* Status-specific message */}
        {appt.status === 'REQUESTED' && userRole === 'PATIENT' && (
          <div className="rounded-2xl bg-secondary-container/40 border border-secondary/20 px-4 py-3 text-sm text-secondary">
            Waiting for your vet to approve this appointment.
          </div>
        )}
        {appt.status === 'REQUESTED' && (userRole === 'DOCTOR' || userRole === 'ADMIN') && (
          <div className="rounded-2xl bg-secondary-container/40 border border-secondary/20 px-4 py-3 text-sm text-secondary">
            This appointment is awaiting your approval. Approve or reject below.
          </div>
        )}
        {appt.status === 'CONFIRMED' && userRole === 'PATIENT' && (
          <div className="rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary">
            Your appointment is confirmed. You can join the call or chat below.
          </div>
        )}
        {appt.status === 'CONFIRMED' && (userRole === 'DOCTOR' || userRole === 'ADMIN') && (
          <div className="rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary">
            This appointment is confirmed. You can start the call or mark it as completed.
          </div>
        )}
      </div>

      {/* Doctor Approve/Reject Banner */}
      {canApprove && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-on-surface">Appointment Action Required</h2>
          <p className="text-sm text-on-surface-variant">This patient has requested an appointment. Would you like to approve or reject it?</p>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-3">
            <button onClick={handleApprove} disabled={approving || cancelling}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
              {approving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Approve Appointment
            </button>
            <button onClick={() => openCancelDialog('reject')} disabled={approving || cancelling}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border border-error/30 text-error text-sm font-semibold hover:bg-error/5 transition-all disabled:opacity-50">
              {cancelling ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        {canChat && (
          <a href={chatHref}
            className="flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all">
            <MessageCircle size={16} /> Open Chat
          </a>
        )}
        {canCall && (
          <a href={`/call?appointmentId=${appt.id}`}
            className="flex items-center justify-center gap-2 py-3 rounded-full border border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-all">
            <Phone size={16} /> Join Call
          </a>
        )}
        {canComplete && (
          <button onClick={handleComplete} disabled={completing}
            className="flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {completing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Mark Completed
          </button>
        )}
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 rounded-full bg-primary-container border border-primary/20 text-primary text-sm font-medium hover:bg-primary/10 transition-all">
            <MessageCircle size={16} />
            WhatsApp
          </a>
        )}
        {canCancel && !canApprove && (
          <button onClick={() => openCancelDialog('cancel')} disabled={cancelling}
            className="flex items-center justify-center gap-2 py-3 rounded-full border border-error/30 text-error text-sm font-medium hover:bg-error/5 transition-all disabled:opacity-50">
            {cancelling ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Cancel
          </button>
        )}
      </div>

      {/* Review section */}
      {canReview && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-on-surface">Leave a Review</h2>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={24} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-outline-variant'} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Share your experience (optional)…" rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          {error && <p className="text-sm text-error">{error}</p>}
          <button onClick={handleReview} disabled={rating === 0 || submittingReview}
            className="w-full py-3 rounded-full bg-primary text-on-primary text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Submit Review
          </button>
        </div>
      )}

      {reviewDone && (
        <div className="rounded-full bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary flex items-center gap-2">
          <Check size={16} /> Review submitted. Thank you!
        </div>
      )}

      <ConfirmDialog
        open={cancelDialogOpen}
        title={cancelDialogMode === 'reject' ? 'Reject appointment?' : 'Cancel appointment?'}
        description={
          cancelDialogMode === 'reject'
            ? 'This will decline the appointment request. The patient will be notified that their booking was not accepted.'
            : 'Are you sure you want to cancel this appointment? This action cannot be undone.'
        }
        confirmLabel={cancelDialogMode === 'reject' ? 'Reject appointment' : 'Yes, cancel'}
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelDialogOpen(false)}
      />
    </main>
  );
}
