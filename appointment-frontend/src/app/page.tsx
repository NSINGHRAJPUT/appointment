import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import AvailableNow from "@/components/landing/AvailableNow";
import ConsultationOptions from "@/components/landing/ConsultationOptions";
import HomeCta from "@/components/landing/HomeCta";
import HomeFaq from "@/components/landing/HomeFaq";
import LandingHero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import PopularCategories from "@/components/landing/PopularCategories";
import TrustIndicators from "@/components/landing/TrustIndicators";
import WhyPawCare from "@/components/landing/WhyPawCare";
import HomeFloatingDecor from "@/components/landing/HomeFloatingDecor";
import HomeScrollProgress from "@/components/landing/HomeScrollProgress";

export const metadata: Metadata = buildMetadata({
  title: 'Online Vet Appointments & Instant Pet Consultations',
  description:
    'Book online and in-clinic vet appointments for your pets. Instant video consultations, specialist care, and trusted veterinary advice — all in one place.',
  path: '/',
  keywords: ['online vet', 'pet appointment', 'veterinary telehealth', 'pet consultation', 'instant vet consult'],
});

export default function HomePage() {
  return (
    <>
      <HomeScrollProgress />
      <main className="relative overflow-hidden">
        <HomeFloatingDecor />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] home-page-hero-bg" />
        <div className="pointer-events-none absolute right-0 top-1/3 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-glow" />
        <div className="pointer-events-none absolute left-8 top-1/2 -z-10 h-48 w-48 rounded-full bg-tertiary/15 blur-3xl animate-float-slow hidden md:block" />
        <div className="pointer-events-none absolute inset-x-0 top-[30rem] -z-10 home-wave home-wave--soft" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 home-wave home-wave--strong" />
        <LandingHero />
        <TrustIndicators />
        <WhyPawCare />
        <PopularCategories />
        <ConsultationOptions />
        <AvailableNow />
        <HowItWorks />
        <HomeFaq />
        <HomeCta />
      </main>
    </>
  );
}
