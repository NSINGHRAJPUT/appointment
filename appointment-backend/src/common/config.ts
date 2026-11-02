const DEV_JWT_FALLBACK = 'dev_secret';

export function getJwtSecret(): string {
  const secret =
    process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? DEV_JWT_FALLBACK;
  if (
    process.env.NODE_ENV === 'production' &&
    (!secret || secret === DEV_JWT_FALLBACK || secret.length < 32)
  ) {
    throw new Error(
      'JWT_ACCESS_SECRET must be set to a strong value (32+ chars) in production',
    );
  }
  return secret;
}

export function getCorsOrigins(): string[] {
  const defaults = [
    'https://appointment.nsrgfx.in',
    'http://localhost:3000',
  ];
  const fromEnv = [
    process.env.FRONTEND_URL,
    process.env.WS_CORS_ORIGIN,
  ].filter((v): v is string => Boolean(v?.trim()));
  return [...new Set([...fromEnv, ...defaults])];
}

export function validateProductionConfig(): void {
  if (process.env.NODE_ENV !== 'production') return;
  getJwtSecret();
}
