import Image from 'next/image';
import { CalendarCheck, MessageSquare, PawPrint, Stethoscope } from 'lucide-react';
import { AuthForm } from '@/components/auth-form';
import { SITE } from '@/lib/seo';

export default function AuthPage() {
  return (
    <main className="w-full min-h-[calc(100vh-8rem)]">
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl md:grid-cols-2 md:items-stretch">
        <aside className="relative m-4 hidden overflow-hidden rounded-3xl bg-gradient-to-br from-brand-ink via-brand-forest to-primary p-10 text-white md:m-6 md:mr-0 md:flex md:flex-col md:justify-between">
          <div className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-brand-teal-light/25 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-8 flex items-center gap-3">
              <Image
                src={SITE.logo}
                alt={`${SITE.name} logo`}
                width={48}
                height={48}
                className="rounded-2xl object-contain bg-white/10 p-1"
                priority
              />
              <span className="font-display text-2xl font-bold tracking-tight">
                {SITE.name}
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
              Care for every pet, in one calm place
            </h1>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-white/80">
              Book consultations, message your vet, and manage visits — whether
              you&apos;re a pet parent or a veterinary professional.
            </p>
          </div>

          <ul className="relative z-10 mt-10 space-y-4">
            {[
              { icon: CalendarCheck, text: 'Book clinic & online consults' },
              { icon: MessageSquare, text: 'Realtime chat with your care team' },
              { icon: Stethoscope, text: 'Trusted veterinary specialists' },
              { icon: PawPrint, text: 'Built for pets, not human clinics' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex min-w-0 items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-lg">
            <div className="mb-6 text-center md:hidden">
              <Image
                src={SITE.logo}
                alt={`${SITE.name} logo`}
                width={48}
                height={48}
                className="mx-auto mb-3 rounded-2xl object-contain"
                priority
              />
              <p className="font-display text-xl font-bold text-on-surface">{SITE.name}</p>
              <p className="text-sm text-on-surface-variant">Pet care made simple</p>
            </div>
            <AuthForm />
          </div>
        </div>
      </div>
    </main>
  );
}
