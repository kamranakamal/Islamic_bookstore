"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useCurrency } from "@/components/currency/CurrencyProvider";
import { useCart } from "@/lib/hooks/useCart";
import type { BookSummary } from "@/lib/types";

interface BookCardProps {
  book: BookSummary;
}

export function BookCard({ book }: BookCardProps) {
  const titleId = `book-${book.id}-title`;
  const { addItem } = useCart({ hydrate: false });
  const { getBookPrice } = useCurrency();
  const [feedback, setFeedback] = useState<"idle" | "added">("idle");
  const timerRef = useRef<number | null>(null);

  const handleAddToCart = () => {
    addItem(book);
    setFeedback("added");
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setFeedback("idle");
      timerRef.current = null;
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const isOutOfStock = book.stockQuantity <= 0;
  const displayPrice = getBookPrice(book);

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-sm ring-1 ring-white/60 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-primary/40 sm:rounded-3xl"
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
          className="object-cover transition duration-300 group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 45vw, (max-width: 1280px) 25vw, 280px"
          priority={false}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4 text-left sm:gap-2 sm:p-5 sm:text-center">
        <h3 className="text-sm font-semibold leading-snug text-gray-900 sm:text-base">
          <Link
            href={`/books/${book.id}`}
            prefetch={false}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span id={titleId} className="underline-offset-4 transition group-hover:underline">
              {book.title}
            </span>
          </Link>
        </h3>
  <p className="text-sm font-semibold text-primary sm:text-base">{displayPrice.formatted}</p>
        <p className="text-xs text-gray-500 sm:text-sm">{book.author}</p>
        <div className="mt-auto">
          {isOutOfStock ? (
            <span className="inline-flex w-full items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-600">
              Out of stock
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="inline-flex w-full items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:opacity-75 sm:py-2.5"
              disabled={feedback === "added"}
            >
              {feedback === "added" ? "Added to cart" : "Add to cart"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
