import { ReactNode } from 'react';
import clsx from 'clsx';

export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-[0_8px_30px_rgba(11,9,9,0.05)]',
        hover &&
          'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(64,129,117,0.12)] hover:border-primary/25',
        className,
      )}
    >
      {children}
    </div>
  );
}
