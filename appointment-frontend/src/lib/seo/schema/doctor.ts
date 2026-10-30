import { SITE } from '../seo.config';
import { canonical } from '../canonical';

export interface DoctorSchemaInput {
  id: string;
  name: string;
  specialization: string;
  bio?: string;
  city?: string;
  country?: string;
  degree?: string;
  yearsOfExperience?: number;
  ratingAvg?: number;
  reviewCount?: number;
  priceCents?: number;
}

export function doctorSchema(input: DoctorSchemaInput) {
  const url = canonical(`/doctors/${input.id}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: input.name,
    description: input.bio,
    url,
    medicalSpecialty: input.specialization,
    ...(input.degree ? { hasCredential: { '@type': 'EducationalOccupationalCredential', credentialCategory: input.degree } } : {}),
    ...(input.city
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: input.city,
            addressCountry: input.country ?? '',
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
