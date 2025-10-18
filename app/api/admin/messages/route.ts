import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/authHelpers";
import { getAdminMessages } from "@/lib/data/admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { AdminContactMessage, ContactMessageRow, Database } from "@/lib/types";

const statusEnum = z.enum(["new", "in_progress", "resolved", "archived"]);

const updateSchema = z.object({
  id: z.string().uuid(),
  status: statusEnum.optional(),
  adminNotes: z
    .string()
    .max(2000, "Admin notes should be concise")
    .optional()
    .transform((value) => (value?.trim().length ? value.trim() : null)),
  markResponded: z.boolean().optional()
});

function mapRowToAdminMessage(row: ContactMessageRow): AdminContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    adminNotes: row.admin_notes,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  } satisfies AdminContactMessage;
}

export async function GET() {
  await requireAdminUser();
  const messages = await getAdminMessages();
  return NextResponse.json({ messages });
}

export async function PATCH(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  const adminUser = await requireAdminUser();
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid payload", code: "BAD_REQUEST" }, { status: 400 });
  }

  const { id, status, adminNotes, markResponded } = parsed.data;
  const updatePayload: Database["public"]["Tables"]["contact_messages"]["Update"] = {};

  if (typeof status !== "undefined") {
    updatePayload.status = status;
  }

  if (typeof adminNotes !== "undefined") {
    updatePayload.admin_notes = adminNotes;
  }

  if (typeof markResponded !== "undefined") {
    updatePayload.responded_at = markResponded ? new Date().toISOString() : null;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "Nothing to update", code: "NO_UPDATES" }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from("contact_messages")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  const row = data as ContactMessageRow | null;

  if (error || !row) {
    console.error("Failed to update contact message", error);
    return NextResponse.json({ error: "Unable to update message", code: "MESSAGE_UPDATE_ERROR" }, { status: 500 });
  }

  await adminClient.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "message.updated",
    entity: "contact_messages",
    entity_id: id,
    metadata: {
      status: status ?? null
    }
  });

  return NextResponse.json({ message: mapRowToAdminMessage(row) });
}

export async function DELETE(request: NextRequest) {
  const adminClient = getSupabaseAdmin();
  const adminUser = await requireAdminUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid message id", code: "BAD_REQUEST" }, { status: 400 });
  }

  const { error } = await adminClient.from("contact_messages").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete contact message", error);
    return NextResponse.json({ error: "Unable to delete message", code: "MESSAGE_DELETE_ERROR" }, { status: 500 });
  }

  await adminClient.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "message.deleted",
    entity: "contact_messages",
    entity_id: id,
    metadata: {}
  });

  return NextResponse.json({ success: true });
}
