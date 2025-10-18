import Link from "next/link";

const links = [
  { href: "/admin/books", label: "Books" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/faq", label: "FAQs" },
  { href: "/admin/analytics", label: "Analytics" }
];

export function AdminNav() {
  return (
    <nav aria-label="Admin navigation" className="space-y-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="block rounded px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-primary/10 hover:text-primary"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
