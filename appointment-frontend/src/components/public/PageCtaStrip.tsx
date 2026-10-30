import Link from "next/link";
import { Calendar, MessageCircle } from "lucide-react";

type PageCtaStripProps = {
  title?: string;
  description?: string;
};

export default function PageCtaStrip({
  title = "Ready to book care for your pet?",
  description = "Browse verified veterinarians, compare fees, and book online or in-clinic in minutes.",
}: PageCtaStripProps) {
  return (
    <section className="py-16 md:py-20 bg-surface-container-low">
      <div className="max-w-container-max mx-auto px-margin">
        <div className="rounded-3xl border border-outline-variant bg-white px-8 py-12 md:px-14 text-center shadow-sm">
          <h2 className="font-bold text-2xl md:text-3xl text-on-surface mb-3">{title}</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto mb-8 leading-relaxed">{description}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/doctors"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-semibold text-on-primary hover:opacity-90 transition-all"
            >
              <Calendar size={18} />
              Find a vet
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-7 py-3.5 font-semibold text-on-surface hover:bg-surface-container-low transition-all"
            >
              <MessageCircle size={18} />
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
