import Image from "next/image";
import { Calendar, ShieldPlus, UserSearch, CheckCircle2 } from "lucide-react";
import { PET_IMAGES } from "@/lib/pet-images";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: UserSearch,
      title: "Find Your Vet",
      description: "Search by specialty, pet type, symptoms, or availability to find the right veterinarian for your companion.",
      color: "from-primary to-secondary",
      image: PET_IMAGES.heroDogOwner,
      imageAlt: "Pet parent caring for their dog at home",
    },
    {
      number: "2",
      icon: Calendar,
      title: "Book Online or In-Clinic",
      description: "Choose a video consultation or an in-person clinic visit at a time that works for you and your pet.",
      color: "from-secondary to-primary",
      image: PET_IMAGES.generalPractice,
      imageAlt: "Healthy pet ready for a vet visit",
    },
    {
      number: "3",
      icon: ShieldPlus,
      title: "Get Expert Care",
      description: "Connect through our secure platform for diagnosis, treatment plans, prescriptions, and follow-up guidance.",
      color: "from-primary-hover to-primary",
      image: PET_IMAGES.heroVetExam,
      imageAlt: "Veterinarian examining a pet",
    },
  ];

  const floatClass = [
    "animate-float-slow",
    "animate-float-reverse animate-float-delay-2",
    "animate-drift animate-float-delay-3",
  ];

  return (
    <section id="how-it-works" className="relative py-20 md:py-28 bg-surface-container-low overflow-hidden">
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl -z-10" />
      <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl -z-10 animate-float-delay-2" />

      <div className="max-w-container-max mx-auto px-margin text-center">
        <AnimateOnScroll variant="up">
          <h2 className="font-bold text-4xl md:text-5xl text-on-surface mb-6">
            How PawCare Works
          </h2>
          <p className="text-lg text-on-surface-variant mb-16 max-w-2xl mx-auto">
            Simple, secure, and stress-free — connect with verified veterinarians in just 3 steps
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <AnimateOnScroll key={step.number} variant="up" delay={index * 150}>
                <div className="flex flex-col items-center z-10 bg-white rounded-2xl border border-outline-variant p-6 shadow-sm interactive-card h-full">
                  <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-6 group">
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 to-transparent" />
                  </div>

                  <div className="relative mb-6 shrink-0 -mt-12">
                    <div
                      className={`w-20 h-20 rounded-full bg-gradient-to-br ${step.color} text-on-primary flex items-center justify-center shadow-lg ring-4 ring-white ${floatClass[index]}`}
                    >
                      <Icon size={32} strokeWidth={1.5} />
                    </div>
                    <div
                      aria-hidden
                      className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white text-xs font-bold text-primary shadow-md"
                    >
                      {step.number}
                    </div>
                  </div>

                  <h3 className="font-bold text-xl text-on-surface mb-3">{step.title}</h3>
                  <p className="text-on-surface-variant mb-4 leading-relaxed text-sm">{step.description}</p>

                  <div className="text-primary mt-auto animate-slow-pulse">
                    <CheckCircle2 size={28} strokeWidth={1.5} />
                  </div>
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>

        <AnimateOnScroll variant="fade" delay={500} className="mt-16 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/doctors"
            className="btn-glow inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary animate-gradient-shift text-on-primary font-semibold px-8 py-4 rounded-full"
          >
            Start Now
          </a>
          <a
            href="/instant"
            className="btn-glow inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container border-2 border-primary/25 font-semibold px-8 py-4 rounded-full hover:bg-primary-container"
          >
            Quick Consult
          </a>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
