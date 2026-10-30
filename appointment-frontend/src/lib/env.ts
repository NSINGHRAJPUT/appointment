function requireEnv(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return '';
  }
  return value.trim();
}

export const env = {
  apiUrl:
    requireEnv('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL) ||
    'http://localhost:4000',
  appUrl:
    requireEnv('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL) ||
    'http://localhost:3000',
  wsUrl:
    requireEnv('NEXT_PUBLIC_WS_URL', process.env.NEXT_PUBLIC_WS_URL) ||
    'http://localhost:4000',
  authTokenKey:
    process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY?.trim() || 'accessToken',
  vapidPublicKey:
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || '',
};
