"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/lib/types";

type BrowserClient = ReturnType<typeof createClientComponentClient<Database>>;

let client: BrowserClient | null = null;

export function getSupabaseClient(): BrowserClient {
  if (!client) {
    client = createClientComponentClient<Database>();
  }
  return client;
}
