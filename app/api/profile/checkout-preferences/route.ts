import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthenticatedRouteUser } from "@/lib/authHelpers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const payloadSchema = z.object({
  paymentMethod: z.string().min(1),
  billingName: z.string().min(1),
  billingEmail: z.string().email(),
  billingPhone: z.string().min(4).max(32).nullable().optional(),
  deliveryWindow: z.string().nullable().optional(),
  referenceCode: z.string().nullable().optional(),
  paymentIdentifier: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
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
    notes = null
  } = parsed.data;

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("checkout_preferences").insert({
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

  if (error) {
    console.error("Failed to save checkout preferences", error);
    return NextResponse.json({ error: "Unable to save checkout preferences" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
