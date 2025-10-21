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

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin navigation"
      className="-mx-2 flex gap-2 overflow-x-auto pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
    >
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "inline-flex min-w-[120px] items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition lg:min-w-0 lg:justify-start lg:rounded lg:px-3",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "bg-white text-gray-700 hover:bg-primary/10 hover:text-primary"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
