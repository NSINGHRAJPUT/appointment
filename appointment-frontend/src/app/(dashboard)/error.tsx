'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
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
    <main className="min-h-[60vh] flex items-center justify-center px-margin py-16">
      <div className="max-w-md w-full premium-card text-center space-y-4">
        <h1 className="text-2xl font-bold text-on-surface">Dashboard unavailable</h1>
        <p className="text-on-surface-variant text-sm">
          We could not load this page. Your session may have expired or the server is busy.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button type="button" onClick={reset} className="btn-primary px-6 py-2.5">
            Retry
          </button>
          <Link href="/dashboard" className="btn-secondary px-6 py-2.5">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
