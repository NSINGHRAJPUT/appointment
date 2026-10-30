import { env } from './env';
import { clearStoredAuth } from '@/hooks/use-auth';

const API_URL = env.apiUrl;

function parseErrorMessage(text: string, status: number): string {
  try {
    const json = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(json.message)) return json.message.join(', ');
    if (json.message) return json.message;
  } catch {
    // not JSON
  }
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status >= 500) return 'Something went wrong on our end. Please try again.';
  return text || `Request failed (${status})`;
}

export function handleUnauthorized() {
  if (typeof window === 'undefined') return;
  clearStoredAuth();
  const returnUrl = encodeURIComponent(
    window.location.pathname + window.location.search,
  );
  window.location.href = `/auth?returnUrl=${returnUrl}`;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  token?: string,
  onProgress?: (progress: ProgressEvent) => void
): Promise<T> {
  const isFormData = init?.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (init?.headers) {
    if (typeof init.headers === 'object' && !Array.isArray(init.headers)) {
      Object.assign(headers, init.headers);
    }
  }

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401 && typeof window !== 'undefined') {
      handleUnauthorized();
    }
    throw new Error(parseErrorMessage(text, response.status));
  }
  return (await response.json()) as T;
}

export function waLink(phoneNumber?: string): string | null {
  if (!phoneNumber) return null;
  const sanitized = phoneNumber.replace(/[^\d]/g, '');
  if (!sanitized) return null;
  return `https://wa.me/${sanitized}`;
}
