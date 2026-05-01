import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BookingSuccessPage({
  searchParams,
}: {
  searchParams: { doctor?: string; slot?: string };
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Booking Confirmed!</h1>
        <p className="text-zinc-500 mb-6">
          Your appointment has been successfully booked. We've sent a confirmation to your phone.
        </p>
        
        <div className="bg-zinc-50 rounded-lg p-4 mb-8 text-left text-sm border border-zinc-100">
          <div className="flex justify-between mb-2">
            <span className="text-zinc-500">Doctor ID:</span>
            <span className="font-medium text-zinc-900">{searchParams.doctor || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Time Slot:</span>
            <span className="font-medium text-zinc-900">{searchParams.slot || 'N/A'}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/dashboard" className="block">
            <Button className="w-full">View My Appointments</Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="ghost" className="w-full">Return Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
