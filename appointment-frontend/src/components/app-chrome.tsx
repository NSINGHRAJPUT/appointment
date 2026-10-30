"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { getStoredToken, clearStoredAuth } from "@/hooks/use-auth";
import { BrandLogo } from "@/components/BrandLogo";
import { NotificationBell } from "@/components/notification-bell";
import { IncomingRequestModal } from "@/components/instant-consult/IncomingRequestModal";
import { Menu, X, Heart, LogOut, LogIn, Zap } from "lucide-react";

type Role = "PATIENT" | "DOCTOR" | "ADMIN" | null;
type NavItem = { href: string; label: string };

function navFor(role: Role): NavItem[] {
  if (role === "ADMIN")
    return [{ href: "/dashboard/admin", label: "Dashboard" }];
  if (role === "DOCTOR")
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/profile", label: "Profile" },
      { href: "/chat", label: "Chat" },
    ];
  if (role === "PATIENT")
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/doctors", label: "Find Vets" },
      { href: "/dashboard/profile", label: "Profile" },
      { href: "/chat", label: "Chat" },
    ];
  return [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/doctors", label: "Vets" },
    { href: "/faq", label: "FAQ" },
    { href: "/appointment-lookup", label: "Track" },
    { href: "/contact", label: "Contact" },
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
    if (!t) {
      setRole(null);
      return;
    }
    authService
      .me(t)
      .then((me: any) => setRole((me?.role as Role) ?? null))
      .catch(() => setRole(null));
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const nav = useMemo(() => navFor(role), [role]);

  function logout() {
    clearStoredAuth();
    setToken(null);
    setRole(null);
    router.push("/auth");
  }

  const isAuthPage = pathname === "/auth";
  const showInstant = !isAuthPage && role !== "DOCTOR" && role !== "ADMIN";
  // Prefer signed-in chrome on /auth when a session exists
  const effectiveNav =
    isAuthPage && token && !role
      ? [{ href: "/dashboard", label: "Dashboard" }]
      : nav;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 shrink-0 border-b border-outline-variant/70 bg-surface-container-lowest/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
          <BrandLogo wordmarkClassName="font-display font-bold text-xl text-on-surface tracking-tight" />

          <nav className="hidden md:flex items-center gap-1">
            {effectiveNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary-container text-primary"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            {token && <NotificationBell token={token} />}
            <div className="hidden md:flex items-center gap-2">
              {showInstant && (
                <Link
                  href="/instant"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-brand-forest px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:shadow-md"
                >
                  <Zap size={15} />
                  Instant Consult
                </Link>
              )}
              {!token ? (
                <Link
                  href={`/auth?returnUrl=${encodeURIComponent(pathname || "/")}`}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-primary/40 px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary-container"
                >
                  <LogIn size={16} />
                  Sign In
                </Link>
              ) : (
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-full border border-error/30 px-5 py-2 text-sm font-semibold text-error transition hover:bg-error-container"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              )}
            </div>
            <button
              className="md:hidden rounded-xl p-2 text-on-surface-variant transition hover:bg-surface-container"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-outline-variant bg-surface-container-lowest px-4 py-4">
            <div className="flex flex-col gap-1">
              {effectiveNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-2.5 font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-primary-container text-primary"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-outline-variant pt-4">
                {showInstant && (
                  <Link
                    href="/instant"
                    onClick={() => setOpen(false)}
                    className="w-full rounded-full bg-gradient-to-r from-primary to-brand-forest px-4 py-2.5 text-center font-semibold text-on-primary"
                  >
                    Instant Consult
                  </Link>
                )}
                {!token ? (
                  <Link
                    href={`/auth?returnUrl=${encodeURIComponent(pathname || "/")}`}
                    onClick={() => setOpen(false)}
                    className="w-full rounded-full border-2 border-primary px-4 py-2.5 text-center font-semibold text-primary"
                  >
                    Sign In
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="w-full rounded-full border border-error/30 px-4 py-2.5 text-center font-semibold text-error"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {role === "DOCTOR" && token && (
        <IncomingRequestModal token={token} />
      )}

      <main className="w-full flex-1">{children}</main>

      <footer className="relative overflow-hidden bg-gradient-to-b from-brand-ink via-[#15221f] to-brand-forest text-inverse-on-surface">
        <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-tertiary/15 blur-3xl" />
        <div className="relative mx-auto w-full max-w-7xl px-4 md:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <BrandLogo
                href="/"
                wordmarkClassName="font-display font-bold text-xl text-white"
                className="flex items-center gap-2 mb-4 group"
              />
              <p className="text-sm text-inverse-on-surface/70 leading-relaxed">
                Connecting pet parents with verified veterinarians for secure
                online and in-clinic consultations.
              </p>
            </div>

            <div>
              <h3 className="font-display font-semibold text-white mb-5">
                Product
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/instant" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    Instant Consult
                  </Link>
                </li>
                <li>
                  <Link href="/doctors" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    Find Vets
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-semibold text-white mb-5">
                Company
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/about" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/appointment-lookup" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    Track appointment
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/blogs" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-semibold text-white mb-5">
                Legal
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/privacy" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="/hipaa" className="text-inverse-on-surface/65 hover:text-inverse-primary transition-colors">
                    Data Protection
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-inverse-on-surface/15 mb-8" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-inverse-on-surface/55">
              © 2026 PawCare. All rights reserved. Made with{" "}
              <Heart size={14} className="inline text-inverse-primary" /> for
              happier pets.
            </p>
            <div className="flex flex-wrap gap-5 text-sm text-inverse-on-surface/55">
              <span>Demo veterinarians</span>
              <span>Secure platform</span>
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
