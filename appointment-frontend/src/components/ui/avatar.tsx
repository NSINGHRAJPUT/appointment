export function Avatar({ name, src, alt }: { name: string; src: string; alt: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('');
  return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">{initials || '?'}</div>;
}
