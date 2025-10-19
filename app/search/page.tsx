import type { Metadata } from "next";
import Link from "next/link";

import { BookCard } from "@/components/site/BookCard";
import { searchBooks } from "@/lib/data/search";
import { appUrl } from "@/lib/config";

interface SearchPageProps {
  searchParams: {
    query?: string;
    page?: string;
  };
}

export const revalidate = 60;

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

  if (!query) {
    return (
      <div className="space-y-4">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: appUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: `${appUrl}/search?query={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <h1 className="text-3xl font-semibold text-gray-900">Search the catalog</h1>
        <p className="text-gray-600">Use the search form to discover books by topic, title, or author.</p>
        <Link href="/" className="inline-flex rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Return home
        </Link>
      </div>
    );
  }

  const results = await searchBooks({ query, page });

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: results.books.map((book, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: book.title,
              url: `${appUrl}/books/${book.id}`
            }))
          })
        }}
      />
      <header>
        <h1 className="text-3xl font-semibold text-gray-900">Search results</h1>
        <p className="text-sm text-gray-600">
          Showing {results.books.length} of {results.total} results for
          <span className="ml-1 font-semibold text-primary">“{query}”</span>
        </p>
      </header>
      {results.books.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No books matched your search. Try refining your query or browse categories instead.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {results.books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
      {results.totalPages > 1 ? (
        <nav aria-label="Search pagination" className="flex items-center gap-3">
          <Link
            href={`/search?query=${encodeURIComponent(query)}&page=${Math.max(page - 1, 1)}`}
            aria-disabled={page <= 1}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </Link>
          <span className="text-sm text-gray-600">
            Page {page} of {results.totalPages}
          </span>
          <Link
            href={`/search?query=${encodeURIComponent(query)}&page=${Math.min(page + 1, results.totalPages)}`}
            aria-disabled={page >= results.totalPages}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
