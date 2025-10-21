import { cache } from "react";

import { getServerSupabaseClient } from "@/lib/authHelpers";
import { toSearchResult } from "@/lib/data/transformers";
import type { BookRowWithCategory, SearchResult } from "@/lib/types";

const PAGE_SIZE = 12;

interface SearchBooksParams {
  query: string;
  page?: number;
}

export interface SearchBooksResponse {
  books: SearchResult[];
  total: number;
  totalPages: number;
}

export const searchBooks = cache(async ({ query, page = 1 }: SearchBooksParams): Promise<SearchBooksResponse> => {
  const supabase = getServerSupabaseClient();
  const offset = (page - 1) * PAGE_SIZE;
  const sanitizedQuery = query.replace(/[\':]/g, " ").trim();
  if (!sanitizedQuery) {
    return { books: [], total: 0, totalPages: 1 };
  }

  const fallbackFragment = sanitizedQuery.replace(/[%_]/g, "");

  const selectClause = "*, categories(name, slug)";

  const { data, count, error } = await supabase
    .from("books")
    .select(selectClause, { count: "exact", head: false })
    .textSearch("search_vector", sanitizedQuery, { type: "plain", config: "english" })
    .order("title", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    console.error("Search error", error);
    return { books: [], total: 0, totalPages: 1 };
  }

  let total = count ?? 0;
  let totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  type SearchRow = BookRowWithCategory & { rank?: number };

  let rows = (data ?? []) as unknown as SearchRow[];

  if (!rows.length && fallbackFragment) {
    const { data: fallback } = await supabase
      .from("books")
      .select(selectClause)
      .or(
        [
          `title.ilike.%${fallbackFragment}%`,
          `author.ilike.%${fallbackFragment}%`,
          `description.ilike.%${fallbackFragment}%`
        ].join(",")
      )
      .order("title", { ascending: true })
      .limit(PAGE_SIZE);
    rows = (fallback ?? []) as unknown as SearchRow[];
    total = rows.length;
    totalPages = 1;
  }

  return {
    books: rows.map((row, index) => toSearchResult({ ...row, rank: rows.length - index })),
    total,
    totalPages
  };
});
