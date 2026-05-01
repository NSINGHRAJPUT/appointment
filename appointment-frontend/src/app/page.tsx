import AvailableNow from "@/components/landing/AvailableNow";
import LandingHero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import PopularCategories from "@/components/landing/PopularCategories";
import TrustIndicators from "@/components/landing/TrustIndicators";

export default function HomePage() {
  return (
    <>
      <main>
        {/* Hero Section */}
        <LandingHero />
        {/* Trust Indicators */}
        <TrustIndicators />
        {/* Popular Categories (Bento Grid) */}
        <PopularCategories />
        {/* Available Now */}
        <AvailableNow />
        {/* How it Works */}
        <HowItWorks />
      </main>
    </>
  );
}
