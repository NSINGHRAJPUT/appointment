import { SITE } from '../seo.config';

export interface ProductSchemaInput {
  name: string;
  description: string;
  url: string;
  image?: string;
  priceCents?: number;
  currency?: string;
  ratingAvg?: number;
  reviewCount?: number;
}

export function productSchema(input: ProductSchemaInput) {
  const price = input.priceCents !== undefined ? (input.priceCents / 100).toFixed(2) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image ?? `${SITE.url}${SITE.ogImage}`,
    ...(price !== undefined
      ? {
          offers: {
            '@type': 'Offer',
            price,
            priceCurrency: input.currency ?? 'INR',
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
    ...(input.ratingAvg !== undefined && input.ratingAvg !== null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.ratingAvg.toFixed(1),
            reviewCount: input.reviewCount ?? 0,
          },
        }
      : {}),
  };
}
