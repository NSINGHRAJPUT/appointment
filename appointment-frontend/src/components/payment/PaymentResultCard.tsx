import type { ReactNode } from 'react';

export function PaymentResultCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface-container-low px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-outline-variant bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
