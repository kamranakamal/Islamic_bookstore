import Image from "next/image";
import Link from "next/link";

import type { BookSummary } from "@/lib/types";

interface BookCardProps {
  book: BookSummary;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow">
      <Link href={`/books/${book.id}`} className="relative h-56 w-full">
        <Image
          src={book.coverUrl}
          alt={book.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <Link href={`/books/${book.id}`} className="text-lg font-semibold text-gray-900">
            {book.title}
          </Link>
          <p className="text-sm text-gray-500">{book.author}</p>
        </div>
        <div className="mt-auto flex items-center justify-between text-sm text-gray-700">
          <span className="font-semibold text-primary">{book.priceFormattedLocal}</span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs uppercase tracking-wide text-gray-500">
            {book.categoryName}
          </span>
        </div>
      </div>
    </article>
  );
}
