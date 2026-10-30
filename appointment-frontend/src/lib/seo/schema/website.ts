import { SITE } from "../seo.config";

export interface WebsiteSchemaInput {
  searchPath?: string;
}

export function websiteSchema(input: WebsiteSchemaInput = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    ...(input.searchPath
      ? {
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE.url}${input.searchPath}?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }
      : {}),
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: `${SITE.url}${SITE.logo}`,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: SITE.email,
      contactType: "customer support",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "100 Innovation Drive, Suite 400",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      postalCode: "94103",
      addressCountry: "US",
    },
    sameAs: Object.values(SITE.social),
  };
}
