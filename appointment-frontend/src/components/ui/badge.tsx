import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'destructive';
}) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'neutral' && 'bg-zinc-100 text-zinc-700',
        tone === 'success' && 'bg-emerald-100 text-emerald-700',
        tone === 'warning' && 'bg-amber-100 text-amber-700',
        tone === 'danger' && 'bg-red-100 text-red-700',
      )}
    >
      {children}
    </span>
  );
}
