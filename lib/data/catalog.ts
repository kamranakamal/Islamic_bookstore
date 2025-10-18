import { cache } from "react";

import { getServerSupabaseClient } from "@/lib/authHelpers";
import { listCategorySummaries } from "@/lib/data/categories";
import { toBookSummary } from "@/lib/data/transformers";
import type { BookRowWithCategory, BookSummary, CategorySummary } from "@/lib/types";

const PAGE_SIZE = 12;
const DEFAULT_LANGUAGES = ["Arabic", "English", "Urdu", "Roman Urdu", "Hindi"] as const;

export type CatalogSort = "newest" | "price-asc" | "price-desc" | "popularity";

export interface CatalogFilters {
  search?: string;
  categories?: string[];
  languages?: string[];
  sort?: CatalogSort;
  page?: number;
}

export interface CatalogResult {
  books: BookSummary[];
  total: number;
  totalPages: number;
  page: number;
  filters: Required<Pick<CatalogFilters, "search" | "categories" | "languages" | "sort">>;
  categories: CategorySummary[];
  languages: string[];
}

export const listCatalogLanguages = cache(async (): Promise<string[]> => {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase.from("books").select("language");

  const dynamic = new Set<string>();
  const rows = (data ?? []) as Array<{ language: string | null }>;
  for (const row of rows) {
    const language = row.language?.trim() ?? "";
    if (language) {
      dynamic.add(language);
    }
  }

  return Array.from(new Set([...DEFAULT_LANGUAGES, ...Array.from(dynamic)])).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
});

export const getCatalog = cache(async (filters: CatalogFilters = {}): Promise<CatalogResult> => {
  const page = Math.max(1, filters.page ?? 1);
  const sort: CatalogSort = filters.sort ?? "newest";
  const searchValue = filters.search?.trim() ?? "";
  const categoryFilters = filters.categories?.filter(Boolean) ?? [];
  const languageFilters = filters.languages?.filter(Boolean) ?? [];

  const supabase = getServerSupabaseClient();
  let query = supabase
    .from("books")
    .select("*, categories(name, slug)", { count: "exact" })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (searchValue) {
    const sanitized = searchValue.replace(/['"]/g, " ").trim();
    query = query.or(
      `title.ilike.%${sanitized}%,author.ilike.%${sanitized}%,summary.ilike.%${sanitized}%,isbn.ilike.%${sanitized}%`
    );
  }

  if (categoryFilters.length) {
    query = query.in("categories.slug", categoryFilters);
  }

  if (languageFilters.length) {
    query = query.in("language", languageFilters);
  }

  switch (sort) {
    case "price-asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price_cents", { ascending: false });
      break;
    case "popularity":
      query = query.order("is_featured", { ascending: false }).order("updated_at", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Failed to load catalog", error);
    return {
      books: [],
      total: 0,
      totalPages: 1,
      page,
      filters: {
        search: searchValue,
        categories: categoryFilters,
        languages: languageFilters,
        sort
      },
      categories: await listCategorySummaries(),
      languages: await listCatalogLanguages()
    };
  }

  const rows = (data ?? []) as BookRowWithCategory[];
  const total = count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    books: rows.map((row) => toBookSummary(row)),
    total,
    totalPages,
    page,
    filters: {
      search: searchValue,
      categories: categoryFilters,
      languages: languageFilters,
      sort
    },
    categories: await listCategorySummaries(),
    languages: await listCatalogLanguages()
  };
});
