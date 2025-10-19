import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

import type { BookSummary } from "@/lib/types";

interface BookCardProps {
  book: BookSummary;
}

export function BookCard({ book }: BookCardProps) {
  const titleId = `book-${book.id}-title`;

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-sm ring-1 ring-white/60 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-primary/40 md:flex-row"
      aria-labelledby={titleId}
    >
      <Link
        href={`/books/${book.id}`}
        className="relative h-56 w-full md:h-auto md:w-48 lg:w-56"
        aria-label={`View details for ${book.title}`}
      >
        <Image
          src={book.coverUrl}
          alt={book.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 40vw, 360px"
          priority={false}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5 md:gap-4 md:p-6">
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold leading-tight text-gray-900 md:text-xl">
            <Link href={`/books/${book.id}`} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <span id={titleId} className="underline-offset-4 transition group-hover:underline">
                {book.title}
              </span>
            </Link>
          </h3>
          <p className="text-sm text-gray-500 md:text-base">{book.author}</p>
        </div>
  {/* Metadata row keeps tablet/desktop cards informative without overwhelming the layout. */}
  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
          <span className="inline-flex items-center gap-1 text-gray-500">
            <span
              className={clsx("h-2 w-2 rounded-full", book.stockQuantity > 0 ? "bg-emerald-500" : "bg-red-500")}
              aria-hidden="true"
            />
            {book.stockQuantity > 0 ? "In stock" : "Backorder"}
          </span>
          {book.isFeatured ? <span className="text-primary">Featured</span> : null}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-sm text-gray-700 md:text-base">
          <span className="font-semibold text-primary">{book.priceFormattedLocal}</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            {book.categoryName}
          </span>
        </div>
      </div>
    </article>
  );
}
