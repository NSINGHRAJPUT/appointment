import { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
};

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm text-zinc-600">{label}</span>}
      <input
        className={clsx(
          'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none',
          error && 'border-red-300 focus:border-red-400',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
