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

export async function searchBooks({ query, page = 1 }: SearchBooksParams): Promise<SearchBooksResponse> {
  const supabase = getServerSupabaseClient();
  const offset = (page - 1) * PAGE_SIZE;
  const sanitizedQuery = query.replace(/[':]/g, " ").trim();

  if (!sanitizedQuery) {
    return { books: [], total: 0, totalPages: 1 };
  }

  const selectClause =
    "*, categories(name), rank:ts_rank_cd(search_vector, plainto_tsquery('english', '" +
    sanitizedQuery.replace(/"/g, " ") +
    "'))";

  const { data, count, error } = await supabase
    .from("books")
    .select(selectClause, { count: "exact", head: false })
    .textSearch("search_vector", sanitizedQuery, { type: "plain", config: "english" })
    .order("rank", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    console.error("Search error", error);
    return { books: [], total: 0, totalPages: 1 };
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  type SearchRow = BookRowWithCategory & { rank: number };

  const rows = (data ?? []) as unknown as SearchRow[];

  return {
    books: rows.map((row) => toSearchResult(row)),
    total,
    totalPages
  };
}
