'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Video, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  AppNotification,
  notificationService,
} from '@/services/notification.service';

type IncomingRequest = {
  notificationId: string;
  appointmentId: string;
  title: string;
  body: string;
  isInstant: boolean;
};

function parseIncoming(n: AppNotification): IncomingRequest | null {
  const meta = (n.meta ?? {}) as {
    appointmentId?: string;
    isInstant?: boolean;
  };
  const appointmentId =
    meta.appointmentId ||
    n.linkUrl?.match(/\/appointments\/([^/?#]+)/)?.[1] ||
    '';
  if (!appointmentId) return null;

  const instantTypes = new Set([
    'APPOINTMENT_REQUESTED',
    'APPOINTMENT_BOOKED',
    'APPOINTMENT_CONFIRMED',
  ]);
  if (!instantTypes.has(n.type)) return null;

  const isInstant =
    Boolean(meta.isInstant) ||
    /instant/i.test(n.title) ||
    /instant/i.test(n.body);

  // Surface instant consults prominently; also show new requests while doctor is working
  if (!isInstant && n.type !== 'APPOINTMENT_REQUESTED') return null;

  return {
    notificationId: n.id,
    appointmentId,
    title: n.title,
    body: n.body,
    isInstant,
  };
}

export function IncomingRequestModal({ token }: { token: string }) {
  const router = useRouter();
  const [incoming, setIncoming] = useState<IncomingRequest | null>(null);

  const consider = useCallback((n: AppNotification) => {
    if (n.readAt) return;
    const parsed = parseIncoming(n);
    if (parsed) setIncoming((prev) => prev ?? parsed);
  }, []);

  useEffect(() => {
    let aborted = false;
    const abort = notificationService.openStream(token, {
      onNotification: (n) => {
        if (!aborted) consider(n);
      },
      onError: () => undefined,
    });

    notificationService
      .list(token, 1, 10)
      .then((data) => {
        if (aborted) return;
        for (const n of data.items) consider(n);
      })
      .catch(() => undefined);

    return () => {
      aborted = true;
      abort.abort();
    };
  }, [token, consider]);

  if (!incoming) return null;

  async function dismiss() {
    try {
      await notificationService.markRead(token, incoming!.notificationId);
    } catch {
      // ignore
    }
    setIncoming(null);
  }

  async function accept(mode: 'detail' | 'call') {
    const id = incoming!.appointmentId;
    await dismiss();
    router.push(
      mode === 'call'
        ? `/call?appointmentId=${encodeURIComponent(id)}`
        : `/appointments/${id}`,
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-ink/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-primary animate-pulse">
          {incoming.isInstant ? <Video size={28} /> : <Phone size={28} />}
        </div>

        <h2 className="font-display text-xl font-bold text-on-surface mb-2">
          {incoming.isInstant ? 'Incoming instant consult' : 'New appointment request'}
        </h2>
        <p className="text-sm text-on-surface-variant mb-1">{incoming.title}</p>
        <p className="text-sm text-on-surface-variant mb-6">{incoming.body}</p>

        <div className="flex flex-col gap-2">
          {incoming.isInstant && (
            <Button className="w-full" onClick={() => accept('call')}>
              Accept & join call
            </Button>
          )}
          <Button
            variant={incoming.isInstant ? 'secondary' : 'primary'}
            className="w-full"
            onClick={() => accept('detail')}
          >
            Open appointment
          </Button>
          <Button variant="outline" className="w-full" onClick={dismiss}>
            <X size={16} className="mr-1" />
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
