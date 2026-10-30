import Image from 'next/image';
import clsx from 'clsx';

export function Avatar({
  name,
  src,
  alt,
  size = 36,
  className,
}: {
  name: string;
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  if (src) {
    return (
      <Image
        src={src}
        alt={alt || name}
        width={size}
        height={size}
        className={clsx(
          'rounded-full object-cover ring-2 ring-primary/15 shrink-0',
          className,
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full bg-primary text-on-primary text-xs font-semibold shrink-0 ring-2 ring-primary/15',
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={alt || name}
    >
      {initials || '?'}
    </div>
  );
}
