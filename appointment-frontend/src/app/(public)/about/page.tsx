import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, JsonLd, breadcrumbSchema, SITE } from "@/lib/seo";
import PublicPageHero from "@/components/public/PublicPageHero";
import PageCtaStrip from "@/components/public/PageCtaStrip";
import { PET_IMAGES } from "@/lib/pet-images";
import {
  Heart,
  MapPin,
  Monitor,
  PawPrint,
  ShieldCheck,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "About PawCare — Expert Vet Care, Online & In-Clinic",
  description:
    "Learn about PawCare — our mission to make quality veterinary care accessible for every pet. Online video visits, clinic bookings, and trusted specialists.",
  path: "/about",
  keywords: ["about pawcare", "pet healthcare platform", "veterinary telehealth"],
});

const BC = breadcrumbSchema([
  { name: "Home", url: SITE.url },
  { name: "About", url: `${SITE.url}/about` },
]);

const STATS = [
  { value: "2,000+", label: "Verified veterinarians" },
  { value: "50K+", label: "Pet parents served" },
  { value: "24/7", label: "Instant consult access" },
  { value: "4.8★", label: "Average vet rating" },
];

const VALUES = [
  {
    icon: PawPrint,
    title: "Pets first, always",
    description:
      "Every feature is designed around what pet parents and veterinarians actually need — less friction, more time for care.",
  },
  {
    icon: ShieldCheck,
    title: "Verified professionals",
    description:
      "Every vet completes license and identity verification before accepting appointments. Trust is non-negotiable.",
  },
  {
    icon: Monitor,
    title: "Online & in-clinic",
    description:
      "Video consults for convenience, clinic visits when hands-on care is required. One platform for both.",
  },
  {
    icon: Heart,
    title: "Transparent pricing",
    description:
      "See consultation fees upfront. No hidden charges. Compare vets by specialty, rating, and availability.",
  },
  {
    icon: MapPin,
    title: "Care near you",
    description:
      "Find veterinarians in your city for vaccinations, surgery, and routine check-ups at trusted clinics.",
  },
  {
    icon: Stethoscope,
    title: "Specialist access",
    description:
      "From general practice to dermatology, nutrition, behavior, and exotic pets — browse the right expert for your companion.",
  },
];

const TIMELINE = [
  {
    year: "2022",
    title: "Founded with a simple idea",
    text: "PawCare started when our founders struggled to find timely vet care for their own pets. We built a platform to connect pet parents with verified veterinarians.",
  },
  {
    year: "2023",
    title: "Online consultations launch",
    text: "Secure video consults went live, letting pet parents get expert advice from home for follow-ups and non-emergency concerns.",
  },
  {
    year: "2024",
    title: "In-clinic booking expands",
    text: "Partner clinics joined the network so you could book physical visits, vaccinations, and diagnostics through the same app.",
  },
  {
    year: "Today",
    title: "Growing pet care network",
    text: "Thousands of veterinarians and pet parents use PawCare every day — online, in-clinic, and instant consult included.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd schema={BC} />
      <PublicPageHero
        badge="Our story"
        title="Vet care for modern pet parents"
        description="Verified veterinarians, online video consults, and in-clinic bookings — all in one place for your companion."
        imageSrc={PET_IMAGES.heroVetExam}
        imageAlt="Veterinarian examining a pet"
        primaryCta={{ href: "/doctors", label: "Find a vet" }}
        secondaryCta={{ href: "/instant", label: "Instant consult" }}
      />

      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-container-max mx-auto px-margin">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="text-center rounded-2xl border border-outline-variant bg-surface-container-low p-6 md:p-7"
              >
                <p className="font-bold text-3xl md:text-4xl text-primary mb-1 tracking-tight">{stat.value}</p>
                <p className="text-sm text-on-surface-variant leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 md:gap-12 items-center mb-20">
            <div className="min-w-0 w-full">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Our mission</p>
              <h2 className="font-bold text-3xl md:text-4xl text-on-surface mb-5 text-balance">
                Making vet care accessible for every companion
              </h2>
              <p className="text-on-surface-variant leading-relaxed mb-4 max-w-prose">
                Whether you share your home with a dog, cat, bird, rabbit, or exotic pet, getting timely
                veterinary advice should not mean long waits or endless phone calls. PawCare brings
                qualified veterinarians to your screen or clinic door.
              </p>
              <p className="text-on-surface-variant leading-relaxed max-w-prose">
                We partner with licensed professionals who share our commitment to compassionate,
                evidence-based care — and we give pet parents the tools to book, chat, and manage
                appointments with confidence.
              </p>
            </div>
            <div className="min-w-0 w-full">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-outline-variant">
                <img
                  src={PET_IMAGES.heroDogOwner}
                  alt="Pet parent with their dog at home"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">What we stand for</p>
            <h2 className="font-bold text-3xl md:text-4xl text-on-surface">Built on trust, designed for pets</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-outline-variant bg-white p-7 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className="h-12 w-12 rounded-full bg-primary-container flex items-center justify-center text-primary mb-4">
                    <Icon size={22} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-lg text-on-surface mb-2">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-container-max mx-auto px-margin">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Our journey</p>
            <h2 className="font-bold text-3xl md:text-4xl text-on-surface">How PawCare grew</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-0">
            {TIMELINE.map((item, index) => (
              <div key={item.year} className="relative flex gap-6 pb-10 last:pb-0">
                {index < TIMELINE.length - 1 && (
                  <div className="absolute left-[27px] top-14 bottom-0 w-px bg-outline-variant" />
                )}
                <div className="shrink-0 h-14 w-14 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
                  {item.year}
                </div>
                <div className="pt-2">
                  <h3 className="font-bold text-lg text-on-surface mb-1">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-surface-container-low border-y border-outline-variant">
        <div className="max-w-container-max mx-auto px-margin">
          <div className="rounded-3xl bg-gradient-to-br from-secondary to-primary p-8 md:p-12 text-on-primary overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 md:gap-12 items-center">
              <div className="min-w-0 w-full">
                <Users className="mb-4 opacity-90" size={32} />
                <h2 className="font-bold text-2xl md:text-3xl mb-3">Join the PawCare community</h2>
                <p className="text-on-primary/90 leading-relaxed mb-6">
                  Pet parents, veterinarians, and clinic partners — together we make quality care
                  easier to find and book.
                </p>
                <ul className="space-y-2 text-sm text-on-primary/85">
                  <li className="flex items-center gap-2">
                    <PawPrint size={16} className="shrink-0" />
                    Book and manage appointments in minutes
                  </li>
                  <li className="flex items-center gap-2">
                    <Stethoscope size={16} className="shrink-0" />
                    Grow your practice with verified listings
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart size={16} className="shrink-0" />
                    Help more pets get the care they need
                  </li>
                </ul>
              </div>

              <div className="min-w-0 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                <Link
                  href="/auth"
                  className="rounded-2xl bg-white p-6 text-primary hover:shadow-lg transition-all group"
                >
                  <PawPrint size={22} className="mb-3" />
                  <p className="font-bold text-lg mb-1">Pet parents</p>
                  <p className="text-sm text-on-surface-variant mb-3">
                    Create a free account to book vets and track appointments.
                  </p>
                  <span className="text-sm font-semibold group-hover:underline">Sign up free →</span>
                </Link>
                <Link
                  href="/contact"
                  className="rounded-2xl border-2 border-white/40 bg-white/10 p-6 hover:bg-white/15 transition-all group"
                >
                  <Video size={22} className="mb-3" />
                  <p className="font-bold text-lg mb-1">Vets & clinics</p>
                  <p className="text-sm text-on-primary/85 mb-3">
                    Partner with PawCare to reach more pet parents online.
                  </p>
                  <span className="text-sm font-semibold group-hover:underline">Partner with us →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PageCtaStrip />
    </>
  );
}
