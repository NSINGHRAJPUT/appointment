import { apiFetch } from '@/lib/api';
import { env } from '@/lib/env';

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string;
  meta?: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  items: AppNotification[];
  total: number;
  page: number;
  pageSize: number;
  unreadCount: number;
};

export const notificationService = {
  list: (token: string, page = 1, pageSize = 20) =>
    apiFetch<NotificationListResponse>(
      `/notifications?page=${page}&pageSize=${pageSize}`,
      undefined,
      token,
    ),

  unreadCount: (token: string) =>
    apiFetch<{ count: number }>('/notifications/unread-count', undefined, token),

  markRead: (token: string, id: string) =>
    apiFetch<AppNotification>(
      `/notifications/${id}/read`,
      { method: 'PATCH' },
      token,
    ),

  markAllRead: (token: string) =>
    apiFetch<{ updated: number }>(
      '/notifications/read-all',
      { method: 'POST' },
      token,
    ),

  vapidPublicKey: (token: string) =>
    apiFetch<{ publicKey: string | null }>(
      '/notifications/vapid-public-key',
      undefined,
      token,
    ),

  pushSubscribe: (
    token: string,
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      userAgent?: string;
    },
  ) =>
    apiFetch(
      '/notifications/push-subscribe',
      { method: 'POST', body: JSON.stringify(subscription) },
      token,
    ),

  pushUnsubscribe: (token: string, endpoint: string) =>
    apiFetch(
      '/notifications/push-subscribe',
      { method: 'DELETE', body: JSON.stringify({ endpoint }) },
      token,
    ),

  /**
   * Open an authenticated SSE stream. Returns an abort controller to close it.
   */
  openStream: (
    token: string,
    handlers: {
      onNotification: (n: AppNotification) => void;
      onError?: (err: unknown) => void;
    },
  ) => {
    const controller = new AbortController();
    const url = `${env.apiUrl}/notifications/stream`;

    (async () => {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok || !response.body) {
          throw new Error(`SSE failed (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let eventType = 'message';
        let dataLines: string[] = [];

        const flushEvent = () => {
          if (dataLines.length === 0) {
            eventType = 'message';
            return;
          }
          const raw = dataLines.join('\n');
          dataLines = [];
          const type = eventType;
          eventType = 'message';
          if (type === 'heartbeat') return;
          try {
            const parsed = JSON.parse(raw) as AppNotification;
            if (parsed?.id) handlers.onNotification(parsed);
          } catch {
            // ignore malformed chunks
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split(/\r?\n/);
          buffer = parts.pop() ?? '';

          for (const line of parts) {
            if (line === '') {
              flushEvent();
              continue;
            }
            if (line.startsWith(':')) continue;
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
              continue;
            }
            if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trimStart());
            }
          }
        }
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        handlers.onError?.(err);
      }
    })();

    return controller;
  },
};
