import { NextRequest, NextResponse } from "next/server";

import { requireAuthenticatedRouteUser } from "@/lib/authHelpers";
import { toUserAddress } from "@/lib/data/transformers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { TablesUpdate, UserAddressRow } from "@/lib/types";
import { userAddressUpdateSchema } from "@/lib/validators/address";

function serializeAddress(row: UserAddressRow) {
  return toUserAddress(row);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { profile } = await requireAuthenticatedRouteUser();
  const supabase = getSupabaseAdmin();

  const addressId = params.id;
  if (!addressId) {
    return NextResponse.json({ error: "Missing address id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = userAddressUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid address";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const updates = parsed.data;
  const normalized: TablesUpdate<"user_addresses"> = {};

  if (updates.label !== undefined) normalized.label = updates.label;
  if (updates.fullName !== undefined) normalized.full_name = updates.fullName;
  if (updates.phone !== undefined) normalized.phone = updates.phone && updates.phone.trim().length ? updates.phone.trim() : null;
  if (updates.line1 !== undefined) normalized.line1 = updates.line1;
  if (updates.line2 !== undefined) normalized.line2 = updates.line2 && updates.line2.trim().length ? updates.line2.trim() : null;
  if (updates.city !== undefined) normalized.city = updates.city;
  if (updates.state !== undefined) normalized.state = updates.state && updates.state.trim().length ? updates.state.trim() : null;
  if (updates.postalCode !== undefined) normalized.postal_code = updates.postalCode && updates.postalCode.trim().length ? updates.postalCode.trim() : null;
  if (updates.country !== undefined) normalized.country = updates.country;

  const shouldSetDefault = updates.isDefault === true;
  const shouldRemoveDefault = updates.isDefault === false;

  if (!Object.keys(normalized).length && updates.isDefault === undefined) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("user_addresses")
    .select("id, profile_id, is_default")
    .eq("id", addressId)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to fetch address", existingError);
    return NextResponse.json({ error: "Unable to update address" }, { status: 500 });
  }

  if (!existing || existing.profile_id !== profile.id) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  if (shouldSetDefault) {
    const { error: resetError } = await supabase
      .from("user_addresses")
      .update({ is_default: false })
      .eq("profile_id", profile.id);

    if (resetError) {
      console.error("Failed to reset defaults", resetError);
      return NextResponse.json({ error: "Unable to update address" }, { status: 500 });
    }

    normalized.is_default = true;
  } else if (shouldRemoveDefault) {
    normalized.is_default = false;
  }

  if (Object.keys(normalized).length === 0) {
    return NextResponse.json({ error: "No changes to apply" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_addresses")
    .update(normalized)
    .eq("id", addressId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update address", error);
    return NextResponse.json({ error: "Unable to update address" }, { status: 500 });
  }

  const address = serializeAddress(data as UserAddressRow);
  return NextResponse.json({ address });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { profile } = await requireAuthenticatedRouteUser();
  const supabase = getSupabaseAdmin();
  const addressId = params.id;

  if (!addressId) {
    return NextResponse.json({ error: "Missing address id" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("user_addresses")
    .select("id, profile_id")
    .eq("id", addressId)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to fetch address", existingError);
    return NextResponse.json({ error: "Unable to remove address" }, { status: 500 });
  }

  if (!existing || existing.profile_id !== profile.id) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  const { error } = await supabase.from("user_addresses").delete().eq("id", addressId);

  if (error) {
    console.error("Failed to delete address", error);
    return NextResponse.json({ error: "Unable to remove address" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
