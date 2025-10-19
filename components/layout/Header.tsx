"use client";

import { useEffect, useState, type SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/authors", label: "Authors" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/bulk-order", label: "Bulk orders" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/cart", label: "Cart" }
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
    <header className="border-b border-gray-200 bg-white">
  <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Maktab Muhammadiya home">
          <span className="rounded bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground md:text-base">
            Maktab Muhammadiya
          </span>
        </Link>
        <nav aria-label="Main navigation" className="hidden lg:block">
          <ul className="flex items-center gap-3 text-sm font-medium text-gray-700">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  className="rounded px-3 py-2 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isMenuOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen ? (
        <div className="lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 z-40 bg-gray-900/50" onClick={() => setIsMenuOpen(false)} />
          <nav
            id="mobile-nav"
            aria-label="Mobile navigation"
            className="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-l border-gray-200 bg-white px-6 py-8 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Maktab Muhammadiya</span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-2 text-sm font-medium text-gray-700">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                        isActive ? "border-primary bg-primary/10 text-primary" : "border-gray-200 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {item.label}
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
