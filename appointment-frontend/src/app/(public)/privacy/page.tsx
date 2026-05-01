export default function PrivacyPage() {
  return (
    <>
      {/* Main Content */}
      <main className="grow pt-30 pb-xl px-margin max-w-container-max mx-auto w-full">
        {/* Header */}
        <div className="mb-xl">
          <h1 className="font-display text-display text-on-surface mb-sm">
            Privacy Policy
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Last updated: October 24, 2024
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-start">
          {/* Sidebar Navigation */}
          <aside className="md:col-span-3 lg:col-span-2 hidden md:block sticky top-25">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)]">
              <h3 className="font-label-xs text-label-xs text-outline uppercase tracking-wider mb-md">
                Contents
              </h3>
              <nav className="flex flex-col space-y-sm">
                <a
                  className="font-label-sm text-label-sm text-primary hover:text-primary-container transition-colors py-xs border-l-2 border-primary pl-sm"
                  href="#data-collection"
                >
                  Data Collection
                </a>
                <a
                  className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors py-xs border-l-2 border-transparent pl-sm"
                  href="#use-of-data"
                >
                  Use of Data
                </a>
                <a
                  className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors py-xs border-l-2 border-transparent pl-sm"
                  href="#your-rights"
                >
                  Your Rights
                </a>
                <a
                  className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors py-xs border-l-2 border-transparent pl-sm"
                  href="#security"
                >
                  Security
                </a>
              </nav>
            </div>
          </aside>
          {/* Policy Content */}
          <article className="md:col-span-9 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg p-lg md:p-xl shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)]">
            <section className="mb-xl" id="data-collection">
              <h2 className="font-h2 text-h2 text-on-surface mb-md">
                Data Collection
              </h2>
              <div className="font-body-md text-body-md text-on-surface-variant space-y-md">
                <p>
                  At Lumina Health, precision and privacy are our foundational
                  principles. We collect information necessary to provide you
                  with exceptional clinical software services. This includes
                  personal identification information, professional credentials,
                  and interactions within our platform.
                </p>
                <p>
                  When you utilize our applications, we log metadata related to
                  performance and usage patterns to continually refine our
                  interface and reduce cognitive load for practitioners.
                </p>
              </div>
            </section>
            <div className="h-px w-full bg-outline-variant/30 mb-xl"></div>
            <section className="mb-xl" id="use-of-data">
              <h2 className="font-h2 text-h2 text-on-surface mb-md">
                Use of Data
              </h2>
              <div className="font-body-md text-body-md text-on-surface-variant space-y-md">
                <p>
                  The data we gather is strictly utilized to maintain, analyze,
                  and enhance the Lumina Health ecosystem. Your information
                  enables us to:
                </p>
                <ul className="list-disc pl-lg space-y-xs">
                  <li>Authenticate secure access to clinical portals.</li>
                  <li>Deliver critical system updates and security alerts.</li>
                  <li>Provide tailored support and troubleshoot anomalies.</li>
                </ul>
              </div>
            </section>
            <div className="h-px w-full bg-outline-variant/30 mb-xl"></div>
            <section className="mb-xl" id="your-rights">
              <h2 className="font-h2 text-h2 text-on-surface mb-md">
                Your Rights
              </h2>
              <div className="font-body-md text-body-md text-on-surface-variant space-y-md">
                <p>
                  You retain comprehensive control over your personal data.
                  Under relevant privacy frameworks, you have the right to
                  request access, correction, or deletion of your information
                  stored within our infrastructure.
                </p>
              </div>
            </section>
            <div className="h-px w-full bg-outline-variant/30 mb-xl"></div>
            <section className="mb-lg" id="security">
              <h2 className="font-h2 text-h2 text-on-surface mb-md">
                Security
              </h2>
              <div className="font-body-md text-body-md text-on-surface-variant space-y-md">
                <p>
                  We deploy robust, modern corporate security protocols. Our
                  data architecture is fortified with enterprise-grade
                  encryption both in transit and at rest, reflecting our
                  commitment to the high-stakes healthcare environment we serve.
                </p>
              </div>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
