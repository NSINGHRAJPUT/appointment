import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Find Vets — Book Online & In-Clinic Appointments',
  description:
    'Browse verified veterinarians on PawCare. Filter by specialty, availability, and rating. Book video consults or in-clinic visits for your pet.',
  path: '/doctors',
  keywords: ['find vet', 'book vet appointment', 'online vet', 'pet veterinarian'],
});

export default function DoctorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
