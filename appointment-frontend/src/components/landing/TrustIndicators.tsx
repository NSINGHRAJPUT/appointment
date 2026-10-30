import {
  ClockCheck,
  Lock,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

type Indicator = {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
};

const INDICATORS: Indicator[] = [
  {
    icon: Shield,
    label: "Verified Vets",
    value: "2,000+",
    accent: "from-primary to-brand-teal-light",
  },
  {
    icon: Star,
    label: "Average Rating",
    value: "4.9/5",
    accent: "from-brand-teal-light to-tertiary",
  },
  {
    icon: Lock,
    label: "Secure Platform",
    value: "Encrypted",
    accent: "from-brand-forest to-primary",
  },
  {
    icon: ClockCheck,
    label: "24/7 Available",
    value: "Round the Clock",
    accent: "from-primary to-secondary",
  },
  {
    icon: Users,
    label: "Pet Parents",
    value: "50K+",
    accent: "from-secondary to-brand-teal-light",
  },
  {
    icon: Zap,
    label: "Avg Response",
    value: "< 5 mins",
    accent: "from-tertiary to-primary",
  },
];

export default function TrustIndicators() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white via-primary-container/25 to-surface-container-low" />
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-8 h-56 w-56 rounded-full bg-tertiary/15 blur-3xl" />

      <div className="relative z-10 max-w-container-max mx-auto px-margin">
        <AnimateOnScroll variant="up" className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur border border-primary/15 px-4 py-2 shadow-sm mb-6">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-primary tracking-wide">
              Trusted by pet parents
            </span>
          </div>
          <h2 className="font-bold text-4xl md:text-5xl text-on-surface mb-5 leading-tight">
            Care you can{" "}
            <span className="bg-linear-to-r from-primary via-brand-teal-light to-secondary bg-clip-text text-transparent">
              count on
            </span>
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            PawCare brings together verified vets, secure technology, and a
            community of pet parents who put their companions first.
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {INDICATORS.map((item, index) => (
            <AnimateOnScroll key={item.label} variant="up" delay={index * 70}>
              <TrustStatCard {...item} featured={index === 1} />
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll variant="fade" delay={450} className="mt-10 md:mt-12">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Licensed veterinarians
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              End-to-end encryption
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Support when you need it
            </span>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}

function TrustStatCard({
  icon: Icon,
  label,
  value,
  accent,
  featured = false,
}: Indicator & { featured?: boolean }) {
  return (
    <div
      className={`group relative h-full overflow-hidden rounded-2xl border bg-white interactive-card ${
        featured
          ? "border-primary/25 shadow-lg shadow-primary/10 md:-translate-y-1"
          : "border-outline-variant/80 shadow-sm"
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${accent}`} />
      <div className="p-5 md:p-6">
        <div
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${accent} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <p
          className={`font-bold tracking-tight text-on-surface ${
            featured ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
          }`}
        >
          {value}
        </p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
      </div>
      <div
        className={`pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-linear-to-br ${accent} opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.12]`}
      />
    </div>
  );
}
