import Link from "next/link";

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
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Maktab Muhammadiya home">
          <span className="rounded bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground">
            Maktab Muhammadiya
          </span>
        </Link>
        <nav aria-label="Main navigation" className="max-w-full overflow-x-auto">
          <ul className="flex flex-nowrap items-center gap-3 text-sm font-medium text-gray-700">
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
      </div>
    </header>
  );
}
