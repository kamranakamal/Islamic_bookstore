import { cache } from "react";

import { getServerSupabaseClient } from "@/lib/authHelpers";
import { toBookDetail, toBookSummary } from "@/lib/data/transformers";
import type { BookDetail, BookRowWithCategory, BookSummary } from "@/lib/types";

export const getBookBySlug = cache(async (slug: string): Promise<BookDetail | null> => {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase
    .from("books")
    .select("*, categories(name, slug)")
    .eq("slug", slug)
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

export interface BookSlugRecord {
  slug: string;
  updatedAt: string;
}

export const listBookSlugs = cache(async (): Promise<BookSlugRecord[]> => {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase.from("books").select("slug, updated_at");
  const rows = (data ?? []) as Array<{ slug: string | null; updated_at: string | null }>;
  return rows.map((row) => ({
    slug: row.slug ?? "",
    updatedAt: row.updated_at ?? ""
  }));
});
