import { SITE } from '../seo.config';

export interface ArticleSchemaInput {
  title: string;
  description: string;
  url: string;
  image?: string;
  author?: string;
  publishedTime: string;
  modifiedTime?: string;
  tags?: string[];
}

export function articleSchema(input: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: input.url,
    image: input.image ?? `${SITE.url}${SITE.ogImage}`,
    datePublished: input.publishedTime,
    dateModified: input.modifiedTime ?? input.publishedTime,
    author: {
      '@type': 'Person',
      name: input.author ?? SITE.name,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: { '@type': 'ImageObject', url: `${SITE.url}${SITE.logo}` },
    },
    ...(input.tags?.length ? { keywords: input.tags.join(', ') } : {}),
  };
}
