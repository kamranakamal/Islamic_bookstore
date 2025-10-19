import { cache } from "react";

import { getServerSupabaseClient } from "@/lib/authHelpers";
import { toBlogPostDetail, toBlogPostSummary } from "@/lib/data/transformers";
import type { BlogPostDetail, BlogPostRow, BlogPostSummary } from "@/lib/types";

export const listPublishedBlogPosts = cache(async (): Promise<BlogPostSummary[]> => {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to load blog posts", error);
    return [];
  }

  const rows = (data ?? []) as BlogPostRow[];
  return rows.map((row) => toBlogPostSummary(row));
});

export const getBlogPostBySlug = cache(async (slug: string): Promise<BlogPostDetail | null> => {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load blog post", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return toBlogPostDetail(data as BlogPostRow);
});
