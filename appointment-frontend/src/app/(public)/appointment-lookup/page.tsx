import { Suspense } from 'react';
import AppointmentLookupClient from './lookup-client';

export default function AppointmentLookupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
      }
    >
      <AppointmentLookupClient />
    </Suspense>
  );
}
