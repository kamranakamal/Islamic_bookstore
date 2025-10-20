import { NextRequest, NextResponse } from "next/server";

import { requireAuthenticatedRouteUser } from "@/lib/authHelpers";
import { toUserAddress } from "@/lib/data/transformers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { TablesInsert, UserAddressRow } from "@/lib/types";
import { userAddressInputSchema } from "@/lib/validators/address";

function serializeAddress(row: UserAddressRow) {
  return toUserAddress(row);
}

export async function GET() {
  const { profile } = await requireAuthenticatedRouteUser();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("profile_id", profile.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load user addresses", error);
    return NextResponse.json({ error: "Unable to load addresses" }, { status: 500 });
  }

  const addresses = (data ?? []).map((row) => serializeAddress(row as UserAddressRow));
  return NextResponse.json({ addresses });
}

export async function POST(request: NextRequest) {
  const { profile } = await requireAuthenticatedRouteUser();
  const supabase = getSupabaseAdmin();

  const payload = await request.json().catch(() => null);
  const parsed = userAddressInputSchema.safeParse(payload);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid address";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const input = parsed.data;

  const normalized: TablesInsert<"user_addresses"> = {
    profile_id: profile.id,
    label: input.label,
    full_name: input.fullName,
    phone: input.phone && input.phone.trim().length ? input.phone.trim() : null,
    line1: input.line1,
    line2: input.line2 && input.line2.trim().length ? input.line2.trim() : null,
    city: input.city,
    state: input.state && input.state.trim().length ? input.state.trim() : null,
    postal_code: input.postalCode && input.postalCode.trim().length ? input.postalCode.trim() : null,
    country: input.country,
    is_default: Boolean(input.isDefault)
  };

  if (normalized.is_default) {
    const { error: defaultResetError } = await supabase
      .from("user_addresses")
      .update({ is_default: false })
      .eq("profile_id", profile.id);

    if (defaultResetError) {
      console.error("Failed to reset default addresses", defaultResetError);
      return NextResponse.json({ error: "Unable to save address" }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("user_addresses")
    .insert(normalized)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create address", error);
    return NextResponse.json({ error: "Unable to save address" }, { status: 500 });
  }

  const address = serializeAddress(data as UserAddressRow);
  return NextResponse.json({ address });
}
