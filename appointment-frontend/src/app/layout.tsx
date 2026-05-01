import type { Metadata } from 'next';
import { AppChrome } from '@/components/app-chrome';
import { IncomingRequestModal } from '@/components/instant-consult/IncomingRequestModal';
import './globals.css';

export const metadata: Metadata = {
  title: 'Appointment Platform',
  description: 'Doctor appointment platform with chat and call',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppChrome>{children}</AppChrome>
        <IncomingRequestModal />
      </body>
    </html>
  );
}
