import { cache } from "react";

import { getServerSupabaseClient } from "@/lib/authHelpers";
import { toBookDetail, toBookSummary } from "@/lib/data/transformers";
import type { BookDetail, BookRowWithCategory, BookSummary } from "@/lib/types";

export const getBookById = cache(async (id: string): Promise<BookDetail | null> => {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase
    .from("books")
    .select("*, categories(name, slug)")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return toBookDetail(data as BookRowWithCategory);
});

export const listBooksByCategorySlug = cache(async (slug: string): Promise<BookSummary[]> => {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase
    .from("books")
    .select("*, categories(name, slug)")
    .eq("categories.slug", slug)
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row) => toBookSummary(row as BookRowWithCategory));
});

export interface BookIdRecord {
  id: string;
  updatedAt: string;
}

export const listBookIds = cache(async (): Promise<BookIdRecord[]> => {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase.from("books").select("id, updated_at");
  const rows = (data ?? []) as Array<{ id: string | null; updated_at: string | null }>;
  return rows.map((row) => ({
    id: row.id ?? "",
    updatedAt: row.updated_at ?? ""
  }));
});

export async function getBookSummariesByIds(ids: string[]): Promise<Record<string, BookSummary>> {
  const uniqueIds = Array.from(new Set(ids.filter((id) => typeof id === "string" && id.trim().length > 0)));

  if (!uniqueIds.length) {
    return {};
  }

  const supabase = getServerSupabaseClient();
  const { data } = await supabase
    .from("books")
    .select("*, categories(name, slug)")
    .in("id", uniqueIds);

  const rows = (data ?? []) as BookRowWithCategory[];
  const summaries: Record<string, BookSummary> = {};

  for (const row of rows) {
    const summary = toBookSummary(row);
    summaries[summary.id] = summary;
  }

  return summaries;
}
