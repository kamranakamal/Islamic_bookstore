import { CartPageClient } from "./CartPageClient";
import { getBookById } from "@/lib/data/books";
import type { BookDetail, BookSummary } from "@/lib/types";

type CartPageProps = {
  searchParams?: {
    add?: string;
  };
};

function toBookSummaryForCart(book: BookDetail): BookSummary {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    priceLocalInr: book.priceLocalInr,
    priceInternationalUsd: book.priceInternationalUsd,
    priceFormattedLocal: book.priceFormattedLocal,
    priceFormattedInternational: book.priceFormattedInternational,
    coverUrl: book.coverUrl,
    galleryUrls: book.galleryUrls,
    categoryName: book.categoryName,
    categorySlug: book.categorySlug,
    isFeatured: book.isFeatured,
    stockQuantity: book.stockQuantity
  };
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const addParam = searchParams?.add?.trim() ?? "";
  let bookToAdd: BookSummary | null = null;
  let addStatus: "none" | "not-found" = "none";

  if (addParam) {
    const book = await getBookById(addParam);
    if (book) {
      bookToAdd = toBookSummaryForCart(book);
    } else {
      addStatus = "not-found";
    }
  }

  return <CartPageClient bookToAdd={bookToAdd} addStatus={addStatus} />;
}
