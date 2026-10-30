'use client';

import { useEffect, useState } from 'react';

const TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? 'token';
const AUTH_COOKIE = 'pawcare_auth';
const LEGACY_KEYS = ['token', 'authToken', 'accessToken'];

function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=604800${secure}`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0`;
}

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getStoredToken());
  }, []);

  const saveToken = (nextToken: string) => {
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    LEGACY_KEYS.forEach((key) => {
      if (key !== TOKEN_KEY) window.localStorage.removeItem(key);
    });
    setAuthCookie(nextToken);
    setToken(nextToken);
  };

  const clearToken = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key));
    clearAuthCookie();
    setToken(null);
  };

  return { token, saveToken, clearToken };
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const current = window.localStorage.getItem(TOKEN_KEY);
  if (current) return current;
  for (const key of LEGACY_KEYS) {
    const legacy = window.localStorage.getItem(key);
    if (legacy) {
      window.localStorage.setItem(TOKEN_KEY, legacy);
      setAuthCookie(legacy);
      return legacy;
    }
  }
  return null;
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key));
  clearAuthCookie();
}

export { AUTH_COOKIE, TOKEN_KEY };
