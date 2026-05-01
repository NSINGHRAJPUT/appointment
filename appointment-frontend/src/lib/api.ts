const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function apiFetch<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export function waLink(phoneNumber?: string): string | null {
  if (!phoneNumber) return null;
  const sanitized = phoneNumber.replace(/[^\d]/g, '');
  if (!sanitized) return null;
  return `https://wa.me/${sanitized}`;
}
