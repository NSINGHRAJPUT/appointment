import type { Metadata } from 'next';
import { buildMetadata, JsonLd, breadcrumbSchema, SITE } from '@/lib/seo';
import PublicPageHero from '@/components/public/PublicPageHero';
import PageCtaStrip from '@/components/public/PageCtaStrip';
import { Briefcase, Heart, MapPin, Users } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'Careers at PawCare',
  description:
    'Join PawCare and help build the future of pet veterinary care. Explore open roles in engineering, product, operations, and vet partnerships.',
  path: '/careers',
  keywords: ['pawcare careers', 'vet tech jobs', 'pet healthcare jobs'],
});

const BC = breadcrumbSchema([
  { name: 'Home', url: SITE.url },
  { name: 'Careers', url: `${SITE.url}/careers` },
]);

const OPEN_ROLES = [
  {
    title: 'Senior Full-Stack Engineer',
    team: 'Engineering',
    location: 'Bengaluru / Remote (India)',
    type: 'Full-time',
  },
  {
    title: 'Product Designer',
    team: 'Product',
    location: 'Bengaluru / Hybrid',
    type: 'Full-time',
  },
  {
    title: 'Vet Partnerships Manager',
    team: 'Operations',
    location: 'Remote (India)',
    type: 'Full-time',
  },
  {
    title: 'Customer Support Specialist',
    team: 'Support',
    location: 'Bengaluru',
    type: 'Full-time',
  },
];

const PERKS = [
  { icon: Heart, title: 'Pet-friendly culture', text: 'We understand pet parents — flexible policies for vet visits and pet emergencies.' },
  { icon: Users, title: 'Small, focused teams', text: 'Ship meaningful features without bureaucracy. Your work reaches real pet parents daily.' },
  { icon: MapPin, title: 'Hybrid & remote', text: 'Work from our Bengaluru office or remotely across India, depending on the role.' },
  { icon: Briefcase, title: 'Growth & learning', text: 'Health benefits, learning budget, and mentorship from experienced founders and engineers.' },
];

export default function CareersPage() {
  return (
    <>
      <JsonLd schema={BC} />
      <PublicPageHero
        badge="Careers"
        title="Help us care for every companion"
        description="PawCare is on a mission to make veterinary care accessible. Join our team building the platform pet parents and vets rely on."
        primaryCta={{ href: "mailto:careers@pawcare.com", label: "Email your CV" }}
        secondaryCta={{ href: "/about", label: "About PawCare" }}
      />

      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-container-max mx-auto px-margin">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Culture</p>
            <h2 className="font-bold text-3xl md:text-4xl text-on-surface mb-3 text-balance">Why work at PawCare?</h2>
            <p className="text-on-surface-variant leading-relaxed">
              We are a growing team passionate about pets, technology, and healthcare access.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <div key={perk.title} className="rounded-2xl border border-outline-variant bg-surface-container-low p-7 flex gap-4 hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-primary-container flex items-center justify-center text-primary">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface mb-1">{perk.title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{perk.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 text-center">Hiring</p>
          <h2 className="font-bold text-3xl md:text-4xl text-on-surface mb-3 text-center text-balance">Open positions</h2>
          <p className="text-center text-sm text-on-surface-variant mb-8 max-w-xl mx-auto leading-relaxed">
            Sample openings for illustration — not all roles may be actively hiring. Email us if you do not see a fit listed.
          </p>
          <div className="max-w-3xl mx-auto space-y-4">
            {OPEN_ROLES.map((role) => (
              <div
                key={role.title}
                className="rounded-2xl border border-outline-variant bg-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-on-surface">{role.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {role.team} · {role.location} · {role.type}
                  </p>
                </div>
                <a
                  href={`mailto:careers@pawcare.com?subject=Application: ${encodeURIComponent(role.title)}`}
                  className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 text-center"
                >
                  Apply
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-on-surface-variant mt-8">
            Don&apos;t see a fit? Send your CV to{' '}
            <a href="mailto:careers@pawcare.com" className="text-primary font-medium hover:underline">
              careers@pawcare.com
            </a>{' '}
            — we are always looking for talented people who love pets.
          </p>
        </div>
      </section>

      <PageCtaStrip
        title="Not looking for a job?"
        description="Explore PawCare as a pet parent or veterinary partner instead."
      />
    </>
  );
}
