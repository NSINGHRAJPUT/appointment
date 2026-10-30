import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'pawcare_auth';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/chat',
  '/call',
  '/appointments',
  '/communication',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (token) return NextResponse.next();

  const loginUrl = new URL('/auth', request.url);
  loginUrl.searchParams.set('returnUrl', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chat',
    '/call',
    '/appointments/:path*',
    '/communication',
  ],
};
