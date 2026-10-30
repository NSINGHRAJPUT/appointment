"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { PET_IMAGES } from "@/lib/pet-images";
import { doctorService } from "@/services/doctor.service";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const CATEGORIES = [
  { label: "General Practice", image: PET_IMAGES.generalPractice, color: "border-primary/25 hover:border-primary" },
  { label: "Surgery", image: PET_IMAGES.surgery, color: "border-secondary/25 hover:border-secondary" },
  { label: "Dermatology", image: PET_IMAGES.dermatology, color: "border-tertiary/30 hover:border-tertiary" },
  { label: "Dentistry", image: PET_IMAGES.dentistry, color: "border-primary/25 hover:border-primary" },
  { label: "Emergency Care", image: PET_IMAGES.emergency, color: "border-secondary/25 hover:border-secondary" },
  { label: "Nutrition", image: PET_IMAGES.nutrition, color: "border-tertiary/30 hover:border-tertiary" },
  { label: "Behavior", image: PET_IMAGES.behavior, color: "border-primary/25 hover:border-primary" },
  { label: "Exotic Pets", image: null, icon: "🦜", color: "border-secondary/25 hover:border-secondary" },
] as const;

function formatVetCount(count: number) {
  return `${count} Vet${count === 1 ? "" : "s"}`;
}

export default function PopularCategories() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const labels = CATEGORIES.map((c) => c.label);
    doctorService
      .specialtyCounts(labels)
      .then((data) => {
        const map: Record<string, number> = {};
        for (const row of data.counts) {
          map[row.label] = row.count;
        }
        setCounts(map);
      })
      .catch(() => setCounts({}))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative overflow-hidden py-20 md:py-28 bg-white">
      <div className="max-w-container-max mx-auto px-margin">
        <AnimateOnScroll variant="up" className="flex flex-col md:flex-row md:justify-between md:items-end mb-12">
          <div>
            <h2 className="font-bold text-4xl md:text-5xl text-on-surface mb-4">Browse by Specialty</h2>
            <p className="font-body-md text-body-md text-on-surface-variant text-lg">
              Find veterinarians across all major pet care specialties
            </p>
          </div>
          <a
            className="mt-6 md:mt-0 inline-flex text-primary font-semibold items-center gap-2 hover:gap-3 transition-all group"
            href="/doctors"
          >
            View all specialties <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </AnimateOnScroll>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat, index) => {
            const count = counts[cat.label];
            const countLabel = loading
              ? "…"
              : formatVetCount(count ?? 0);

            return (
              <AnimateOnScroll key={cat.label} variant="scale" delay={index * 70}>
              <a
                href={`/doctors?q=${encodeURIComponent(cat.label)}`}
                className={`bg-white rounded-2xl overflow-hidden flex flex-col border-2 cursor-pointer group interactive-card h-full ${cat.color}`}
              >
                <div className="relative h-44 w-full overflow-hidden bg-primary-container">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={`${cat.label} veterinary care`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-secondary-container text-5xl">
                      {cat.icon}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/50 via-secondary/10 to-transparent" />
                </div>
                <div className="p-5 flex flex-col gap-2 flex-1">
                  <h3 className="font-bold text-lg text-on-surface">{cat.label}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="font-body-md text-body-md text-on-surface-variant">{countLabel}</p>
                    <ArrowRight size={20} className="text-outline group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </a>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
