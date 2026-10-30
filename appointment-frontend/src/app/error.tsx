'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-margin py-16">
      <div className="max-w-md w-full premium-card text-center space-y-4">
        <h1 className="text-2xl font-bold text-on-surface">Something went wrong</h1>
        <p className="text-on-surface-variant text-sm">
          We hit an unexpected error. Please try again or return home.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button type="button" onClick={reset} className="btn-primary px-6 py-2.5">
            Try again
          </button>
          <Link href="/" className="btn-secondary px-6 py-2.5">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
