"use client";

import { useEffect, useId, useRef, useState, type SVGProps } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

import { getSupabaseClient } from "@/lib/supabaseClient";
import type { SessionUser } from "@/lib/authHelpers";

const navItems: Array<{ href: string; label: string; Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element }> = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/shop", label: "Shop", Icon: IconShop },
  { href: "/blog", label: "Blog", Icon: IconScroll },
  { href: "/about", label: "About", Icon: IconSparkle },
  { href: "/contact", label: "Contact", Icon: IconMail },
  { href: "/bulk-order", label: "Bulk orders", Icon: IconBoxes },
  { href: "/faq", label: "FAQ", Icon: IconQuestion },
  { href: "/cart", label: "Cart", Icon: IconCart }
];

interface HeaderProps {
  sessionUser: SessionUser | null;
}

export function Header({ sessionUser }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const mobileTitleId = useId();
  const mobileDescId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const loginHref = pathname === "/login" ? "/login" : `/login?redirect=${encodeURIComponent(pathname)}`;
  const mobilePrimaryNav = navItems.filter(({ href }) => ["/", "/shop", "/blog", "/bulk-order", "/cart"].includes(href));
  const mobileSupportNav = navItems.filter(({ href }) => ["/faq", "/contact"].includes(href));

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setIsMenuOpen(false);

    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include"
      });

      if (!response.ok) {
        console.error("Server sign-out failed");
      }
    } catch (err) {
      console.error("Sign-out error:", err);
    }

    window.location.href = "/login";
  };

  const headerClasses = clsx(
    "sticky top-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur transition-shadow supports-[backdrop-filter]:bg-white/80",
    isMenuOpen ? "shadow-lg shadow-primary/10" : "shadow-sm"
  );

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", isMenuOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    closeButtonRef.current?.focus();
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className={headerClasses}>
      <div className="hidden lg:block">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto,1fr,auto] items-center gap-8 px-8 py-3">
          <Link
            href="/"
            aria-label="Maktab Muhammadiya home"
            className="group flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm transition hover:border-primary/60 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconLibrary className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-gray-900">Maktab Muhammadiya</span>
              <span className="text-xs font-medium text-gray-500">Curated Islamic scholarship</span>
            </span>
          </Link>
          <nav aria-label="Main navigation" className="hidden lg:flex">
            <ul className="flex w-full items-center justify-center gap-0 text-[0.9rem] font-semibold text-slate-700">
              {navItems.map(({ href, label, Icon }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={clsx(
                        "group relative inline-flex items-center gap-1.5 rounded-full px-3 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                        isActive ? "text-primary" : "text-slate-600 hover:text-primary"
                      )}
                    >
                      <span
                        className={clsx(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full border text-[0.65rem] transition",
                          isActive
                            ? "border-primary/70 bg-primary/10 text-primary"
                            : "border-transparent bg-gray-100 text-gray-500 group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-primary"
                        )}
                      >
                        <Icon className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span className="whitespace-nowrap">{label}</span>
                      <span
                        aria-hidden="true"
                        className={clsx(
                          "pointer-events-none absolute inset-x-3 -bottom-1 h-0.5 rounded-full transition",
                          isActive ? "bg-primary opacity-100" : "bg-primary/40 opacity-0 group-hover:opacity-100"
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="hidden items-center justify-end gap-2 lg:flex">
            {sessionUser ? (
              <>
                <span className="max-w-[14rem] truncate text-xs font-semibold text-gray-500" title={sessionUser.email}>
                  {sessionUser.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href={loginHref}
                className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-2.5 sm:px-5 lg:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:border-primary/60"
          aria-label="Maktab Muhammadiya home"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconLibrary className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="truncate">Maktab Muhammadiya</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {sessionUser ? (
            <span className="hidden text-xs font-semibold text-gray-500 sm:inline" title={sessionUser.email}>
              {sessionUser.email}
            </span>
          ) : (
            <Link
              href={loginHref}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary/60 hover:text-primary"
            >
              Login
            </Link>
          )}
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-primary/70 hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-haspopup="true"
          >
            {isMenuOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 z-[60] bg-gray-950/40 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setIsMenuOpen(false)}
          />
          <nav
            id="mobile-nav"
            aria-label="Mobile navigation"
            aria-labelledby={mobileTitleId}
            aria-describedby={mobileDescId}
            className="fixed inset-y-0 right-0 z-[70] flex h-[100dvh] w-full max-w-sm flex-col rounded-l-3xl border-l border-white/70 bg-white px-5 pb-7 pt-7 shadow-xl shadow-primary/15 transition-transform duration-200 ease-out [padding-top:calc(env(safe-area-inset-top)+1.5rem)] supports-[backdrop-filter]:bg-white/90 sm:max-w-md"
          >
            <header className="mb-5 flex items-center justify-between gap-3 border-b border-white/60 pb-4">
              <div className="space-y-1">
                <p id={mobileTitleId} className="text-sm font-semibold text-gray-900">
                  Navigate Maktab Muhammadiya
                </p>
                <p id={mobileDescId} className="text-xs text-gray-500">
                  Quickly jump to catalogue sections or connect with the team.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/80 bg-white/90 text-gray-600 transition hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="sr-only">Close navigation menu</span>
                <IconClose className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto">
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Browse</p>
                <ul className="grid gap-2 text-sm font-medium text-gray-700">
                  {mobilePrimaryNav.map(({ href, label, Icon }) => {
                    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                    return (
                      <li key={`primary-${href}`}>
                        <Link
                          href={href}
                          onClick={() => setIsMenuOpen(false)}
                          className={clsx(
                            "flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                            isActive
                              ? "border-primary/60 bg-primary/10 text-primary shadow-sm shadow-primary/20"
                              : "border-gray-200 bg-white text-gray-600 hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="flex-1 text-left">{label}</span>
                          <span aria-hidden="true" className="text-sm text-gray-400">→</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="mt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Support</p>
                <ul className="grid gap-2 text-sm font-medium text-gray-700">
                  {mobileSupportNav.map(({ href, label, Icon }) => {
                    const isActive = pathname.startsWith(href);
                    return (
                      <li key={`support-${href}`}>
                        <Link
                          href={href}
                          onClick={() => setIsMenuOpen(false)}
                          className={clsx(
                            "flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                            isActive
                              ? "border-primary/60 bg-primary/10 text-primary"
                              : "border-gray-200 bg-white text-gray-600 hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
                          )}
                        >
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="flex-1 text-left">{label}</span>
                          <span aria-hidden="true" className="text-sm text-gray-300">→</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="mt-6 space-y-3">
                {sessionUser ? (
                  <>
                    <div className="rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary">
                      <p className="font-semibold">Signed in</p>
                      <p className="truncate text-xs text-primary/80">{sessionUser.email}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/orders"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-center rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
                      >
                        Order history
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-75"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href={loginHref}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      Login
                    </Link>
                    <p className="text-center text-xs text-gray-500">Sign in to view saved carts and manage addresses.</p>
                  </div>
                )}
              </section>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconHome(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5.5 10.5V20h13v-9.5" />
    </svg>
  );
}

function IconLibrary(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4h4v16H4z" />
      <path d="M10 12h4" />
      <path d="M10 4h10v16H10z" />
    </svg>
  );
}

function IconShop(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9l1.4-4.2A2 2 0 015.33 3.5h13.34a2 2 0 011.93 1.3L22 9" />
      <path d="M3 9h18v9.5a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 18.5V9z" />
      <path d="M8 9V6.5a4 4 0 014-4 4 4 0 014 4V9" />
      <path d="M9.5 13h5" />
    </svg>
  );
}

function IconScroll(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 4h9a3 3 0 013 3v12H9a3 3 0 01-3-3V4z" />
      <path d="M6 8h12" />
      <path d="M6 12h12" />
      <path d="M6 16h12" />
    </svg>
  );
}

function IconSparkle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" />
      <path d="M5 19l1-2 1 2 2 1-2 1-1 2-1-2-2-1z" />
      <path d="M17 16l.75-1.5L19 14l-1.25-.5L17 12l-.75 1.5L15 14l1.25.5z" />
    </svg>
  );
}


function IconMail(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function IconBoxes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 17l9 4 9-4" />
      <path d="M3 7v10" />
      <path d="M21 7v10" />
      <path d="M12 11v10" />
    </svg>
  );
}

function IconQuestion(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 9a3 3 0 116 0c0 2-3 2-3 5" />
      <circle cx="12" cy="19" r="0.5" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function IconCart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
      <path d="M5 5h2l1 7h9l1.5-5h-14" />
    </svg>
  );
}
