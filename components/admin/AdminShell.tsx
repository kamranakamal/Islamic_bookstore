"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import type { SessionUser } from "@/lib/authHelpers";

import { AdminNav } from "./AdminNav";

interface AdminShellProps {
  user: Pick<SessionUser, "displayName" | "email">;
  children: ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const generatedId = useId();
  const navId = useMemo(() => `admin-nav-${generatedId.replace(/[:]/g, "")}`, [generatedId]);
  const displayName = user.displayName ?? user.email;

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      style.overflow = previousOverflow;
    };
  }, [isMobileNavOpen]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">Admin dashboard</p>
            <p className="truncate text-xs text-slate-500">
              <span className="hidden sm:inline">Signed in as </span>
              {displayName}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 lg:inline-flex">
              Administrator
            </span>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-10 sm:w-10 lg:hidden"
              aria-controls={navId}
              aria-expanded={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen((value) => !value)}
            >
              <span className="sr-only">{isMobileNavOpen ? "Close navigation" : "Open navigation"}</span>
              {isMobileNavOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-1 flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:flex-row lg:gap-8 lg:px-8">
        <aside
          className="hidden w-full max-w-xs shrink-0 lg:block"
          aria-label="Admin navigation"
        >
          <div className="sticky top-20 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
            <AdminNav layout="vertical" />
          </div>
        </aside>
        <main
          id="admin-main"
          role="main"
          className="w-full flex-1 pb-8 sm:pb-12"
        >
          <div className="space-y-4 pb-4 sm:space-y-6 sm:pb-6 lg:pb-8">{children}</div>
        </main>
      </div>

      {isMobileNavOpen ? (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              aria-hidden="true"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <div
              id={navId}
              role="dialog"
              aria-modal="true"
              className="absolute inset-y-0 right-0 flex w-80 max-w-[85%] flex-col overflow-y-auto bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">Navigation</p>
                  <p className="truncate text-xs text-slate-500">Signed in as {displayName}</p>
                </div>
                <button
                  type="button"
                  className="ml-2 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <span className="sr-only">Close navigation</span>
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <AdminNav layout="vertical" onNavigate={() => setIsMobileNavOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
