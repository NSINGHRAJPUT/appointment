'use client';

import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export function Button({ className, variant = 'primary', size = 'md', loading = false, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-zinc-900 text-white hover:bg-zinc-700 shadow-sm',
        variant === 'secondary' && 'bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50',
        variant === 'ghost' && 'text-zinc-700 hover:bg-zinc-100',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-500',
        variant === 'outline' && 'border-2 border-zinc-300 text-zinc-700 hover:bg-zinc-50',
        size === 'sm' && 'px-2 py-1',
        size === 'md' && 'px-4 py-2.5',
        size === 'lg' && 'px-6 py-3.5',
        className,
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
}
