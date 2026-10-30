'use client';

import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' &&
          'bg-primary text-on-primary hover:bg-primary-hover shadow-sm',
        variant === 'secondary' &&
          'bg-surface-container-lowest text-on-surface ring-1 ring-outline-variant hover:bg-surface-container-low',
        variant === 'ghost' &&
          'text-on-surface-variant hover:bg-surface-container rounded-xl',
        variant === 'danger' &&
          'bg-error text-on-error hover:opacity-90',
        variant === 'outline' &&
          'border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container-low hover:border-primary/40',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2.5',
        size === 'lg' && 'px-6 py-3.5 text-base',
        className,
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
}
