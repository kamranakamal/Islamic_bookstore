import { getServerSupabaseClient } from "@/lib/authHelpers";
import { toCategoryWithBooks } from "@/lib/data/transformers";
import type { CategoryRowWithBooks, CategoryWithBooks } from "@/lib/types";

export async function getCategoryWithBooks(slug: string): Promise<CategoryWithBooks | null> {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("*, books(*, categories(name))")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;

  return toCategoryWithBooks(data as CategoryRowWithBooks);
}
