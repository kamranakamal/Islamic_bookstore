"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/admin/books", label: "Books" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/bulk-orders", label: "Bulk orders" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/faq", label: "FAQs" },
  { href: "/admin/analytics", label: "Analytics" }
];

type AdminNavLayout = "responsive" | "vertical" | "horizontal";

interface AdminNavProps {
  layout?: AdminNavLayout;
  className?: string;
  onNavigate?: () => void;
  ariaLabel?: string;
}

const NAV_LAYOUT_CLASS: Record<AdminNavLayout, string> = {
  responsive:
    "-mx-2 flex gap-2 overflow-x-auto pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0",
  vertical: "flex flex-col gap-1",
  horizontal: "flex gap-3 overflow-x-auto pb-1"
};

export function AdminNav({ layout = "responsive", className, onNavigate, ariaLabel }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={ariaLabel ?? "Admin navigation"}
      className={clsx(NAV_LAYOUT_CLASS[layout], className)}
    >
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "inline-flex items-center whitespace-nowrap text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary touch-action-auto",
              layout === "vertical"
                ? "w-full justify-start rounded-lg px-3 py-2 min-h-[44px]"
                : layout === "horizontal"
                  ? "min-w-[120px] justify-center rounded-full px-4 py-2"
                  : "min-w-[120px] justify-center rounded-full px-4 py-2 lg:w-full lg:justify-start lg:rounded-lg lg:px-3 lg:min-h-[44px]",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "bg-white text-slate-700 hover:bg-primary/10 hover:text-primary"
            )}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
