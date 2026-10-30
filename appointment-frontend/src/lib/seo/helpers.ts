import { SITE } from './seo.config';

/** Truncate a string to maxLen, appending ellipsis if needed */
export function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : `${str.slice(0, maxLen - 1)}…`;
}

/** Ensure SEO title is ≤60 chars (before " | Site.name" suffix) */
export function seoTitle(title: string): string {
  return truncate(title, 60);
}

/** Ensure SEO description is ≤160 chars */
export function seoDescription(desc: string): string {
  return truncate(desc, 160);
}

/** Resolve an image URL — absolute if starts with http, else prefix SITE.url */
export function resolveImage(img?: string): string {
  if (!img) return `${SITE.url}${SITE.ogImage}`;
  return img.startsWith('http') ? img : `${SITE.url}${img}`;
}

/** Estimate reading time from plain text */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** Build a slug-based canonical path */
export function slugPath(base: string, slug: string): string {
  return `${base}/${encodeURIComponent(slug)}`;
}
