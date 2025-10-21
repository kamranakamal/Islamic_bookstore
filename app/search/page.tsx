import type { Metadata } from "next";
import Link from "next/link";

import { BookCard } from "@/components/site/BookCard";
import { SearchForm } from "@/components/site/SearchForm";
import { searchBooks } from "@/lib/data/search";
import { appUrl } from "@/lib/config";

interface SearchPageProps {
  searchParams: {
    query?: string;
    page?: string;
  };
}

export const revalidate = 60;

const SUGGESTED_QUERIES = [
  "Tafseer",
  "Hadith",
  "Seerah",
  "Children",
  "Aqidah"
];

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = searchParams.query?.trim();
  const title = query ? `Search results for “${query}”` : "Search the catalog";
  const description = query
    ? `Browse books matching ${query} at Maktab Muhammadiya.`
    : "Discover books rooted in the Qur’an and authentic Sunnah.";
  const canonical = query ? `${appUrl}/search?query=${encodeURIComponent(query)}` : `${appUrl}/search`;

  return {
    title,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description,
      url: canonical
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.query?.trim();
  const page = Number(searchParams.page ?? "1");

  const results = query ? await searchBooks({ query, page }) : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-3 py-6 sm:px-4 md:px-6 lg:px-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
              itemListElement: (results?.books ?? []).map((book, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: book.title,
              url: `${appUrl}/books/${book.id}`
            }))
          })
        }}
      />
      <section className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm shadow-primary/5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">Discover</p>
            <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">Search the catalog</h1>
            <p className="max-w-2xl text-sm text-gray-600">
              Explore curated works across tafseer, hadith, seerah, and foundational texts. Use the search box to look up
              specific authors, subjects, or keywords. Suggestions update live as you type.
            </p>
          </div>
          <div className="w-full max-w-xl">
            <SearchForm />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold uppercase tracking-wide text-gray-500">Popular:</span>
              {SUGGESTED_QUERIES.map((suggestion) => (
                <Link
                  key={suggestion}
                  href={`/search?query=${encodeURIComponent(suggestion)}`}
                  className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-medium text-primary transition hover:bg-primary/10"
                >
                  {suggestion}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {query ? (
        <section className="space-y-6">
          <header className="flex flex-col gap-3 rounded-3xl border border-dashed border-primary/40 bg-primary/5 px-5 py-4 text-sm text-primary/80 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Results</p>
              <h2 className="text-lg font-semibold text-gray-900">We found {results?.total ?? 0} matches for “{query}”</h2>
              <p className="text-xs text-gray-600">
                Showing page {page} of {results?.totalPages ?? 1}. Refine your search or browse by category to narrow further.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="rounded-full bg-white px-3 py-1 font-semibold text-primary">{results?.books.length ?? 0} visible</span>
              <span className="hidden sm:inline">•</span>
              <Link href="/shop" className="text-primary underline-offset-4 hover:underline">
                Browse all books
              </Link>
            </div>
          </header>

          {results && results.books.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
              <aside className="space-y-4 rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-sm">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Search Tips</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    <li>Try author names (e.g. Ibn Kathir, An-Nawawi).</li>
                    <li>Search by themes like “purification” or “family”.</li>
                    <li>Filter by category using the Shop filters.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Quick filters</h3>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <Link
                      href="/shop?category=hadith-collection"
                      className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 font-medium text-gray-700 transition hover:border-primary hover:text-primary"
                    >
                      Hadith
                    </Link>
                    <Link
                      href="/shop?category=quran-tafseer"
                      className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 font-medium text-gray-700 transition hover:border-primary hover:text-primary"
                    >
                      Tafseer
                    </Link>
                    <Link
                      href="/shop?category=children-books"
                      className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 font-medium text-gray-700 transition hover:border-primary hover:text-primary"
                    >
                      Children
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white/90 p-10 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">No books matched “{query}”</h2>
              <p className="mt-2 text-sm text-gray-600">
                Try shortening your search term, checking spelling, or browsing by category. You can also contact our team for
                personalised recommendations.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Browse all books
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-2 font-semibold text-primary transition hover:bg-primary/10"
                >
                  Ask for a recommendation
                </Link>
              </div>
            </div>
          )}

          {results && results.totalPages > 1 ? (
            <nav aria-label="Search pagination" className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <Link
                href={`/search?query=${encodeURIComponent(query)}&page=${Math.max(page - 1, 1)}`}
                aria-disabled={page <= 1}
                className="inline-flex items-center rounded-full border border-gray-300 px-4 py-2 transition hover:border-primary hover:text-primary aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
              >
                ← Previous
              </Link>
              <span className="rounded-full bg-gray-100 px-4 py-2 font-semibold text-gray-600">
                Page {page} of {results.totalPages}
              </span>
              <Link
                href={`/search?query=${encodeURIComponent(query)}&page=${Math.min(page + 1, results.totalPages)}`}
                aria-disabled={page >= results.totalPages}
                className="inline-flex items-center rounded-full border border-gray-300 px-4 py-2 transition hover:border-primary hover:text-primary aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
              >
                Next →
              </Link>
            </nav>
          ) : null}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-gray-300 bg-white/90 p-8 text-center text-gray-600 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Start searching</h2>
          <p className="mt-2 text-sm text-gray-600">Use the search box above or explore popular topics below.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            {SUGGESTED_QUERIES.map((suggestion) => (
              <Link
                key={`empty-${suggestion}`}
                href={`/search?query=${encodeURIComponent(suggestion)}`}
                className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 font-medium text-gray-700 transition hover:border-primary hover:text-primary"
              >
                {suggestion}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
