'use client';

import { useEffect, useState } from 'react';

const TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? 'token';

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(window.localStorage.getItem(TOKEN_KEY));
  }, []);

  const saveToken = (nextToken: string) => {
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
  };

  const clearToken = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return { token, saveToken, clearToken };
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
