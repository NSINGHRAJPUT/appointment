'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppNotification,
  notificationService,
} from '@/services/notification.service';
import { registerServiceWorker, subscribeToPush } from '@/lib/push';

const MAX_ITEMS = 30;

export function useNotifications(token: string | null) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const reconnectAttempt = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const data = await notificationService.list(token, 1, MAX_ITEMS);
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      // keep existing state on transient failures
    } finally {
      setLoading(false);
    }
  }, [token]);

  const prependNotification = useCallback((n: AppNotification) => {
    setItems((prev) => {
      if (prev.some((x) => x.id === n.id)) return prev;
      return [n, ...prev].slice(0, MAX_ITEMS);
    });
    if (!n.readAt) {
      setUnreadCount((c) => c + 1);
    }
  }, []);

  const connectSse = useCallback(() => {
    if (!token) return;
    abortRef.current?.abort();
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    abortRef.current = notificationService.openStream(token, {
      onNotification: (n) => {
        reconnectAttempt.current = 0;
        prependNotification(n);
      },
      onError: () => {
        const delay = Math.min(
          30000,
          1000 * Math.pow(2, reconnectAttempt.current),
        );
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(() => {
          void refresh();
          connectSse();
        }, delay);
      },
    });
  }, [token, prependNotification, refresh]);

  useEffect(() => {
    if (!token) {
      abortRef.current?.abort();
      setItems([]);
      setUnreadCount(0);
      return;
    }

    void refresh();
    connectSse();
    void registerServiceWorker().then(() => subscribeToPush(token));

    return () => {
      abortRef.current?.abort();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [token, refresh, connectSse]);

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;
      const target = items.find((i) => i.id === id);
      if (target && !target.readAt) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, readAt: new Date().toISOString() } : i,
          ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      try {
        await notificationService.markRead(token, id);
      } catch {
        void refresh();
      }
    },
    [token, items, refresh],
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    setItems((prev) =>
      prev.map((i) =>
        i.readAt ? i : { ...i, readAt: new Date().toISOString() },
      ),
    );
    setUnreadCount(0);
    try {
      await notificationService.markAllRead(token);
    } catch {
      void refresh();
    }
  }, [token, refresh]);

  return {
    items,
    unreadCount,
    loading,
    refresh,
    markRead,
    markAllRead,
  };
}
