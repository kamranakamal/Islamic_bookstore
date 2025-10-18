import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types";

type AdminClient = ReturnType<typeof createClient<Database>>;

let adminClient: AdminClient | null = null;

export function getSupabaseAdmin(): AdminClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration");
  }

  adminClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return adminClient;
}
