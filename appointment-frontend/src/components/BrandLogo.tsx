import Image from 'next/image';
import Link from 'next/link';
import { SITE } from '@/lib/seo';

type BrandLogoProps = {
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  href?: string;
  className?: string;
};

export function BrandLogo({
  size = 40,
  showWordmark = true,
  wordmarkClassName = 'font-bold text-xl text-on-surface',
  href = '/',
  className = 'flex items-center gap-2 group',
}: BrandLogoProps) {
  const content = (
    <>
      <Image
        src={SITE.logo}
        alt={`${SITE.name} logo`}
        width={size}
        height={size}
        className="rounded-lg object-contain shrink-0"
        priority
      />
      {showWordmark && (
        <span className={`${wordmarkClassName} group-hover:text-primary transition-colors`}>
          {SITE.name}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
