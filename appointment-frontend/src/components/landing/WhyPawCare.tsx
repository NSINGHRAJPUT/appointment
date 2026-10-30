import {
  Heart,
  MapPin,
  Monitor,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

type Benefit = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
};

const BENEFITS: Benefit[] = [
  {
    icon: Stethoscope,
    title: "Verified veterinarians",
    description:
      "Every vet on PawCare completes identity and license verification before accepting appointments. You always know who is caring for your pet.",
    accent: "from-primary to-brand-teal-light",
  },
  {
    icon: Monitor,
    title: "Online video consultations",
    description:
      "Get expert advice from home for follow-ups, minor concerns, or when travel is stressful for your pet. Secure video calls with prescription guidance where applicable.",
    accent: "from-brand-teal-light to-tertiary",
  },
  {
    icon: MapPin,
    title: "In-clinic appointments",
    description:
      "Book a physical visit when your pet needs hands-on exams, vaccinations, surgery, or diagnostic tests. Choose the clinic time that fits your schedule.",
    accent: "from-brand-forest to-primary",
  },
  {
    icon: PawPrint,
    title: "Care for every companion",
    description:
      "Dogs, cats, birds, rabbits, and exotic pets — browse specialists across general practice, surgery, dermatology, nutrition, behavior, and more.",
    accent: "from-primary to-secondary",
  },
  {
    icon: ShieldCheck,
    title: "Private & secure",
    description:
      "Your pet's health records and consultation details are encrypted. We never share your data without your consent.",
    accent: "from-secondary to-brand-teal-light",
  },
  {
    icon: Heart,
    title: "Built for pet parents",
    description:
      "Clear pricing before you book, appointment reminders, chat with your vet, and easy rescheduling — because your pet's comfort matters as much as yours.",
    accent: "from-tertiary to-primary",
  },
];

export default function WhyPawCare() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-surface-container-low via-white to-white" />
      <div className="pointer-events-none absolute top-1/4 -left-16 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 right-0 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative z-10 max-w-container-max mx-auto px-margin">
        <AnimateOnScroll variant="up" className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur border border-primary/15 px-4 py-2 shadow-sm mb-6">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-primary tracking-wide">
              Why PawCare
            </span>
          </div>
          <h2 className="font-bold text-4xl md:text-5xl text-on-surface mb-5 leading-tight">
            Veterinary care that{" "}
            <span className="bg-linear-to-r from-primary via-brand-teal-light to-secondary bg-clip-text text-transparent">
              fits your life
            </span>
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Whether it is a late-night worry about your cat, a routine vaccination
            for your dog, or specialist advice for an exotic pet — PawCare connects
            you with trusted vets online and at the clinic, without the hassle.
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {BENEFITS.map((item, index) => (
            <AnimateOnScroll key={item.title} variant="up" delay={index * 80}>
              <BenefitCard {...item} index={index} featured={index === 0} />
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll variant="fade" delay={500} className="mt-12 md:mt-14">
          <div className="rounded-3xl border border-primary/15 bg-linear-to-br from-brand-forest via-primary to-brand-teal-light p-8 md:p-10 text-center text-white shadow-xl shadow-primary/15">
            <p className="text-sm font-semibold uppercase tracking-wider text-white/70 mb-3">
              One platform, every kind of care
            </p>
            <p className="text-xl md:text-2xl font-semibold leading-relaxed max-w-2xl mx-auto">
              From instant video consults to in-clinic visits — book the right care
              for your pet in minutes, not days.
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  description,
  accent,
  index,
  featured = false,
}: Benefit & { index: number; featured?: boolean }) {
  return (
    <div
      className={`group relative h-full overflow-hidden rounded-2xl border bg-white interactive-card ${
        featured
          ? "border-primary/25 shadow-lg shadow-primary/10 lg:row-span-1"
          : "border-outline-variant/80 shadow-sm"
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${accent}`} />
      <div className="p-6 md:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${accent} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/50">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3 className="font-bold text-xl text-on-surface mb-3 leading-snug">
          {title}
        </h3>
        <p className="text-on-surface-variant leading-relaxed text-sm">
          {description}
        </p>
      </div>
      <div
        className={`pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-linear-to-br ${accent} opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.11]`}
      />
    </div>
  );
}
