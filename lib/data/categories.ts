import { cache } from "react";

import { getServerSupabaseClient } from "@/lib/authHelpers";
import { toCategoryWithBooks } from "@/lib/data/transformers";
import type { CategoryRowWithBooks, CategorySummary, CategoryWithBooks } from "@/lib/types";

export const getCategoryWithBooks = cache(async (slug: string): Promise<CategoryWithBooks | null> => {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("*, books(*, categories(name, slug))")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;

  return toCategoryWithBooks(data as CategoryRowWithBooks);
});

export const listCategorySummaries = cache(async (): Promise<CategorySummary[]> => {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, description, updated_at")
    .order("name", { ascending: true });

  const rows = (data ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    updated_at: string;
  }>;

  return rows.map((record) => ({
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    updatedAt: record.updated_at
  } satisfies CategorySummary));
});
