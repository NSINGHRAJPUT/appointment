import { SITE } from './seo.config';
import { resolveImage } from './helpers';

export interface OpenGraphInput {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
}

export function buildOpenGraph(input: OpenGraphInput) {
  const img = resolveImage(input.image);
  return {
    title: input.title,
    description: input.description,
    url: input.url,
    siteName: SITE.name,
    type: input.type ?? 'website',
    images: [{ url: img, width: 1200, height: 630, alt: input.title }],
    locale: 'en_US',
    ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    ...(input.authors ? { authors: input.authors } : {}),
    ...(input.tags ? { tags: input.tags } : {}),
  };
}
