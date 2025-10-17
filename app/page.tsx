import Link from "next/link";

import { BookCard } from "@/components/site/BookCard";
import { SearchForm } from "@/components/site/SearchForm";
import { getHomepageData } from "@/lib/data/home";

export const revalidate = 60;

export default async function HomePage() {
  const { featuredBooks, latestBooks, categories } = await getHomepageData();

  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Primary sources. Reliable scholarship. A curated bookstore for seekers of authentic knowledge.
          </h1>
          <p className="text-lg text-gray-600">
            Browse classical and contemporary works grounded in the Qur’an and authentic Sunnah, carefully reviewed by
            students of knowledge. No distractions, no upsells—just verified texts and trustworthy resources.
          </p>
          <div className="flex gap-3">
            <Link
              href="/categories/aqeedah"
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Explore catalog
            </Link>
            <Link
              href="/order-request"
              className="rounded border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              Request a bulk order
            </Link>
          </div>
        </div>
        <aside className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <SearchForm />
        </aside>
      </section>

      <section className="space-y-6">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Featured titles</h2>
          <Link className="text-sm font-semibold text-primary" href="/categories/featured">
            View all
          </Link>
        </header>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Latest arrivals</h2>
          <Link className="text-sm font-semibold text-primary" href="/categories/latest">
            Browse more
          </Link>
        </header>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latestBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Browse by category</h2>
        <ul className="flex flex-wrap gap-3" aria-label="Book categories">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/categories/${category.slug}`}
                className="inline-flex items-center rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:border-primary hover:text-primary"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
