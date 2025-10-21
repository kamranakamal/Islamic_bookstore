import type {
  AdminBlogPost,
  AdminBook,
  BlogPostDetail,
  BlogPostRow,
  BlogPostSummary,
  BookDetail,
  BookRowWithCategory,
  BookSummary,
  CartItem,
  CategoryRow,
  CategoryWithBooks,
  SearchResult,
  UserAddress,
  UserAddressRow
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

function buildGalleryUrls(paths: string[] | null | undefined, fallbackPath: string | null): string[] {
  const urls: string[] = [];
  const append = (path: string | null) => {
    if (!path) return;
    const url = buildCoverUrl(path);
    if (!urls.includes(url)) {
      urls.push(url);
    }
  };

  if (Array.isArray(paths)) {
    for (const path of paths) {
      append(path);
    }
  }

  append(fallbackPath);

  if (!urls.length) {
    urls.push("/logo.svg");
  }

  return urls;
}

export function toBookSummary(row: BookRowWithCategory): BookSummary {
  const galleryUrls = buildGalleryUrls(row.gallery_paths, row.cover_path);
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    priceLocalInr: Number(row.price_local_inr ?? 0),
    priceInternationalUsd: Number(row.price_international_usd ?? 0),
    priceFormattedLocal: formatLocalCurrency.format(Number(row.price_local_inr ?? 0)),
    priceFormattedInternational: formatInternationalCurrency.format(Number(row.price_international_usd ?? 0)),
    coverUrl: galleryUrls[0] ?? "/logo.svg",
    galleryUrls,
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

export function toCartItem(quantity: number, book: BookRowWithCategory): CartItem {
  const summary = toBookSummary(book);
  return {
    book: {
      id: summary.id,
      title: summary.title,
      author: summary.author,
      priceLocalInr: summary.priceLocalInr,
      priceFormattedLocal: summary.priceFormattedLocal
    },
    quantity
  };
}

export function toAdminBook(row: BookRowWithCategory): AdminBook {
  const galleryUrls = buildGalleryUrls(row.gallery_paths, row.cover_path);
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
    galleryPaths: Array.isArray(row.gallery_paths) ? row.gallery_paths : [],
    galleryUrls,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function toSearchResult(row: BookRowWithCategory & { rank?: number }): SearchResult {
  const summary = toBookSummary(row);
  return {
    ...summary,
    rank: row.rank ?? 0
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

export function toAdminBlogPost(row: BlogPostRow): AdminBlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    coverImage: row.cover_image,
    authorName: row.author_name,
    tags: Array.isArray(row.tags) ? row.tags : [],
    metadata: row.metadata ?? {},
    published: row.published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function toBlogPostSummary(row: BlogPostRow): BlogPostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? undefined,
    coverUrl: buildCoverUrl(row.cover_image),
    authorName: row.author_name ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    publishedAt: row.published_at ?? undefined
  };
}

export function toBlogPostDetail(row: BlogPostRow): BlogPostDetail {
  return {
    ...toBlogPostSummary(row),
    body: row.body
  };
}

export function toUserAddress(row: UserAddressRow): UserAddress {
  return {
    id: row.id,
    profileId: row.profile_id,
    label: row.label,
    fullName: row.full_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    landmark: row.landmark,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
