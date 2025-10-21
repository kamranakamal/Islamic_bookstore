import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthenticatedRouteUser } from "@/lib/authHelpers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { ShippingAddressSnapshot } from "@/lib/types";

const shippingAddressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().optional().nullable(),
  fullName: z.string().min(1),
  phone: z.string().optional().nullable(),
  line1: z.string().min(1),
  line2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  landmark: z.string().optional().nullable()
});

const payloadSchema = z.object({
  paymentMethod: z.string().min(1),
  billingName: z.string().min(1),
  billingEmail: z.string().email(),
  billingPhone: z.string().min(4).max(32).nullable().optional(),
  deliveryWindow: z.string().nullable().optional(),
  referenceCode: z.string().nullable().optional(),
  paymentIdentifier: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  shippingAddress: shippingAddressSchema.optional().nullable(),
  cartItems: z
    .array(
      z.object({
        book_id: z.string().uuid(),
        quantity: z.number().int().positive()
      })
    )
    .optional()
    .nullable()
});

export async function POST(request: NextRequest) {
  let profile;
  try {
    ({ profile } = await requireAuthenticatedRouteUser());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => undefined);
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const {
    paymentMethod,
    billingName,
    billingEmail,
    billingPhone = null,
    deliveryWindow = null,
    referenceCode = null,
    paymentIdentifier = null,
    notes = null,
    shippingAddress = null,
    cartItems = null
  } = parsed.data;

  const supabase = getSupabaseAdmin();
  const warnings: string[] = [];
  let createdOrderId: string | null = null;

  // Save checkout preferences
  const { error: prefError } = await supabase.from("checkout_preferences").insert({
    profile_id: profile.id,
    payment_method: paymentMethod,
    billing_name: billingName,
    billing_email: billingEmail,
    billing_phone: billingPhone,
    delivery_window: deliveryWindow,
    reference_code: referenceCode,
    payment_identifier: paymentIdentifier,
    notes
  });

  if (prefError) {
    console.error("Failed to save checkout preferences", prefError);
    return NextResponse.json({ error: "Unable to save checkout preferences" }, { status: 500 });
  }

  // Create order with cart items and shipping address
  if (cartItems && cartItems.length > 0) {
    const orderItems = cartItems.map((item) => ({
      book_id: item.book_id,
      quantity: item.quantity
    }));

    const normalizedLandmark = shippingAddress?.landmark?.trim() ?? "";
    const shippingAddressSnapshot: ShippingAddressSnapshot | null = shippingAddress
      ? {
          id: shippingAddress.id ?? null,
          label: shippingAddress.label ?? null,
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone ?? null,
          line1: shippingAddress.line1,
          line2: shippingAddress.line2 ?? null,
          city: shippingAddress.city,
          state: shippingAddress.state ?? null,
          postalCode: shippingAddress.postalCode ?? null,
          country: shippingAddress.country ?? "India",
          landmark: normalizedLandmark
        }
      : null;

    const baseOrderPayload = {
      user_id: profile.id,
      full_name: billingName,
      email: billingEmail,
      phone: billingPhone,
      institution: null,
      notes: notes,
      items: orderItems,
      status: "pending" as const
    };

    const extendedOrderPayload = {
      ...baseOrderPayload,
      shipping_address: shippingAddressSnapshot,
      shipping_address_id: shippingAddress?.id ?? null
    };

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert(extendedOrderPayload)
      .select("id")
      .single();

    if (orderError) {
      const orderErrorMessage = orderError.message?.toLowerCase() ?? "";
      const isMissingShippingColumns =
        orderError.code === "42703" || orderErrorMessage.includes("shipping_address");

      if (!isMissingShippingColumns) {
        console.error("Failed to create order", orderError);
        return NextResponse.json({ error: "Unable to create order" }, { status: 500 });
      }

      console.warn("Orders table missing shipping address columns. Falling back without snapshot.");
      warnings.push("Shipping address snapshot not stored. Apply migration 012_orders_shipping_address.sql.");

      const formattedAddress = shippingAddressSnapshot
        ? [
            shippingAddressSnapshot.fullName,
            shippingAddressSnapshot.line1,
            shippingAddressSnapshot.line2,
            [shippingAddressSnapshot.city, shippingAddressSnapshot.state]
              .filter(Boolean)
              .join(", "),
            shippingAddressSnapshot.postalCode,
            shippingAddressSnapshot.country,
            shippingAddressSnapshot.landmark ? `Landmark: ${shippingAddressSnapshot.landmark}` : null,
            shippingAddressSnapshot.phone ? `Phone: ${shippingAddressSnapshot.phone}` : null
          ]
            .filter((value) => (typeof value === "string" ? value.trim().length > 0 : Boolean(value)))
            .join("\n")
        : null;

      const fallbackNotes = formattedAddress
        ? [notes ?? null, "Shipping address:", formattedAddress].filter(Boolean).join("\n\n") || null
        : notes;

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("orders")
        .insert({
          ...baseOrderPayload,
          notes: fallbackNotes
        })
        .select("id")
        .single();

      if (fallbackError) {
        console.error("Fallback order insert failed", fallbackError);
        return NextResponse.json({ error: "Unable to create order" }, { status: 500 });
      }

      createdOrderId = fallbackData?.id ?? null;
    } else {
      createdOrderId = orderData?.id ?? null;
    }
  }

  return NextResponse.json({ success: true, warnings, orderId: createdOrderId }, { status: 201 });
}
