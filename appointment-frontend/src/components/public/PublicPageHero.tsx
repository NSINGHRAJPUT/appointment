import Link from "next/link";
import { ArrowRight } from "lucide-react";

type PublicPageHeroProps = {
  badge?: string;
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export default function PublicPageHero({
  badge,
  title,
  description,
  imageSrc,
  imageAlt = "",
  primaryCta,
  secondaryCta,
}: PublicPageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary to-primary text-on-primary">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-white/20 blur-3xl animate-float-slow" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-tertiary/40 blur-3xl animate-float-reverse animate-float-delay-2" />
      </div>

      <div className="relative max-w-container-max mx-auto px-margin py-14 md:py-20 w-full">
        <div
          className={
            imageSrc
              ? "grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 md:gap-12 items-center"
              : ""
          }
        >
          <div className={imageSrc ? "min-w-0 w-full" : "max-w-3xl mx-auto text-center"}>
            {badge && (
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider mb-4">
                {badge}
              </p>
            )}
            <h1 className="font-bold text-3xl sm:text-4xl md:text-[2.75rem] leading-tight mb-4 text-balance">
              {title}
            </h1>
            <p className="text-base md:text-lg text-on-primary/90 leading-relaxed max-w-prose">
              {description}
            </p>
            {(primaryCta || secondaryCta) && (
              <div
                className={`mt-6 flex flex-col sm:flex-row gap-3 ${
                  imageSrc ? "" : "justify-center"
                }`}
              >
                {primaryCta && (
                  <Link
                    href={primaryCta.href}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-primary hover:shadow-lg transition-all"
                  >
                    {primaryCta.label}
                    <ArrowRight size={18} />
                  </Link>
                )}
                {secondaryCta && (
                  <Link
                    href={secondaryCta.href}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/70 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-all"
                  >
                    {secondaryCta.label}
                  </Link>
                )}
              </div>
            )}
          </div>

          {imageSrc && (
            <div className="relative min-w-0 w-full">
              <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border-4 border-white/20 shadow-2xl animate-float-slow">
                <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
