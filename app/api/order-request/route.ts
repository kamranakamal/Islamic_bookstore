import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { OrderRequestPayload } from "@/lib/types";

const orderSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().optional(),
  institution: z.string().optional(),
  message: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        bookSlug: z.string().min(2),
        quantity: z.number().int().positive().max(50)
      })
    )
    .min(1)
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const payload = parsed.data as OrderRequestPayload;
  const admin = getSupabaseAdmin() as any;

  const slugs = payload.items.map((item) => item.bookSlug);
  const { data: books, error: bookError } = await admin
    .from("books")
    .select("id, slug, title")
    .in("slug", slugs);

  if (bookError) {
    console.error("Failed to load books for order", bookError);
    return NextResponse.json({ error: "Unable to process order", code: "ORDER_FETCH_ERROR" }, { status: 500 });
  }

  const bookBySlug = new Map<string, { id: string; slug: string; title: string }>(
    (books ?? []).map((book: { id: string; slug: string; title: string }) => [book.slug, book])
  );
  const orderItems = payload.items.map((item) => {
    const book = bookBySlug.get(item.bookSlug);
    if (!book) {
      throw new Error(`Unknown book: ${item.bookSlug}`);
    }
    return {
      book_id: book.id,
      quantity: item.quantity
    };
  });

  try {
    const { data, error } = await admin
      .from("orders")
      .insert({
        full_name: payload.name,
        email: payload.email,
        phone: payload.phone ?? null,
        institution: payload.institution ?? null,
        notes: payload.message ?? null,
        items: orderItems,
        status: "pending"
      })
      .select("id")
      .single();

    if (error || !data) {
      throw error ?? new Error("Failed to insert order");
    }

    await admin.from("audit_logs").insert({
      actor_id: null,
      action: "order.requested",
      entity: "orders",
      entity_id: data.id,
      metadata: { email: payload.email, items: payload.items }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create order request", error);
    const message = error instanceof Error ? error.message : "Unable to submit order";
    const status = message.startsWith("Unknown book") ? 400 : 500;
    return NextResponse.json({ error: message, code: status === 400 ? "BAD_REQUEST" : "ORDER_CREATE_ERROR" }, { status });
  }
}
