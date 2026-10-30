import Link from "next/link";
import { FileText } from "lucide-react";

export type LegalSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type LegalDocumentLayoutProps = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  relatedLinks?: { href: string; label: string }[];
};

export default function LegalDocumentLayout({
  title,
  lastUpdated,
  sections,
  relatedLinks = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/cookies", label: "Cookie Policy" },
    { href: "/hipaa", label: "Data Protection" },
  ],
}: LegalDocumentLayoutProps) {
  return (
    <main className="pb-20">
      <section className="bg-surface-container-low border-b border-outline-variant">
        <div className="max-w-container-max mx-auto px-margin py-14 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            <FileText size={14} />
            Legal
          </div>
          <h1 className="font-bold text-4xl md:text-5xl text-on-surface mb-3">{title}</h1>
          <p className="text-on-surface-variant">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <div className="max-w-container-max mx-auto px-margin pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <aside className="lg:col-span-3 hidden lg:block sticky top-24">
            <nav className="rounded-2xl border border-outline-variant bg-white p-5 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
                On this page
              </p>
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-lg px-3 py-2 text-sm text-on-surface-variant hover:bg-primary-container hover:text-primary transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </nav>
            {relatedLinks.length > 0 && (
              <div className="mt-6 rounded-2xl border border-outline-variant bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
                  Related policies
                </p>
                <ul className="space-y-2">
                  {relatedLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-primary hover:underline">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <article className="lg:col-span-9 rounded-2xl border border-outline-variant bg-white p-8 md:p-10 space-y-10">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="font-bold text-2xl text-on-surface mb-4">{section.title}</h2>
                <div className="text-on-surface-variant leading-relaxed space-y-4 text-sm md:text-base">
                  {section.content}
                </div>
                {index < sections.length - 1 && (
                  <div className="mt-10 h-px bg-outline-variant/40" />
                )}
              </section>
            ))}
          </article>
        </div>
      </div>
    </main>
  );
}
