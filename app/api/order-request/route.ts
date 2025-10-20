import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { OrderRequestPayload, ShippingAddressSnapshot } from "@/lib/types";

const shippingAddressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().max(120).nullable().optional(),
  fullName: z.string().min(3),
  phone: z.string().optional().nullable(),
  line1: z.string().min(3),
  line2: z.string().max(120).optional().nullable(),
  city: z.string().min(2),
  state: z.string().max(120).optional().nullable(),
  postalCode: z.string().max(30).optional().nullable(),
  country: z.string().min(2).max(120).optional().nullable(),
  landmark: z.string().trim().min(3)
});

const orderSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().optional(),
  institution: z.string().optional(),
  message: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        bookId: z.string().uuid(),
        quantity: z.number().int().positive().max(50)
      })
    )
    .min(1),
  shippingAddress: shippingAddressSchema.optional().nullable()
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

  const payload: OrderRequestPayload = parsed.data;
  const admin = getSupabaseAdmin();

  const bookIds = payload.items.map((item) => item.bookId);
  const { data: books, error: bookError } = await admin
    .from("books")
    .select("id, title")
    .in("id", bookIds);

  if (bookError) {
    console.error("Failed to load books for order", bookError);
    return NextResponse.json({ error: "Unable to process order", code: "ORDER_FETCH_ERROR" }, { status: 500 });
  }

  const bookById = new Map<string, { id: string; title: string }>((books ?? []).map((book) => [book.id, book]));
  const orderItems = payload.items.map((item) => {
    const book = bookById.get(item.bookId);
    if (!book) {
      throw new Error(`Unknown book: ${item.bookId}`);
    }
    return {
      book_id: book.id,
      quantity: item.quantity
    };
  });

  const shippingAddressSnapshot: ShippingAddressSnapshot | null = payload.shippingAddress
    ? {
        id: payload.shippingAddress.id ?? null,
        label: payload.shippingAddress.label ?? null,
        fullName: payload.shippingAddress.fullName,
        phone: payload.shippingAddress.phone ?? null,
        line1: payload.shippingAddress.line1,
        line2: payload.shippingAddress.line2 ?? null,
        city: payload.shippingAddress.city,
        state: payload.shippingAddress.state ?? null,
        postalCode: payload.shippingAddress.postalCode ?? null,
        country: payload.shippingAddress.country ?? null,
        landmark: payload.shippingAddress.landmark
      }
    : null;
  const shippingAddressId = payload.shippingAddress?.id ?? null;

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
        status: "pending",
        shipping_address: shippingAddressSnapshot,
        shipping_address_id: shippingAddressId
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
