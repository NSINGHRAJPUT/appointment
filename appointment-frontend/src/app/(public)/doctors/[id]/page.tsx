"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  Star,
  MapPin,
  Check,
  CalendarDays,
  Building2,
  MessageCircle,
  Shield,
} from "lucide-react";
import { doctorService } from "@/services/doctor.service";
import { waLink } from "@/lib/api";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type Doctor = {
  id: string;
  bio: string | null;
  specialization: string | null;
  priceCents: number;
  currency: string;
  yearsOfExperience: number | null;
  clinicName: string | null;
  clinicAddress: string | null;
  city: string | null;
  country: string | null;
  degree: string | null;
  university: string | null;
  ratingAvg: number | null;
  reviewCount: number;
  nextAvailableSlotAt: string | null;
  responseTimeMins: number | null;
  photoUrl?: string | null;
  user: { fullName: string; whatsappNumber?: string };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    author: { fullName: string };
  }>;
};

function fmtPrice(cents: number, currency: string) {
  return cents === 0
    ? "Free"
    : `${currency === "INR" ? "₹" : "$"}${(cents / 100).toFixed(0)}`;
}

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    doctorService
      .getById(id as string)
      .then((data: any) => setDoctor(data))
      .catch(() => setDoctor(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );

  if (!doctor)
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <p className="text-on-surface-variant">Doctor not found.</p>
        <a href="/doctors" className="mt-4 inline-block text-primary hover:underline">
          ← Back to Doctors
        </a>
      </div>
    );

  const waUrl = waLink(doctor.user.whatsappNumber);

  return (
    <>
      <BookingWizard
        open={showBooking}
        onClose={() => setShowBooking(false)}
        doctor={{
          id: doctor.id,
          fullName: doctor.user.fullName,
          specialization: doctor.specialization,
          priceCents: doctor.priceCents,
          currency: doctor.currency,
        }}
      />

      <main className="mx-auto w-full max-w-container-max px-margin py-margin">
        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          <div className="flex flex-col gap-margin lg:col-span-8">
            <section className="relative flex flex-col items-start gap-6 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 sm:flex-row sm:items-center">
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
              <Avatar
                name={doctor.user.fullName}
                src={doctor.photoUrl}
                size={128}
                className="!rounded-full border-4 border-surface-container-lowest shadow-sm"
              />
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-h1 font-semibold text-on-surface">
                    {doctor.user.fullName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <Check size={11} strokeWidth={3} /> Verified demo vet
                  </span>
                </div>
                <p className="mb-3 text-body-lg font-medium text-primary">
                  {doctor.specialization ?? "General Practice"}
                  {doctor.degree && ` · ${doctor.degree}`}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
                  {doctor.clinicName && (
                    <div className="flex items-center gap-1.5">
                      <Building2 size={16} />
                      {doctor.clinicName}
                    </div>
                  )}
                  {doctor.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} />
                      {doctor.city}
                      {doctor.country ? `, ${doctor.country}` : ""}
                    </div>
                  )}
                  {doctor.ratingAvg !== null && (
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-on-surface">
                        {doctor.ratingAvg.toFixed(1)}
                      </span>
                      <span>({doctor.reviewCount} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                {
                  value: doctor.yearsOfExperience
                    ? `${doctor.yearsOfExperience}+`
                    : "—",
                  label: "Years exp.",
                },
                {
                  value: doctor.ratingAvg ? doctor.ratingAvg.toFixed(1) : "—",
                  label: "Rating",
                },
                {
                  value: doctor.responseTimeMins
                    ? `~${doctor.responseTimeMins}m`
                    : "—",
                  label: "Response",
                },
                { value: doctor.reviewCount.toString(), label: "Reviews" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4 text-center"
                >
                  <span className="mb-1 font-display text-h2 font-semibold text-on-surface">
                    {stat.value}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                    {stat.label}
                  </span>
                </div>
              ))}
            </section>

            {doctor.bio && (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
                <h2 className="mb-4 font-display text-h2 font-semibold text-on-surface">
                  About
                </h2>
                <p className="text-body-lg text-on-surface-variant">{doctor.bio}</p>
              </section>
            )}

            {doctor.reviews.length > 0 && (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
                <h2 className="mb-4 font-display text-h2 font-semibold text-on-surface">
                  Patient reviews
                </h2>
                <div className="space-y-4">
                  {doctor.reviews.slice(0, 5).map((r) => (
                    <div
                      key={r.id}
                      className="border-b border-outline-variant/50 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={12}
                              className={
                                n <= r.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-outline-variant"
                              }
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-on-surface">
                          {r.author.fullName}
                        </span>
                        <span className="ml-auto text-xs text-on-surface-variant">
                          {new Date(r.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-on-surface-variant">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="relative lg:col-span-4">
            <div className="sticky top-24 flex flex-col gap-3">
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-outline-variant/30 pb-4">
                  <span className="text-sm text-on-surface-variant">
                    Consultation fee
                  </span>
                  <span className="font-display text-h2 font-semibold text-on-surface">
                    {fmtPrice(doctor.priceCents, doctor.currency)}
                  </span>
                </div>
                <Button
                  className="mb-3 w-full"
                  size="lg"
                  onClick={() => setShowBooking(true)}
                >
                  <CalendarDays size={18} className="mr-2" />
                  Book appointment
                </Button>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 py-2.5 text-sm font-medium text-[#075E54] transition hover:bg-[#25D366]/20"
                  >
                    <MessageCircle size={18} />
                    WhatsApp
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                <Shield className="shrink-0 text-primary" size={20} />
                <span className="text-sm text-on-surface-variant">
                  Secure sessions · Demo veterinarian catalog
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
