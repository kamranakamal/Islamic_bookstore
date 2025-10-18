import type {
  AdminBook,
  BookDetail,
  BookRowWithCategory,
  BookSummary,
  CategoryRow,
  CategoryWithBooks,
  SearchResult
} from "@/lib/types";

const formatLocalCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR"
});

const formatInternationalCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

function buildCoverUrl(path: string | null): string {
  if (!path) return "/logo.svg";
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return "/logo.svg";
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const separator = path.includes("?") ? "&" : "?";
  return `${normalizedBase}/storage/v1/object/public/${path}${separator}width=600&quality=80`;
}

export function toBookSummary(row: BookRowWithCategory): BookSummary {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    priceLocalInr: Number(row.price_local_inr ?? 0),
    priceInternationalUsd: Number(row.price_international_usd ?? 0),
    priceFormattedLocal: formatLocalCurrency.format(Number(row.price_local_inr ?? 0)),
    priceFormattedInternational: formatInternationalCurrency.format(Number(row.price_international_usd ?? 0)),
    coverUrl: buildCoverUrl(row.cover_path),
    categoryName: row.categories?.name ?? "Uncategorised",
    categorySlug: row.categories?.slug ?? undefined,
    isFeatured: row.is_featured,
    stockQuantity: row.stock_quantity
  };
}

export function toBookDetail(row: BookRowWithCategory): BookDetail {
  const summary = toBookSummary(row);
  return {
    ...summary,
    availableFormats: row.available_formats ?? [],
    pageCount: row.page_count,
    availableLanguages: row.available_languages ?? [],
    description: row.description
  };
}

export function toAdminBook(row: BookRowWithCategory): AdminBook {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    availableFormats: row.available_formats ?? [],
    availableLanguages: row.available_languages ?? [],
    pageCount: row.page_count,
    stockQuantity: row.stock_quantity,
    priceLocalInr: Number(row.price_local_inr ?? 0),
    priceInternationalUsd: Number(row.price_international_usd ?? 0),
    priceFormattedLocal: formatLocalCurrency.format(Number(row.price_local_inr ?? 0)),
    priceFormattedInternational: formatInternationalCurrency.format(Number(row.price_international_usd ?? 0)),
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? "Uncategorised",
    coverPath: row.cover_path,
    coverUrl: buildCoverUrl(row.cover_path),
    isFeatured: row.is_featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function toSearchResult(row: BookRowWithCategory & { rank: number }): SearchResult {
  const summary = toBookSummary(row);
  return {
    ...summary,
    rank: row.rank
  };
}

export function toCategoryWithBooks(
  category: CategoryRow & { books: Array<BookRowWithCategory> }
): CategoryWithBooks {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    updatedAt: category.updated_at,
    books: category.books.map(toBookSummary)
  };
}
