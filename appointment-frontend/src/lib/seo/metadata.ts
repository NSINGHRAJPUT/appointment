import type { Metadata } from 'next';
import { SITE } from './seo.config';
import { canonical } from './canonical';

export interface PageSEOInput {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  keywords?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  /** Override rel=canonical completely */
  canonicalUrl?: string;
}

export function buildMetadata(input: PageSEOInput): Metadata {
  const {
    title,
    description,
    path,
    ogImage = SITE.ogImage,
    ogType = 'website',
    keywords,
    noIndex = false,
    noFollow = false,
    publishedTime,
    modifiedTime,
    author,
    canonicalUrl,
  } = input;

  const url = canonicalUrl ?? canonical(path);
  const fullTitle = `${title} | ${SITE.name}`;
  const resolvedImage = ogImage.startsWith('http') ? ogImage : `${SITE.url}${ogImage}`;

  return {
    title: fullTitle,
    description,
    ...(keywords?.length ? { keywords: keywords.join(', ') } : {}),
    metadataBase: new URL(SITE.url),
    alternates: { canonical: url },
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: { index: !noIndex, follow: !noFollow },
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE.name,
      type: ogType,
      images: [{ url: resolvedImage, width: SITE.ogImageWidth, height: SITE.ogImageHeight, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(author ? { authors: [author] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE.twitterHandle,
      title: fullTitle,
      description,
      images: [resolvedImage],
    },
  };
}
