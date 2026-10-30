"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Zap } from "lucide-react";
import { doctorService } from "@/services/doctor.service";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

type Doctor = {
  id: string;
  specialization: string | null;
  priceCents: number;
  responseTimeMins: number | null;
  ratingAvg: number | null;
  reviewCount: number;
  user: { fullName: string };
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AvailableNow() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    doctorService
      .instantAvailable()
      .then((data: any) =>
        setDoctors(Array.isArray(data) ? data.slice(0, 3) : []),
      )
      .catch(() => setDoctors([]));
  }, []);

  const items = doctors.length > 0 ? doctors : null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-container/30 to-white py-20 md:py-28">
      <div className="max-w-container-max mx-auto px-margin">
        <AnimateOnScroll variant="up">
        <div className="flex items-center gap-3 mb-12">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-container rounded-full border border-primary/20">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold text-primary text-sm">Available Now</span>
          </div>
          {items && (
            <span className="text-sm text-on-surface-variant">
              {items.length} vet{items.length !== 1 ? "s" : ""} online
            </span>
          )}
        </div>

        <h2 className="font-bold text-4xl md:text-5xl text-on-surface mb-12">
          Vets Available Now
        </h2>
        </AnimateOnScroll>

        {items ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {items.map((doc, index) => (
                <AnimateOnScroll key={doc.id} variant="up" delay={index * 120}>
                <div className="bg-white rounded-2xl p-6 relative interactive-card border-2 border-outline-variant hover:border-primary/30 h-full">
                  <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 bg-primary-container text-primary font-semibold text-xs px-3 py-1.5 rounded-full border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Online
                  </div>

                  {doc.ratingAvg !== null && (
                    <div className="absolute top-4 left-4 inline-flex items-center gap-1 bg-tertiary-container text-secondary font-semibold text-xs px-3 py-1.5 rounded-full border border-tertiary/30">
                      <Star size={14} className="fill-tertiary text-tertiary" />
                      {doc.ratingAvg.toFixed(1)} ({doc.reviewCount})
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-6 mt-12">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-on-primary flex items-center justify-center font-bold text-lg shadow-lg">
                      {initials(doc.user.fullName)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-on-surface">
                        {doc.user.fullName}
                      </h3>
                      <p className="text-sm text-on-surface-variant">
                        {doc.specialization ?? "General Practice"}
                      </p>
                    </div>
                  </div>

                  {doc.responseTimeMins && (
                    <div className="flex items-center gap-2 mb-6 text-sm text-on-surface-variant">
                      <Zap size={16} className="text-primary" />
                      ~{doc.responseTimeMins}m response time
                    </div>
                  )}

                  <div className="mb-6 pb-6 border-b border-outline-variant">
                    <p className="text-sm text-on-surface-variant mb-1">Consultation Fee</p>
                    <p className="font-bold text-xl text-on-surface">
                      ₹{(doc.priceCents / 100).toFixed(0)}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/instant?doctorId=${doc.id}`)}
                    className="w-full bg-gradient-to-r from-primary to-secondary text-on-primary font-semibold py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all active:scale-95"
                  >
                    Consult Now
                  </button>
                </div>
                </AnimateOnScroll>
              ))}
            </div>

            <AnimateOnScroll variant="fade" delay={400} className="text-center">
              <a
                href="/instant"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all group"
              >
                View all available vets →
              </a>
            </AnimateOnScroll>
          </>
        ) : (
          <AnimateOnScroll variant="scale" className="text-center py-16 bg-white rounded-2xl border-2 border-outline-variant">
            <p className="text-lg text-on-surface-variant mb-4">No vets online right now.</p>
            <a
              href="/doctors"
              className="inline-flex items-center gap-2 bg-primary text-on-primary font-semibold px-6 py-3 rounded-full hover:scale-105 transition-all"
            >
              Browse all vets →
            </a>
          </AnimateOnScroll>
        )}
      </div>
    </section>
  );
}
