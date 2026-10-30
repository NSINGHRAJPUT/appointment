import { SITE } from './seo.config';
import { resolveImage } from './helpers';

export interface TwitterInput {
  title: string;
  description: string;
  image?: string;
}

export function buildTwitter(input: TwitterInput) {
  return {
    card: 'summary_large_image' as const,
    site: SITE.twitterHandle,
    creator: SITE.twitterHandle,
    title: input.title,
    description: input.description,
    images: [resolveImage(input.image)],
  };
}
