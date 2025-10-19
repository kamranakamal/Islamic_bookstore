import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/authHelpers";
import { getAdminCategories } from "@/lib/data/admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { CategorySummary, Database } from "@/lib/types";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters long"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters long")
    .max(120, "Slug can be at most 120 characters long")
    .regex(slugPattern, "Slug may only include lowercase letters, numbers, and hyphens."),
  description: z
    .string()
    .trim()
    .max(600, "Description can be at most 600 characters long")
    .optional()
    .or(z.literal(""))
});

function normaliseDescription(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toCategorySummary(row: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  updated_at: string;
}): CategorySummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    updatedAt: row.updated_at
  };
}

export async function GET() {
  await requireAdminUser();
  const categories = await getAdminCategories();
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const adminUser = await requireAdminUser();
  const body = await request.json();
  const parsed = createCategorySchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Invalid payload", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const supabase = getSupabaseAdmin();

  const payload: Database["public"]["Tables"]["categories"]["Insert"] = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: normaliseDescription(input.description)
  };

  const { data, error } = await supabase
    .from("categories")
    .insert(payload)
    .select("id, slug, name, description, updated_at")
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to create category", error);
    const conflict = (error as { code?: string } | null)?.code === "23505";
    const code = conflict ? "CATEGORY_SLUG_CONFLICT" : "CATEGORY_CREATE_ERROR";
    const message = conflict ? "Slug already exists. Choose a unique slug." : "Unable to create category";
    return NextResponse.json({ error: message, code }, { status: conflict ? 409 : 500 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "category.created",
    entity: "categories",
    entity_id: data.id,
    metadata: { slug: data.slug }
  });

  return NextResponse.json({ category: toCategorySummary(data) }, { status: 201 });
}
