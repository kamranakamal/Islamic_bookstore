import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/categories/classics", label: "Categories" },
  { href: "/order-request", label: "Order Request" },
  { href: "/admin", label: "Admin" }
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
        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-4 text-sm font-medium text-gray-700">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  className="rounded px-2 py-1 transition-colors hover:bg-primary/10 hover:text-primary"
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
