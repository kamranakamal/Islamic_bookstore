"use client";

import { useEffect, useId, useRef, useState, type SVGProps } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

import { getSupabaseClient } from "@/lib/supabaseClient";
import type { SessionUser } from "@/lib/authHelpers";

const navItems: Array<{ href: string; label: string; Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element }> = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/shop", label: "Shop", Icon: IconLibrary },
  { href: "/blog", label: "Blog", Icon: IconScroll },
  { href: "/about", label: "About", Icon: IconSparkle },
  { href: "/contact", label: "Contact", Icon: IconMail },
  { href: "/bulk-order", label: "Bulk orders", Icon: IconBoxes },
  { href: "/faq", label: "FAQ", Icon: IconQuestion },
  { href: "/privacy-policy", label: "Privacy", Icon: IconShield },
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

  const handleSignOut = async () => {
    if (isSigningOut) return;
    try {
      setIsSigningOut(true);
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      setIsMenuOpen(false);
      router.refresh();
    } catch (signOutError) {
      console.error("Failed to sign out", signOutError);
    } finally {
      setIsSigningOut(false);
    }
  };

  const headerClasses = clsx(
    "sticky top-0 border-b border-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/65 transition-shadow",
    isMenuOpen ? "z-40 bg-white shadow-lg shadow-primary/10" : "z-50 bg-white/80 shadow-sm"
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
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-5 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-full bg-gradient-to-r from-primary to-primary/85 px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:shadow-md sm:px-4 sm:text-base"
          aria-label="Maktab Muhammadiya home"
        >
          <span aria-hidden="true" className="hidden h-2 w-2 shrink-0 rounded-full bg-white/90 sm:block" />
          <span className="truncate font-semibold leading-none">Maktab Muhammadiya</span>
          <span aria-hidden="true" className="hidden shrink-0 text-sm font-semibold tracking-[0.55em] text-white/90 md:inline">
            المكتبة
          </span>
        </Link>
        <div className="ml-auto hidden items-center gap-4 lg:flex">
          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-3 text-sm font-medium text-gray-700">
              {navItems.map(({ href, label, Icon }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      className={clsx(
                        "rounded-full px-4 py-2 text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "text-gray-600 hover:bg-primary/10 hover:text-primary"
                      )}
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {sessionUser ? (
            <div className="flex items-center gap-3">
              <span className="max-w-[12rem] truncate text-sm font-semibold text-gray-700" title={sessionUser.email}>
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
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href={loginHref}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Sign in / Sign up
              </Link>
            </div>
          )}
        </div>
        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/70 text-gray-600 shadow-sm transition hover:border-primary/70 hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-haspopup="true"
        >
          {isMenuOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
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
              <ul className="space-y-2.5 text-sm font-medium text-gray-700">
                {navItems.map(({ href, label, Icon }) => {
                  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setIsMenuOpen(false)}
                        className={clsx(
                          "flex items-center justify-between rounded-2xl border px-3.5 py-3.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                          isActive
                            ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20"
                            : "border-white/70 bg-white text-gray-600 hover:border-primary/70 hover:bg-primary/10 hover:text-primary"
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          {label}
                        </span>
                        <span aria-hidden="true" className="text-sm text-gray-400">→</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-6 space-y-3">
                {sessionUser ? (
                  <>
                    <div className="rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary">
                      <p className="font-semibold">Signed in</p>
                      <p className="truncate text-xs text-primary/80">{sessionUser.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href={loginHref}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      Sign in / Sign up
                    </Link>
                  </div>
                )}
              </div>
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

function IconShield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21c-5.5-2-9-5-9-10V5l9-3 9 3v6c0 5-3.5 8-9 10z" />
      <path d="M10 10l2 2 4-4" />
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
