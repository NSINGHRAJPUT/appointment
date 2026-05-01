import { ClockCheck, Lock, Shield, Star } from "lucide-react";

export default function TrustIndicators() {
  return (
    <section className="border-y border-surface-variant bg-surface-container-lowest">
      <div className="max-w-container-max mx-auto px-margin py-lg flex flex-wrap justify-center md:justify-between items-center gap-gutter opacity-80">
        <div className="flex items-center gap-sm text-secondary font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[20px] text-primary">
            <Shield />
          </span>
          Verified Doctors
        </div>
        <div className="flex items-center gap-sm text-secondary font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[20px] text-primary">
            <Star />
          </span>
          High Ratings
        </div>
        <div className="flex items-center gap-sm text-secondary font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[20px] text-primary">
            <Lock />
          </span>
          Secure Data
        </div>
        <div className="flex items-center gap-sm text-secondary font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[20px] text-primary">
            <ClockCheck />
          </span>
          24/7 Support
        </div>
      </div>
    </section>
  );
}
