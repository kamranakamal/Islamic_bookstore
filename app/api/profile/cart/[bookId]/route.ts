import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthenticatedRouteUser } from "@/lib/authHelpers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const updatePayloadSchema = z.object({
  quantity: z.number().int().min(0).max(99)
});

export async function PATCH(request: NextRequest, { params }: { params: { bookId: string } }) {
  const bookId = params.bookId;
  if (!bookId) {
    return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
  }

  let profile;
  try {
    ({ profile } = await requireAuthenticatedRouteUser());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json().catch(() => undefined);
  const parsed = updatePayloadSchema.safeParse(payload);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { quantity } = parsed.data;
  const supabase = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await supabase
    .from("user_cart_items")
    .select("id")
    .eq("profile_id", profile.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (fetchError) {
    console.error("Failed to read cart item", fetchError);
    return NextResponse.json({ error: "Unable to update cart" }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  if (quantity === 0) {
    const { error: deleteError } = await supabase.from("user_cart_items").delete().eq("id", existing.id);

    if (deleteError) {
      console.error("Failed to delete cart item", deleteError);
      return NextResponse.json({ error: "Unable to update cart" }, { status: 500 });
    }

    return NextResponse.json({ quantity: 0 });
  }

  const { error: updateError } = await supabase
    .from("user_cart_items")
    .update({ quantity })
    .eq("id", existing.id);

  if (updateError) {
    console.error("Failed to update cart item", updateError);
    return NextResponse.json({ error: "Unable to update cart" }, { status: 500 });
  }

  return NextResponse.json({ quantity });
}

export async function DELETE(request: NextRequest, { params }: { params: { bookId: string } }) {
  const bookId = params.bookId;
  if (!bookId) {
    return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
  }

  let profile;
  try {
    ({ profile } = await requireAuthenticatedRouteUser());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("user_cart_items")
    .delete()
    .eq("profile_id", profile.id)
    .eq("book_id", bookId);

  if (error) {
    console.error("Failed to delete cart item", error);
    return NextResponse.json({ error: "Unable to remove cart item" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
