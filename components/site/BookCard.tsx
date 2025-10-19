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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-sm ring-1 ring-white/60 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-primary/40"
      aria-labelledby={titleId}
    >
      <Link
        href={`/books/${book.id}`}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-gray-100"
        aria-label={`View details for ${book.title}`}
      >
        <Image
          src={book.coverUrl}
          alt={book.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 280px"
          priority={false}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5 text-center">
        <h3 className="text-base font-semibold leading-snug text-gray-900 sm:text-lg">
          <Link
            href={`/books/${book.id}`}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span id={titleId} className="underline-offset-4 transition group-hover:underline">
              {book.title}
            </span>
          </Link>
        </h3>
        <p className="text-sm font-semibold text-primary sm:text-base">{book.priceFormattedLocal}</p>
        <p className="text-xs text-gray-500 sm:text-sm">{book.author}</p>
        <div className="mt-auto flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
          <span className="inline-flex items-center gap-1 text-gray-500">
            <span
              className={clsx("h-2 w-2 rounded-full", book.stockQuantity > 0 ? "bg-emerald-500" : "bg-red-500")}
              aria-hidden="true"
            />
            {book.stockQuantity > 0 ? "In stock" : "Backorder"}
          </span>
          {book.isFeatured ? <span className="text-primary">Featured</span> : null}
        </div>
      </div>
    </article>
  );
}
