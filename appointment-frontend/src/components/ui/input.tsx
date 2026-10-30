import { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
};

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm text-on-surface-variant">{label}</span>}
      <input
        className={clsx(
          'w-full rounded-xl border border-outline-variant bg-white px-3 py-2.5 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20',
          error && 'border-red-300 focus:border-red-400',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
