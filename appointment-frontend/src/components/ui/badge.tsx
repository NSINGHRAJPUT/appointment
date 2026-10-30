import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'destructive' | 'primary';
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'neutral' && 'bg-surface-container text-on-surface-variant',
        tone === 'primary' && 'bg-primary-container text-on-primary-container',
        tone === 'success' && 'bg-primary-container text-primary',
        tone === 'warning' && 'bg-amber-100 text-amber-800',
        (tone === 'danger' || tone === 'destructive') && 'bg-error-container text-on-error-container',
      )}
    >
      {children}
    </span>
  );
}
