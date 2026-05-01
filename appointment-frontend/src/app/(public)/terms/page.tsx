export default function TermsPage() {
  return (
    <>
{/* Main Content */}
      <main className="flex-grow pt-32 pb-24 px-8 max-w-[1024px] mx-auto w-full">
        {/* Header Section */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 text-primary-fixed-variant rounded-full text-label-xs mb-6 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">gavel</span>
            Legal Information
          </div>
          <h1 className="font-display text-display text-on-surface mb-6">
            Terms of Service
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Last updated: October 24, 2024. Please read these terms carefully
            before using our platform.
          </p>
        </div>
        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 relative">
          {/* Table of Contents Sticky Sidebar */}
          <aside className="hidden md:block md:col-span-4 lg:col-span-3">
            <div className="sticky top-32">
              <h3 className="font-label-sm text-label-sm text-on-surface-variant mb-4 uppercase tracking-wider">
                Contents
              </h3>
              <nav className="flex flex-col gap-3">
                <a
                  className="font-body-md text-body-md text-primary font-medium border-l-2 border-primary pl-4 py-1 transition-colors"
                  href="#acceptance"
                >
                  1. Acceptance of Terms
                </a>
                <a
                  className="font-body-md text-body-md text-outline hover:text-on-surface border-l-2 border-surface-variant pl-4 py-1 transition-colors"
                  href="#responsibilities"
                >
                  2. User Responsibilities
                </a>
                <a
                  className="font-body-md text-body-md text-outline hover:text-on-surface border-l-2 border-surface-variant pl-4 py-1 transition-colors"
                  href="#medical-disclaimer"
                >
                  3. Medical Disclaimer
                </a>
                <a
                  className="font-body-md text-body-md text-outline hover:text-on-surface border-l-2 border-surface-variant pl-4 py-1 transition-colors"
                  href="#privacy"
                >
                  4. Privacy &amp; Data Security
                </a>
                <a
                  className="font-body-md text-body-md text-outline hover:text-on-surface border-l-2 border-surface-variant pl-4 py-1 transition-colors"
                  href="#liability"
                >
                  5. Limitations of Liability
                </a>
                <a
                  className="font-body-md text-body-md text-outline hover:text-on-surface border-l-2 border-surface-variant pl-4 py-1 transition-colors"
                  href="#governing-law"
                >
                  6. Governing Law
                </a>
              </nav>
            </div>
          </aside>
          {/* Main Document Content */}
          <article className="md:col-span-8 lg:col-span-9 bg-surface-container-lowest rounded-xl border border-surface-variant p-8 md:p-12 shadow-sm relative z-10">
            <section className="mb-12" id="acceptance">
              <h2 className="font-h2 text-h2 text-on-surface mb-4 flex items-center gap-3">
                <span className="bg-surface-container w-8 h-8 rounded-full flex items-center justify-center font-label-sm text-on-surface">
                  1
                </span>
                Acceptance of Terms
              </h2>
              <div className="space-y-4 font-body-md text-body-md text-on-surface-variant leading-relaxed">
                <p>
                  By accessing or using the Lumina Health platform, you agree to
                  be bound by these Terms of Service and our Privacy Policy. If
                  you do not agree to these terms, please do not use our
                  services.
                </p>
                <p>
                  We reserve the right to modify these terms at any time. We
                  will notify users of any material changes via email or through
                  a prominent notice on our platform.
                </p>
              </div>
            </section>
            <div className="w-full h-px bg-surface-variant my-8"></div>
            <section className="mb-12" id="responsibilities">
              <h2 className="font-h2 text-h2 text-on-surface mb-4 flex items-center gap-3">
                <span className="bg-surface-container w-8 h-8 rounded-full flex items-center justify-center font-label-sm text-on-surface">
                  2
                </span>
                User Responsibilities
              </h2>
              <div className="space-y-4 font-body-md text-body-md text-on-surface-variant leading-relaxed">
                <p>
                  As a user of Lumina Health, you are responsible for
                  maintaining the confidentiality of your account credentials
                  and for all activities that occur under your account.
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4 text-on-surface-variant">
                  <li>
                    You must provide accurate, current, and complete information
                    during registration.
                  </li>
                  <li>
                    You agree not to use the service for any illegal or
                    unauthorized purpose.
                  </li>
                  <li>
                    You must not transmit any worms, viruses, or any code of a
                    destructive nature.
                  </li>
                  <li>
                    You are responsible for obtaining and maintaining all
                    equipment needed to access the service.
                  </li>
                </ul>
              </div>
            </section>
            <div className="w-full h-px bg-surface-variant my-8"></div>
            <section className="mb-12" id="medical-disclaimer">
              <div className="bg-secondary-container/30 border border-secondary-fixed-dim rounded-lg p-6 mb-6">
                <h2 className="font-h3 text-h3 text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    info
                  </span>
                  Medical Disclaimer
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  The content provided through Lumina Health is for
                  informational and organizational purposes only. It is not
                  intended to be a substitute for professional medical advice,
                  diagnosis, or treatment. Always seek the advice of your
                  physician or other qualified health provider with any
                  questions you may have regarding a medical condition.
                </p>
              </div>
            </section>
            <div className="w-full h-px bg-surface-variant my-8"></div>
            <section className="mb-12" id="liability">
              <h2 className="font-h2 text-h2 text-on-surface mb-4 flex items-center gap-3">
                <span className="bg-surface-container w-8 h-8 rounded-full flex items-center justify-center font-label-sm text-on-surface">
                  5
                </span>
                Limitations of Liability
              </h2>
              <div className="space-y-4 font-body-md text-body-md text-on-surface-variant leading-relaxed">
                <p>
                  To the maximum extent permitted by applicable law, Lumina
                  Health shall not be liable for any indirect, incidental,
                  special, consequential, or punitive damages, or any loss of
                  profits or revenues, whether incurred directly or indirectly.
                </p>
                <p>
                  Our total liability for any claims under these terms,
                  including for any implied warranties, is limited to the amount
                  you paid us to use the services (or, if we choose, to
                  supplying you the services again).
                </p>
              </div>
            </section>
            <div className="w-full h-px bg-surface-variant my-8"></div>
            <section id="governing-law">
              <h2 className="font-h2 text-h2 text-on-surface mb-4 flex items-center gap-3">
                <span className="bg-surface-container w-8 h-8 rounded-full flex items-center justify-center font-label-sm text-on-surface">
                  6
                </span>
                Governing Law
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                These Terms shall be governed by and construed in accordance
                with the laws of the State of Delaware, without regard to its
                conflict of law provisions. Any legal action or proceeding
                arising out of or relating to these Terms shall be instituted
                exclusively in the federal or state courts located in Delaware.
              </p>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
