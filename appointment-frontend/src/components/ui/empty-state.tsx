import { ReactNode } from 'react';
import clsx from 'clsx';
import { Button } from './button';

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  href,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/60 px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-primary">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-on-surface">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-on-surface-variant">{description}</p>
      )}
      {actionLabel && (onAction || href) && (
        <div className="mt-6">
          {href ? (
            <a
              href={href}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              {actionLabel}
            </a>
          ) : (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      )}
    </div>
  );
}
