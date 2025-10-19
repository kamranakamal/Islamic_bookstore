import { cache } from "react";

import { getServerSupabaseClient } from "@/lib/authHelpers";
import type { FaqEntryRow } from "@/lib/types";

export interface PublishedFaqEntry {
  id: string;
  question: string;
  answer: string;
  category?: string;
  position: number;
}

export const listPublishedFaqEntries = cache(async (): Promise<PublishedFaqEntry[]> => {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase
    .from("faq_entries")
    .select("*")
    .eq("published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as FaqEntryRow[];

  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category ?? undefined,
    position: row.position
  } satisfies PublishedFaqEntry));
});
