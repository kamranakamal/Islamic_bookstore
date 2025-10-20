import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthenticatedRouteUser } from "@/lib/authHelpers";
import { toCartItem } from "@/lib/data/transformers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { BookRowWithCategory } from "@/lib/types";

const addPayloadSchema = z.object({
  bookId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99)
});

export async function GET() {
  let profile;
  try {
    ({ profile } = await requireAuthenticatedRouteUser());
  } catch {
    return NextResponse.json({ items: [] }, { status: 401 });
  }
  const admin = getSupabaseAdmin();

  const { data: cartRows, error: cartError } = await admin
    .from("user_cart_items")
    .select("book_id, quantity")
    .eq("profile_id", profile.id);

  if (cartError) {
    console.error("Failed to load cart", cartError);
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const typedCartRows = (cartRows ?? []) as Array<{ book_id: string; quantity: number }>;
  const bookIds = typedCartRows.map((row) => row.book_id);

  if (!bookIds.length) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const { data: bookRows, error: booksError } = await admin
    .from("books")
    .select("*, categories(name, slug)")
    .in("id", bookIds);

  if (booksError) {
    console.error("Failed to load cart books", booksError);
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const typedBookRows = (bookRows ?? []) as BookRowWithCategory[];
  const bookMap = new Map<string, BookRowWithCategory>(typedBookRows.map((row) => [row.id, row]));

  const items = typedCartRows
    .map((row) => {
      const book = bookMap.get(row.book_id);
      if (!book) return null;
      return toCartItem(row.quantity, book);
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  let profile;
  try {
    ({ profile } = await requireAuthenticatedRouteUser());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json().catch(() => undefined);
  const parsed = addPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { bookId, quantity } = parsed.data;
  const supabase = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await supabase
    .from("user_cart_items")
    .select("id, quantity")
    .eq("profile_id", profile.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (fetchError) {
    console.error("Failed to read cart item", fetchError);
    return NextResponse.json({ error: "Unable to update cart" }, { status: 500 });
  }

  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  const upsertPayload = {
    id: existing?.id,
    profile_id: profile.id,
    book_id: bookId,
    quantity: nextQuantity
  };

  const { error: upsertError } = await supabase
    .from("user_cart_items")
    .upsert(upsertPayload, { onConflict: "profile_id,book_id" });

  if (upsertError) {
    console.error("Failed to upsert cart item", upsertError);
    return NextResponse.json({ error: "Unable to update cart" }, { status: 500 });
  }

  return NextResponse.json({ quantity: nextQuantity });
}

export async function DELETE() {
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
    .eq("profile_id", profile.id);

  if (error) {
    console.error("Failed to clear cart", error);
    return NextResponse.json({ error: "Unable to clear cart" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
