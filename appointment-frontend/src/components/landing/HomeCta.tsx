import { Calendar, Video } from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export default function HomeCta() {
  return (
    <section className="py-20 md:py-24">
      <div className="max-w-container-max mx-auto px-margin">
        <AnimateOnScroll variant="scale">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary to-primary animate-gradient-shift px-8 py-14 md:px-16 md:py-16 text-center">
            <div className="pointer-events-none absolute inset-0 opacity-20">
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white blur-3xl animate-float-slow" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-tertiary blur-3xl animate-float-reverse animate-float-delay-2" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-bold text-3xl md:text-4xl text-on-primary mb-4">
                Your pet deserves care without the wait
              </h2>
              <p className="text-on-primary/90 text-lg mb-10 leading-relaxed">
                Join thousands of pet parents who book vet appointments in minutes.
                Get peace of mind with verified professionals — online or at the clinic.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/doctors"
                  className="btn-glow inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-4 rounded-full"
                >
                  <Calendar size={20} />
                  Book an appointment
                </a>
                <a
                  href="/instant"
                  className="btn-glow inline-flex items-center gap-2 bg-transparent border-2 border-white/80 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10"
                >
                  <Video size={20} />
                  Talk to a vet now
                </a>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
