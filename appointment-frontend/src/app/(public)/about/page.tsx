import { ClockCheck, Stethoscope, UserCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      {/* Main Content Canvas */}
      <main className="flex-grow pt-32 pb-24">
        <div className="max-w-container-max mx-auto px-margin">
          {/* Hero Section */}
          <section className="flex flex-col lg:flex-row items-center gap-xl mb-32">
            <div className="lg:w-1/2 flex flex-col gap-lg">
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">
                Our Story
              </span>
              <h1 className="font-display text-display text-on-background">
                Precision care,
                <br />
                delivered instantly.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                At Lumina Health, we believe that clinical excellence should not
                be hindered by friction. We are building the technological
                foundation for the future of healthcare, ensuring that
                practitioners can focus entirely on patient outcomes while trust
                is guaranteed at every step.
              </p>
            </div>
            <div className="lg:w-1/2 w-full h-125 rounded-xl overflow-hidden bg-surface-container-low border border-surface-variant relative shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)]">
              <img
                alt="Medical professional reviewing data"
                className="w-full h-full object-cover opacity-90"
                data-alt="confident male doctor analyzing medical data on a transparent glass screen in a modern sterile clinic setting"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBac0D3jt6uCH3qEAgsXJxpjHKg0CasmT84UxVkOhejMjpg0zh7OiW6wFhL-quCtTKnXnhCdDaUuymgTtN25h9OVhOk1xYdbGpR5oC0suo_va9PYVKcS9PkOEG3tiSItPhINtusTegmQqmzM8m0JAoNI6AOEmJt_EJ27zu-o05Hq2OPIz5Qh6HgeAKIyQYjFg9sOwOx4Dp9ntMP_d_zpiO9IVTP8jZ5PCPvWuerJLVE9EeFg64X1orMglngHBe-ZrEXENSKRAkMG-YC"
              />
            </div>
          </section>
          {/* Values Bento Grid */}
          <section className="mb-32">
            <h2 className="font-h1 text-h1 text-on-background mb-lg text-center">
              Core Principles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md transition-all hover:shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)]">
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    <UserCheck />
                  </span>
                </div>
                <h3 className="font-h3 text-h3 text-on-background">
                  Patient Trust
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Security and privacy are not features; they are the bedrock of
                  our platform. We adhere strictly to global compliance
                  standards, ensuring patient data is rigorously protected.
                </p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md transition-all hover:shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)]">
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    <ClockCheck />
                  </span>
                </div>
                <h3 className="font-h3 text-h3 text-on-background">
                  Instant Delivery
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Time is a critical variable in clinical settings. Our
                  infrastructure is optimized for microsecond latency,
                  delivering vital insights exactly when they are needed.
                </p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md transition-all hover:shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)]">
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    <Stethoscope />
                  </span>
                </div>
                <h3 className="font-h3 text-h3 text-on-background">
                  Clinical Excellence
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Every feature is designed in collaboration with leading
                  practitioners, ensuring our tools align perfectly with
                  rigorous medical standards and workflows.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
