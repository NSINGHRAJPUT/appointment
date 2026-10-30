'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import type { AppNotification } from '@/services/notification.service';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationItem({
  item,
  onClick,
}: {
  item: AppNotification;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-surface-container transition-colors border-b border-outline-variant/40 last:border-0 ${
        !item.readAt ? 'bg-primary/5' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {!item.readAt && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
        )}
        <div className={!item.readAt ? '' : 'pl-4'}>
          <p className="text-sm font-semibold text-on-surface line-clamp-1">
            {item.title}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">
            {item.body}
          </p>
          <p className="text-[11px] text-on-surface-variant/70 mt-1">
            {timeAgo(item.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function NotificationBell({ token }: { token: string }) {
  const router = useRouter();
  const { items, unreadCount, markRead, markAllRead } = useNotifications(token);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [open]);

  async function handleItemClick(item: AppNotification) {
    setOpen(false);
    await markRead(item.id);
    if (item.linkUrl) {
      router.push(item.linkUrl);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        onClick={() => setOpen((v) => !v)}
        className="relative p-2.5 rounded-full border-2 border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary-container/40 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-outline-variant bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <h3 className="text-sm font-semibold text-on-surface">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-on-surface-variant">
                No notifications yet
              </p>
            ) : (
              items.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onClick={() => void handleItemClick(item)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
