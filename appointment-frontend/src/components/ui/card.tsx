import { ReactNode } from 'react';
import clsx from 'clsx';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-[0_8px_30px_rgba(2,6,23,0.06)]', className)}>{children}</div>;
}
