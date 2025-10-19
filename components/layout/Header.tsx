"use client";

import { useEffect, useState, type SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems: Array<{ href: string; label: string; Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element }> = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/shop", label: "Shop", Icon: IconLibrary },
  { href: "/authors", label: "Authors", Icon: IconFeather },
  { href: "/blog", label: "Blog", Icon: IconScroll },
  { href: "/about", label: "About", Icon: IconSparkle },
  { href: "/contact", label: "Contact", Icon: IconMail },
  { href: "/bulk-order", label: "Bulk orders", Icon: IconBoxes },
  { href: "/faq", label: "FAQ", Icon: IconQuestion },
  { href: "/privacy-policy", label: "Privacy", Icon: IconShield },
  { href: "/cart", label: "Cart", Icon: IconCart }
];

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/65">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-3 py-3 sm:px-5 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary/80 px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:shadow-md md:px-4 md:text-base"
          aria-label="Maktab Muhammadiya home"
        >
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-white/90" />
          <span className="font-semibold">Maktab Muhammadiya</span>
          <span aria-hidden="true" className="hidden text-sm font-semibold tracking-[0.6em] text-white/90 md:inline">
            المكتبة
          </span>
        </Link>
        <nav aria-label="Main navigation" className="hidden lg:block">
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
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white/70 text-gray-600 shadow-sm transition hover:border-primary/70 hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
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
          <div className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <nav
            id="mobile-nav"
            aria-label="Mobile navigation"
            className="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-l border-white/60 bg-white/90 px-6 py-8 shadow-xl shadow-amber-100/40 backdrop-blur supports-[backdrop-filter]:bg-white/80"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Maktab Muhammadiya</span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/70 bg-white/80 text-gray-600 transition hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-2 text-sm font-medium text-gray-700">
              {navItems.map(({ href, label, Icon }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={clsx(
                        "flex items-center justify-between rounded-xl border px-3 py-3 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                        isActive
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-white/70 bg-white/80 text-gray-600 hover:border-primary/70 hover:bg-primary/10 hover:text-primary"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        {label}
                      </span>
                      <span aria-hidden="true" className="text-xs text-gray-400">→</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
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

function IconFeather(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 3a10 10 0 00-10 10v8l5-4" />
      <path d="M9 13l11-11" />
      <path d="M3 21l6-6" />
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
      <path d="M12 3l1.6 3.6L17 8.2l-3 2.8.7 4.2L12 13.8 9.3 15.2l.7-4.2-3-2.8 3.4-1.6z" />
      <path d="M5 19h.01" />
      <path d="M19 19h.01" />
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
