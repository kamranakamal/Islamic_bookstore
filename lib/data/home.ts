import { cache } from "react";

import { getServerSupabaseClient } from "@/lib/authHelpers";
import { toBookSummary } from "@/lib/data/transformers";
import type { BookRowWithCategory, BookSummary, CategorySummary } from "@/lib/types";

export interface HomepageData {
  featuredBooks: BookSummary[];
  latestBooks: BookSummary[];
  categories: CategorySummary[];
}

export const getHomepageData = cache(async (): Promise<HomepageData> => {
  const supabase = getServerSupabaseClient();

  const [featuredResponse, latestResponse, categoriesResponse] = await Promise.all([
    supabase
      .from("books")
      .select("*, categories(name, slug)")
      .eq("is_featured", true)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("books")
      .select("*, categories(name, slug)")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("categories")
      .select("id, slug, name, description, updated_at")
      .order("name", { ascending: true })
  ]);

  const featuredBooks = (featuredResponse.data ?? []).map((row) => toBookSummary(row as BookRowWithCategory));
  const latestBooks = (latestResponse.data ?? []).map((row) => toBookSummary(row as BookRowWithCategory));
  const categoriesRows = (categoriesResponse.data ?? []) as Array<{
    id: string | null;
    slug: string | null;
    name: string | null;
    description: string | null;
    updated_at: string | null;
  }>;

  const categories = categoriesRows
    .filter((category): category is {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      updated_at: string | null;
    } => Boolean(category.id && category.slug && category.name))
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description ?? "",
      updatedAt: category.updated_at ?? undefined
    } satisfies CategorySummary));

  return {
    featuredBooks,
    latestBooks,
    categories
  };
});
