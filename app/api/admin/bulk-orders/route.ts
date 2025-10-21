import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/authHelpers";
import { getAdminBulkOrderRequests } from "@/lib/data/admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const statuses = ["pending", "reviewing", "quoted", "completed", "cancelled"] as const;
const statusSchema = z.enum(statuses);

const updateSchema = z.object({
  id: z.string().uuid(),
  status: statusSchema
});

export async function GET() {
  await requireAdminUser();
  const requests = await getAdminBulkOrderRequests();
  return NextResponse.json({ requests });
}

export async function PATCH(request: NextRequest) {
  const adminUser = await requireAdminUser();
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bulk_order_requests")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select("id, status")
    .single();

  if (error || !data) {
    console.error("Failed to update bulk order request", error);
    return NextResponse.json(
      { error: "Unable to update bulk order request", code: "BULK_ORDER_UPDATE_ERROR" },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "bulk_order.status_updated",
    entity: "bulk_order_requests",
    entity_id: parsed.data.id,
    metadata: { status: parsed.data.status }
  });

  return NextResponse.json({ success: true });
}
