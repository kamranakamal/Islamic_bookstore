import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/authHelpers";
import { getAdminOrders } from "@/lib/data/admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;
const statusSchema = z.enum(statuses);

const updateSchema = z.object({
  id: z.string().uuid(),
  status: statusSchema
});

const deleteSchema = z.object({
  id: z.string().uuid()
});

export async function GET() {
  await requireAdminUser();
  const orders = await getAdminOrders();
  return NextResponse.json({ orders });
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

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select("id, status")
    .single();

  if (error || !data) {
    console.error("Failed to update order status", error);
    return NextResponse.json({ error: "Unable to update order", code: "ORDER_UPDATE_ERROR" }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "order.status_updated",
    entity: "orders",
    entity_id: parsed.data.id,
    metadata: { status: parsed.data.status }
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const adminUser = await requireAdminUser();
  const body = await request.json().catch(() => undefined);
  const parsed = deleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("orders")
    .delete()
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete order", error);
    return NextResponse.json({ error: "Unable to delete order", code: "ORDER_DELETE_ERROR" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Order not found", code: "ORDER_NOT_FOUND" }, { status: 404 });
  }

  await admin.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "order.deleted",
    entity: "orders",
    entity_id: parsed.data.id
  });

  return NextResponse.json({ success: true });
}
