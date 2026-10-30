export { SITE } from './seo.config';
export { canonical } from './canonical';
export { buildMetadata } from './metadata';
export type { PageSEOInput } from './metadata';
export { JsonLd } from './JsonLd';
export { buildOpenGraph } from './openGraph';
export type { OpenGraphInput } from './openGraph';
export { buildTwitter } from './twitter';
export type { TwitterInput } from './twitter';
export {
  truncate,
  seoTitle,
  seoDescription,
  resolveImage,
  readingTime,
  slugPath,
} from './helpers';
export { websiteSchema, organizationSchema as websiteOrgSchema } from './schema/website';
export { organizationSchema } from './schema/organization';
export { breadcrumbSchema } from './schema/breadcrumb';
export type { BreadcrumbItem } from './schema/breadcrumb';
export { faqSchema } from './schema/faq';
export type { FaqItem } from './schema/faq';
export { articleSchema } from './schema/article';
export type { ArticleSchemaInput } from './schema/article';
export { doctorSchema } from './schema/doctor';
export type { DoctorSchemaInput } from './schema/doctor';
export { productSchema } from './schema/product';
export type { ProductSchemaInput } from './schema/product';
