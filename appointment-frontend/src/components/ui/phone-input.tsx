'use client';

import clsx from 'clsx';

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** When true, allows @ for email-style contact fields */
  allowEmail?: boolean;
  id?: string;
};

export function PhoneInput({
  value,
  onChange,
  placeholder = '9876543210',
  className,
  disabled,
  allowEmail = false,
  id,
}: PhoneInputProps) {
  function handleChange(raw: string) {
    if (allowEmail && raw.includes('@')) {
      onChange(raw);
      return;
    }
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    onChange(digits);
  }

  const showPrefix = !allowEmail || !value.includes('@');

  return (
    <div className={clsx('flex rounded-xl border border-outline-variant overflow-hidden', className)}>
      {showPrefix && (
        <span className="inline-flex items-center px-3 bg-surface-container text-sm text-on-surface-variant border-r border-outline-variant">
          +91
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode={allowEmail && value.includes('@') ? 'email' : 'numeric'}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
        autoComplete="tel"
      />
    </div>
  );
}
