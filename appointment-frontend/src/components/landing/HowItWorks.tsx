import { Calendar, ShieldPlus, UserSearch } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="max-w-container-max mx-auto px-margin py-30 text-center">
      <h2 className="font-h1 text-h1 text-on-surface mb-xl">
        How MediConsult Works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-xl relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-12 left-[16.6%] right-[16.6%] h-px bg-outline-variant z-0"></div>
        {/* Step 1 */}
        <div className="flex flex-col items-center relative z-10">
          <div className="w-24 h-24 rounded-full bg-surface-container-lowest border-4 border-background flex items-center justify-center shadow-sm mb-lg">
            <span className="material-symbols-outlined text-[32px] text-primary">
              <UserSearch size={36} />
            </span>
          </div>
          <h3 className="font-h2 text-h2 text-on-surface mb-sm">
            1. Find your doctor
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-75">
            Filter by specialty, symptoms, or location to find the perfect match
            for your needs.
          </p>
        </div>
        {/* Step 2 */}
        <div className="flex flex-col items-center relative z-10">
          <div className="w-24 h-24 rounded-full bg-surface-container-lowest border-4 border-background flex items-center justify-center shadow-sm mb-lg">
            <span className="material-symbols-outlined text-[32px] text-primary">
              <Calendar size={36} />
            </span>
          </div>
          <h3 className="font-h2 text-h2 text-on-surface mb-sm">
            2. Book a time
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-75">
            Select an available time slot that fits your schedule for a video or
            in-person visit.
          </p>
        </div>
        {/* Step 3 */}
        <div className="flex flex-col items-center relative z-10">
          <div className="w-24 h-24 rounded-full bg-surface-container-lowest border-4 border-background flex items-center justify-center shadow-sm mb-lg">
            <span className="material-symbols-outlined text-[32px] text-primary">
              <ShieldPlus size={36} />
            </span>
          </div>
          <h3 className="font-h2 text-h2 text-on-surface mb-sm">
            3. Consult securely
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-75">
            Connect via our encrypted platform and receive your diagnosis and
            treatment plan.
          </p>
        </div>
      </div>
    </section>
  );
}
