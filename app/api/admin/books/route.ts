import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/authHelpers";
import { getAdminBooksData } from "@/lib/data/admin";
import { toAdminBook } from "@/lib/data/transformers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { BookRowWithCategory } from "@/lib/types";

const bookSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3),
  slug: z.string().min(3),
  author: z.string().min(3),
  publisher: z.string().optional(),
  format: z.string().min(2),
  pageCount: z.number().int().positive(),
  language: z.string().min(2),
  isbn: z.string().optional(),
  priceCents: z.number().int().min(0),
  summary: z.string().min(10),
  description: z.string().min(20),
  categoryId: z.string().uuid(),
  coverPath: z.string().nullable().optional(),
  highlights: z.array(z.string().min(2)).max(10).optional(),
  isFeatured: z.boolean().optional()
});

export async function GET() {
  await requireAdminUser();
  const data = await getAdminBooksData();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const admin = getSupabaseAdmin() as any;
  const adminUser = await requireAdminUser();
  const body = await request.json();
  const parsed = bookSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const { data, error } = await admin
    .from("books")
    .insert({
      title: input.title,
      slug: input.slug,
      author: input.author,
      publisher: input.publisher ?? null,
      format: input.format,
      page_count: input.pageCount,
      language: input.language,
      isbn: input.isbn ?? null,
      price_cents: input.priceCents,
      summary: input.summary,
      description: input.description,
      category_id: input.categoryId,
      cover_path: input.coverPath ?? null,
      highlights: input.highlights ?? [],
      is_featured: input.isFeatured ?? false
    })
    .select("*, categories(name)");

  const rows = (data ?? []) as BookRowWithCategory[];

  if (error || !rows[0]) {
    console.error("Failed to create book", error);
    return NextResponse.json({ error: "Unable to create book", code: "BOOK_CREATE_ERROR" }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "book.created",
    entity: "books",
    entity_id: rows[0].id,
    metadata: { title: input.title }
  });

  return NextResponse.json({ book: toAdminBook(rows[0]) }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const admin = getSupabaseAdmin() as any;
  const adminUser = await requireAdminUser();
  const body = await request.json();
  const parsed = bookSchema.extend({ id: z.string().uuid() }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const { data, error } = await admin
    .from("books")
    .update({
      title: input.title,
      slug: input.slug,
      author: input.author,
      publisher: input.publisher ?? null,
      format: input.format,
      page_count: input.pageCount,
      language: input.language,
      isbn: input.isbn ?? null,
      price_cents: input.priceCents,
      summary: input.summary,
      description: input.description,
      category_id: input.categoryId,
      cover_path: input.coverPath ?? null,
      highlights: input.highlights ?? [],
      is_featured: input.isFeatured ?? false
    })
    .eq("id", input.id)
    .select("*, categories(name)");

  const rows = (data ?? []) as BookRowWithCategory[];

  if (error || !rows[0]) {
    console.error("Failed to update book", error);
    return NextResponse.json({ error: "Unable to update book", code: "BOOK_UPDATE_ERROR" }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "book.updated",
    entity: "books",
    entity_id: input.id,
    metadata: { title: input.title }
  });

  return NextResponse.json({ book: toAdminBook(rows[0]) });
}

export async function DELETE(request: NextRequest) {
  const admin = getSupabaseAdmin() as any;
  const adminUser = await requireAdminUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid book id", code: "BAD_REQUEST" }, { status: 400 });
  }

  const { error } = await admin.from("books").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete book", error);
    return NextResponse.json({ error: "Unable to delete book", code: "BOOK_DELETE_ERROR" }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "book.deleted",
    entity: "books",
    entity_id: id,
    metadata: {}
  });

  return NextResponse.json({ success: true });
}
