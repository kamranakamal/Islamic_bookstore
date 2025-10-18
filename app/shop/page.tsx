import Link from "next/link";
import type { Metadata } from "next";

import { BookCard } from "@/components/site/BookCard";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/site/PageHero";
import { getCatalog } from "@/lib/data/catalog";
import { BOOK_LANGUAGES, type BookLanguage } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shop · Maktab Muhammadiya",
  description: "Explore the full Maktab Muhammadiya catalog, filter by category or language, and discover your next read."
};

type ShopPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function coerceArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const values = Array.isArray(value)
    ? value
    : value.split(",").map((item) => item.trim()).filter(Boolean);
  return Array.from(new Set(values));
}

function coerceLanguages(value: string | string[] | undefined): BookLanguage[] {
  const raw = coerceArray(value);
  const allowed = new Set<BookLanguage>(BOOK_LANGUAGES);
  return raw.filter((item): item is BookLanguage => allowed.has(item as BookLanguage));
}

function coerceSort(value: string | undefined): "newest" | "price-asc" | "price-desc" | "popularity" {
  if (value === "price-asc" || value === "price-desc" || value === "popularity") return value;
  return "newest";
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const page = Number(searchParams.page ?? "1");
  const catalog = await getCatalog({
    page: Number.isNaN(page) ? 1 : page,
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    categories: coerceArray(searchParams.category),
    languages: coerceLanguages(searchParams.language),
    sort: coerceSort(typeof searchParams.sort === "string" ? searchParams.sort : undefined)
  });

  const baseParams = new URLSearchParams();
  if (catalog.filters.search) baseParams.set("search", catalog.filters.search);
  catalog.filters.categories.forEach((slug) => baseParams.append("category", slug));
  catalog.filters.languages.forEach((lang) => baseParams.append("language", lang));
  baseParams.set("sort", catalog.filters.sort);

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams(baseParams);
    params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/shop?${query}` : "/shop";
  };

  const isFiltered =
    Boolean(catalog.filters.search) ||
    catalog.filters.categories.length > 0 ||
    catalog.filters.languages.length > 0 ||
    catalog.filters.sort !== "newest";

  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <PageHero
        eyebrow="Catalog"
        title="Every title in one place."
        description="Search, filter, and sort the complete Maktab Muhammadiya collection."
      />

      <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
        <form
          method="get"
          className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          aria-label="Filter catalogue"
        >
          <input type="hidden" name="page" value="1" />

          <div className="space-y-2">
            <label htmlFor="shop-search" className="text-sm font-semibold text-gray-900">
              Search
            </label>
            <input
              id="shop-search"
              type="search"
              name="search"
              defaultValue={catalog.filters.search}
              placeholder="Search by title, author, or description"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-3">
            <span className="text-sm font-semibold text-gray-900">Sort by</span>
            <select
              name="sort"
              defaultValue={catalog.filters.sort}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="newest">Newest arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popularity">Featured first</option>
            </select>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-900">Categories</legend>
            <div className="space-y-2">
              {catalog.categories.map((category) => {
                const id = `category-${category.slug}`;
                return (
                  <label key={category.slug} htmlFor={id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      id={id}
                      type="checkbox"
                      name="category"
                      value={category.slug}
                      defaultChecked={catalog.filters.categories.includes(category.slug)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/60"
                    />
                    <span>{category.name}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-900">Language</legend>
            <div className="space-y-2">
              {catalog.languages.map((language) => {
                const id = `language-${language.value}`;
                return (
                  <label key={language.value} htmlFor={id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      id={id}
                      type="checkbox"
                      name="language"
                      value={language.value}
                      defaultChecked={catalog.filters.languages.includes(language.value)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/60"
                    />
                    <span>{language.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Apply filters
            </button>
            {isFiltered ? (
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                Reset
              </Link>
            ) : null}
          </div>
        </form>

        <section className="space-y-6">
          <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{catalog.total.toLocaleString()} titles</h2>
              <p className="text-sm text-gray-500">
                Showing page {catalog.page} of {catalog.totalPages}
              </p>
            </div>
          </header>

          {catalog.books.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 p-10 text-center text-sm text-gray-600">
              No books found. Adjust your filters or <Link href="/contact" className="text-primary underline">contact the team</Link> for specific titles.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {catalog.books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}

          {catalog.totalPages > 1 ? (
            <nav aria-label="Pagination" className="flex items-center justify-between border-t border-gray-200 pt-4">
              {catalog.page === 1 ? (
                <span className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-300">
                  Previous
                </span>
              ) : (
                <Link
                  href={buildPageHref(Math.max(1, catalog.page - 1))}
                  className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-gray-500">
                Page {catalog.page} of {catalog.totalPages}
              </span>
              {catalog.page === catalog.totalPages ? (
                <span className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-300">
                  Next
                </span>
              ) : (
                <Link
                  href={buildPageHref(Math.min(catalog.totalPages, catalog.page + 1))}
                  className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                >
                  Next
                </Link>
              )}
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  );
}
