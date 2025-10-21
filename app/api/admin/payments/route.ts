import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/authHelpers";
import { getAdminCheckoutPreferences } from "@/lib/data/admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const PAYMENT_STATUSES = ["pending", "contacted", "awaiting_payment", "paid", "cancelled"] as const;
const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(PAYMENT_STATUSES)
});

export async function GET() {
  await requireAdminUser();
  const preferences = await getAdminCheckoutPreferences();
  return NextResponse.json({ preferences });
}

export async function PATCH(request: NextRequest) {
  const adminUser = await requireAdminUser();

  const json = await request.json().catch(() => undefined);
  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("checkout_preferences")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to update checkout preference status", error);
    return NextResponse.json(
      { error: "Unable to update payment status", code: "PAYMENT_STATUS_UPDATE_FAILED" },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "checkout_preferences.status_updated",
    entity: "checkout_preferences",
    entity_id: parsed.data.id,
    metadata: { status: parsed.data.status }
  });

  return NextResponse.json({ success: true });
}
