import type {
  AdminBook,
  BookDetail,
  BookRow,
  BookRowWithCategory,
  BookSummary,
  CategoryRow,
  CategoryWithBooks,
  SearchResult
} from "@/lib/types";

const formatCurrency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP"
});

function buildCoverUrl(path: string | null): string {
  if (!path) return "/logo.svg";
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return "/logo.svg";
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${path}`;
}

export function toBookSummary(row: BookRowWithCategory): BookSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    summary: row.summary,
    priceCents: row.price_cents,
    priceFormatted: formatCurrency.format(row.price_cents / 100),
    coverUrl: buildCoverUrl(row.cover_path),
    categoryName: row.categories?.name ?? "Uncategorised",
    isFeatured: row.is_featured
  };
}

export function toBookDetail(row: BookRowWithCategory): BookDetail {
  const summary = toBookSummary(row);
  return {
    ...summary,
    publisher: row.publisher,
    format: row.format,
    pageCount: row.page_count,
    language: row.language,
    isbn: row.isbn,
    description: row.description,
    highlights: row.highlights
  };
}

export function toAdminBook(row: BookRowWithCategory): AdminBook {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    author: row.author,
    publisher: row.publisher,
    format: row.format,
    pageCount: row.page_count,
    language: row.language,
    isbn: row.isbn,
    priceCents: row.price_cents,
    priceFormatted: formatCurrency.format(row.price_cents / 100),
    summary: row.summary,
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? "Uncategorised",
    coverPath: row.cover_path,
    coverUrl: buildCoverUrl(row.cover_path),
    highlights: row.highlights ?? [],
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
    books: category.books.map(toBookSummary)
  };
}
