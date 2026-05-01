'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { getStoredToken } from '@/hooks/use-auth';
import { Menu } from 'lucide-react';

type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN' | null;
type NavItem = { href: string; label: string };

function navFor(role: Role): NavItem[] {
  if (role === 'ADMIN') return [
    { href: '/dashboard/admin', label: 'dashboard' },
    // { href: '/doctors', label: 'Doctors' },
    // { href: '/chat', label: 'Chat' },
  ];
  if (role === 'DOCTOR') return [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/onboarding', label: 'Onboarding' },
    // { href: '/doctors', label: 'Doctors' },
    { href: '/chat', label: 'Chat' },
    // { href: '/call', label: 'Call' },
  ];
  if (role === 'PATIENT') return [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/doctors', label: 'Doctors' },
    { href: '/chat', label: 'Chat' },
    // { href: '/call', label: 'Call' },
  ];
  return [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/doctors', label: 'Doctors' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ];
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = getStoredToken();
    setToken(t);
    if (!t) { setRole(null); return; }
    authService.me(t)
      .then((me: any) => setRole((me?.role as Role) ?? null))
      .catch(() => setRole(null));
  }, [pathname]);

  const nav = useMemo(() => navFor(role), [role]);

  function logout() {
    const key = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? 'token';
    window.localStorage.removeItem(key);
    setToken(null);
    setRole(null);
    router.push('/auth');
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 md:px-8">
          <Link href="/" className="text-lg font-bold tracking-tight text-teal-700">
            MediConsult
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? 'text-teal-700 font-semibold' : 'text-slate-600 hover:text-teal-700'}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {!token ? (
              <>
                <Link href="/instant" className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-800 transition-colors">
                  Consult Now
                </Link>
                <Link href="/auth" className="rounded-lg border border-teal-700 px-3 py-1.5 text-sm font-semibold text-teal-700">
                  Sign In
                </Link>
              </>
            ) : (
              <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700">
                Logout
              </button>
            )}
          </div>

          <button className="rounded-md border border-slate-300 px-2 py-1 text-sm md:hidden" onClick={() => setOpen((v) => !v)}>
          <Menu />
          </button>
        </div>
        {open && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="py-1 text-slate-700">
                  {item.label}
                </Link>
              ))}
              {!token ? (
                <>
                  <Link href="/instant" onClick={() => setOpen(false)} className="py-1 font-semibold text-teal-700">Consult Now</Link>
                  <Link href="/auth" onClick={() => setOpen(false)} className="py-1 font-medium text-teal-700">Sign In</Link>
                </>
              ) : (
                <button onClick={logout} className="py-1 text-left text-slate-700">Logout</button>
              )}
            </div>
          </div>
        )}
      </header>

      {children}

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-8">
          <p>© 2026 MediConsult</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/faq">FAQ</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
