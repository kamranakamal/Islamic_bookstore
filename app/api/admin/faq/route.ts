import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/authHelpers";
import { getAdminFaqEntries } from "@/lib/data/admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database, FaqEntryRow } from "@/lib/types";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().min(5, "Question should be descriptive"),
  answer: z.string().min(5, "Answer should be descriptive"),
  category: z.string().trim().max(100).optional().nullable(),
  position: z.number().int().min(0).optional(),
  published: z.boolean().optional()
});

export async function GET() {
  await requireAdminUser();
  const entries = await getAdminFaqEntries();
  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const adminUser = await requireAdminUser();
  const body = await request.json();
  const parsed = upsertSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid payload", code: "BAD_REQUEST" }, { status: 400 });
  }

  const payload: Database["public"]["Tables"]["faq_entries"]["Insert"] = {
    question: parsed.data.question.trim(),
    answer: parsed.data.answer.trim(),
    category:
      typeof parsed.data.category === "string" && parsed.data.category.trim().length
        ? parsed.data.category.trim()
        : null,
    position: parsed.data.position ?? 0,
    published: parsed.data.published ?? true
  };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("faq_entries").insert(payload).select("*").maybeSingle();

  if (error || !data) {
    console.error("Failed to create FAQ entry", error);
    return NextResponse.json({ error: "Unable to create FAQ entry", code: "FAQ_CREATE_ERROR" }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "faq.created",
    entity: "faq_entries",
    entity_id: (data as FaqEntryRow).id
  });

  const row = data as FaqEntryRow;

  return NextResponse.json(
    {
      entry: {
        id: row.id,
        question: row.question,
        answer: row.answer,
        category: row.category,
        position: row.position,
        published: row.published,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    },
    { status: 201 }
  );
}

export async function PATCH(request: NextRequest) {
  const adminUser = await requireAdminUser();
  const body = await request.json();
  const parsed = upsertSchema.extend({ id: z.string().uuid() }).safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid payload", code: "BAD_REQUEST" }, { status: 400 });
  }

  const { id, question, answer, category, position, published } = parsed.data;

  const update: Database["public"]["Tables"]["faq_entries"]["Update"] = {
    question: question.trim(),
    answer: answer.trim(),
    category: typeof category === "string" && category.trim().length ? category.trim() : null,
    position,
    published
  };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("faq_entries")
    .update(update)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to update FAQ entry", error);
    return NextResponse.json({ error: "Unable to update FAQ entry", code: "FAQ_UPDATE_ERROR" }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "faq.updated",
    entity: "faq_entries",
    entity_id: id
  });

  const row = data as FaqEntryRow;

  return NextResponse.json({
    entry: {
      id: row.id,
      question: row.question,
      answer: row.answer,
      category: row.category,
      position: row.position,
      published: row.published,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  });
}

export async function DELETE(request: NextRequest) {
  const adminUser = await requireAdminUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid FAQ id", code: "BAD_REQUEST" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("faq_entries").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete FAQ entry", error);
    return NextResponse.json({ error: "Unable to delete FAQ entry", code: "FAQ_DELETE_ERROR" }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "faq.deleted",
    entity: "faq_entries",
    entity_id: id
  });

  return NextResponse.json({ success: true });
}
