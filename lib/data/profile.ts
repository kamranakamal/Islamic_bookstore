import { getServerSupabaseClient } from "@/lib/authHelpers";
import { toUserAddress } from "@/lib/data/transformers";
import type { UserAddress, UserAddressRow } from "@/lib/types";

export async function getUserAddresses(profileId: string): Promise<UserAddress[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("profile_id", profileId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load user addresses", error);
    return [];
  }

  return (data ?? []).map((row) => toUserAddress(row as UserAddressRow));
}
