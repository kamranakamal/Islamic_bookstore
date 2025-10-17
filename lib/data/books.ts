import { getServerSupabaseClient } from "@/lib/authHelpers";
import { toBookDetail, toBookSummary } from "@/lib/data/transformers";
import type { BookDetail, BookRowWithCategory, BookSummary } from "@/lib/types";

export async function getBookBySlug(slug: string): Promise<BookDetail | null> {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase
    .from("books")
    .select("*, categories(name)")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;
  return toBookDetail(data as BookRowWithCategory);
}

export async function listBooksByCategorySlug(slug: string): Promise<BookSummary[]> {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase
    .from("books")
    .select("*, categories(name, slug)")
    .eq("categories.slug", slug)
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row) => toBookSummary(row as BookRowWithCategory));
}
