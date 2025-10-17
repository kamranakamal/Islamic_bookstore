import { getServerSupabaseClient } from "@/lib/authHelpers";
import { toBookSummary } from "@/lib/data/transformers";
import type { BookRowWithCategory, BookSummary, CategorySummary } from "@/lib/types";

export interface HomepageData {
  featuredBooks: BookSummary[];
  latestBooks: BookSummary[];
  categories: CategorySummary[];
}

export async function getHomepageData(): Promise<HomepageData> {
  const supabase = getServerSupabaseClient();

  const [featuredResponse, latestResponse, categoriesResponse] = await Promise.all([
    supabase
      .from("books")
      .select("*, categories(name)")
      .eq("is_featured", true)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("books")
      .select("*, categories(name)")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("categories")
      .select("id, slug, name, description")
      .order("name", { ascending: true })
  ]);

  const featuredBooks = (featuredResponse.data ?? []).map((row) => toBookSummary(row as BookRowWithCategory));
  const latestBooks = (latestResponse.data ?? []).map((row) => toBookSummary(row as BookRowWithCategory));
  const categories = (categoriesResponse.data ?? []) as CategorySummary[];

  return {
    featuredBooks,
    latestBooks,
    categories
  };
}
