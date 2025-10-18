"use client";

import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/lib/types";

type BrowserClient = ReturnType<typeof createBrowserSupabaseClient<Database>>;

let client: BrowserClient | null = null;

export function getSupabaseClient(): BrowserClient {
  if (!client) {
    client = createBrowserSupabaseClient<Database>();
  }
  return client;
}
