"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Video, UserSearch, Calendar, Sparkles, ArrowRight } from "lucide-react";
import { BookingWizard } from "../booking/BookingWizard";
import { PET_IMAGES } from "@/lib/pet-images";

export default function LandingHero() {
  const heroRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const offset = Math.min(Math.max(-rect.top, 0), 220);
      heroRef.current.style.setProperty(
        "--hero-parallax-offset",
        `${offset}px`,
      );
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/doctors?q=${encodeURIComponent(q)}` : "/doctors");
  }

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden max-w-container-max mx-auto px-margin pt-10 pb-10 sm:pt-16 sm:pb-16 md:pt-20"
      style={{ "--hero-parallax-offset": "0px" } as React.CSSProperties}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-90">
        <div
          className="absolute left-1/2 top-10 -translate-x-1/2 h-72 w-72 rounded-full bg-primary/15 blur-3xl home-parallax-layer"
          style={{ "--speed": 0.14 } as React.CSSProperties}
        />
        <div
          className="absolute left-[12%] top-24 h-44 w-44 rounded-full bg-primary/15 blur-3xl home-parallax-layer"
          style={{ "--speed": 0.09 } as React.CSSProperties}
        />
        <div
          className="absolute right-[10%] top-32 h-32 w-32 rounded-full bg-secondary/10 blur-3xl home-parallax-layer"
          style={{ "--speed": 0.06 } as React.CSSProperties}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="animate-fade-in-up inline-flex items-center gap-2 bg-primary-container border border-primary/25 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-6 sm:mb-8 hover:scale-105 transition-transform max-w-full">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-on-surface">Trusted by 50,000+ pet parents on PawCare</span>
          </div>

          <h1 className="animate-fade-in-up delay-100 font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-on-surface max-w-5xl mb-4 sm:mb-6 leading-tight tracking-tight text-balance">
            Expert Vet Care,
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Online & In-Clinic</span>
          </h1>

          <p className="animate-fade-in-up delay-150 text-on-surface-variant max-w-2xl mb-8 sm:mb-10 text-base sm:text-lg text-pretty">
            Book consultations with verified veterinarians for your pets. Video visits, clinic appointments, and instant care — all in one place.
          </p>

          <form
            onSubmit={handleSearch}
            className="animate-fade-in-up delay-200 w-full max-w-3xl bg-white rounded-2xl p-1.5 sm:p-2 border-2 border-outline-variant flex items-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
          >
            <Search className="text-outline ml-3 sm:ml-4 shrink-0" size={20} />
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-outline p-3 sm:p-4 outline-none text-base min-w-0"
              placeholder="Search by specialty, pet concern..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
            />
            <button
              type="submit"
              className="btn-glow bg-gradient-to-r from-primary to-secondary animate-gradient-shift text-on-primary font-semibold px-4 sm:px-8 py-2.5 sm:py-3 rounded-full mr-1 sm:mr-2 shrink-0 text-sm sm:text-base"
            >
              Search
            </button>
          </form>

          <div className="animate-fade-in-up delay-250 grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 mt-8 sm:mt-10 w-full sm:w-auto">
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="btn-glow group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-on-primary font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full shadow-lg"
            >
              <Calendar size={20} className="shrink-0" />
              Book Appointment
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
            <a
              href="/instant"
              className="group inline-flex items-center justify-center gap-2 bg-secondary-container text-on-secondary-container border-2 border-primary/25 font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full hover:bg-primary-container hover:scale-105 transition-all active:scale-95"
            >
              <Video size={20} className="shrink-0" />
              Instant Consult
              <Sparkles size={18} className="group-hover:rotate-12 transition-transform shrink-0" />
            </a>
            <a
              href="/doctors"
              className="group inline-flex items-center justify-center gap-2 bg-surface-container-low text-on-surface-variant border-2 border-outline-variant font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full hover:bg-surface-container hover:scale-105 transition-all active:scale-95"
            >
              <UserSearch size={20} className="shrink-0" />
              Find Vets
            </a>
          </div>
        </div>

        <div className="animate-fade-in-right delay-300 relative hidden lg:block w-full max-w-lg mx-auto lg:max-w-none">
          <div className="absolute -top-3 -right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg animate-bob-spin animate-float-delay-1">
            <span className="text-lg" aria-hidden>🐾</span>
          </div>
          <div className="absolute top-1/4 -right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-primary/30 shadow-md animate-float-reverse animate-float-delay-3">
            <span className="text-base" aria-hidden>❤️</span>
          </div>
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white animate-float-slow">
            <Image
              src={PET_IMAGES.heroDogOwner}
              alt="Happy pet parent with their dog at home"
              fill
              priority
              className="object-cover"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/30 via-transparent to-transparent" />
          </div>
          <div className="absolute -bottom-6 -left-6 w-44 h-44 rounded-2xl overflow-hidden shadow-xl border-4 border-white animate-float-reverse animate-float-delay-2">
            <Image
              src={PET_IMAGES.heroVetExam}
              alt="Veterinarian gently examining a pet"
              fill
              className="object-cover"
              sizes="176px"
            />
          </div>
        </div>
      </div>

      <BookingWizard
        open={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </section>
  );
}
