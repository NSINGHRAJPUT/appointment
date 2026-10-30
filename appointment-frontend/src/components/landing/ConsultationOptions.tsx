import { Building2, Check, Video } from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const ONLINE_POINTS = [
  "Ideal for follow-ups, skin issues, diet advice, and behavior questions",
  "No travel stress — especially helpful for anxious or elderly pets",
  "Same-day slots often available with instant consult",
  "Receive care notes and next steps in your dashboard",
];

const CLINIC_POINTS = [
  "Physical exams, vaccinations, blood tests, and imaging",
  "Surgery, dental work, and hands-on procedures",
  "Emergency assessments that need in-person evaluation",
  "Choose a nearby clinic and book a confirmed time slot",
];

export default function ConsultationOptions() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-container-max mx-auto px-margin">
        <AnimateOnScroll variant="up" className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Two ways to consult
          </p>
          <h2 className="font-bold text-4xl md:text-5xl text-on-surface mb-5">
            Online or in-clinic — you choose
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Not sure which option is right? Many pet parents start with a quick online consult
            and visit the clinic only when a physical exam is needed. PawCare supports both
            in one place.
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimateOnScroll variant="left" delay={100}>
            <div className="rounded-2xl border-2 border-primary/25 bg-primary-container/40 p-8 md:p-10 hover-lift h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary animate-float-slow">
                  <Video size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-on-surface">Online consultation</h3>
                  <p className="text-sm text-on-surface-variant">Video call from anywhere</p>
                </div>
              </div>
              <ul className="space-y-4">
                {ONLINE_POINTS.map((point, i) => (
                  <AnimateOnScroll key={point} variant="fade" delay={200 + i * 60} as="li">
                    <div className="flex items-start gap-3 text-on-surface-variant text-sm leading-relaxed">
                      <Check size={18} className="text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                      {point}
                    </div>
                  </AnimateOnScroll>
                ))}
              </ul>
              <a
                href="/instant"
                className="btn-glow inline-flex mt-8 px-6 py-3 rounded-full bg-primary text-on-primary font-semibold text-sm"
              >
                Start instant consult
              </a>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll variant="right" delay={100}>
            <div className="rounded-2xl border-2 border-secondary/25 bg-secondary-container/60 p-8 md:p-10 hover-lift h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-on-secondary animate-float-reverse animate-float-delay-2">
                  <Building2 size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-on-surface">In-clinic visit</h3>
                  <p className="text-sm text-on-surface-variant">Book a slot at the vet clinic</p>
                </div>
              </div>
              <ul className="space-y-4">
                {CLINIC_POINTS.map((point, i) => (
                  <AnimateOnScroll key={point} variant="fade" delay={200 + i * 60} as="li">
                    <div className="flex items-start gap-3 text-on-surface-variant text-sm leading-relaxed">
                      <Check size={18} className="text-secondary shrink-0 mt-0.5" strokeWidth={2.5} />
                      {point}
                    </div>
                  </AnimateOnScroll>
                ))}
              </ul>
              <a
                href="/doctors"
                className="btn-glow inline-flex mt-8 px-6 py-3 rounded-full bg-secondary text-on-secondary font-semibold text-sm"
              >
                Find a clinic vet
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
