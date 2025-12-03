import Image from "next/image";
import Link from "next/link";
import { BookCardAddToCartButton } from "@/components/site/BookCardAddToCartButton";
import { BookCardPrice } from "@/components/site/BookCardPrice";
import type { BookSummary } from "@/lib/types";

interface BookCardProps {
  book: BookSummary;
}

export function BookCard({ book }: BookCardProps) {
  const titleId = `book-${book.id}-title`;

  return (
    <article
      className="mx-auto flex h-full max-w-[220px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-sm ring-1 ring-white/60 sm:max-w-none sm:rounded-3xl"
      aria-labelledby={titleId}
    >
      <Link
        href={`/books/${book.id}`}
        prefetch={false}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-gray-100"
        aria-label={`View details for ${book.title}`}
      >
        {book.isFeatured ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow">
            Featured
          </span>
        ) : null}
        <Image
          src={book.coverUrl}
          alt={book.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 40vw, (max-width: 1280px) 22vw, 240px"
          priority={false}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4 text-left md:gap-2 md:p-5 md:text-center">
        <h3 className="text-sm font-semibold leading-snug text-gray-900 sm:text-base">
          <Link
            href={`/books/${book.id}`}
            prefetch={false}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span id={titleId} className="underline-offset-4">
              {book.title}
            </span>
          </Link>
        </h3>
        <BookCardPrice priceLocalInr={book.priceLocalInr} priceInternationalUsd={book.priceInternationalUsd} />
        <p className="text-xs text-gray-500 sm:text-sm">{book.author}</p>
        <div className="mt-auto">
          <BookCardAddToCartButton book={book} />
        </div>
      </div>
    </article>
  );
}
