import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/authHelpers";
import { getAdminBlogPosts } from "@/lib/data/admin";
import { toAdminBlogPost } from "@/lib/data/transformers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { BlogPostRow, Database, Json } from "@/lib/types";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const baseSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters long")
    .max(120, "Slug can be at most 120 characters long")
    .regex(slugPattern, "Slug may only include lowercase letters, numbers, and hyphens."),
  title: z.string().trim().min(5, "Title should be descriptive"),
  excerpt: z.string().trim().max(600).optional().nullable(),
  body: z.string().trim().min(20, "Body should include meaningful content"),
  coverImage: z.string().trim().max(500).optional().nullable(),
  authorName: z.string().trim().max(120).optional().nullable(),
  tags: z.array(z.string().trim().min(1)).optional(),
  metadata: z.record(z.unknown()).optional(),
  published: z.boolean().optional(),
  publishedAt: z.string().trim().optional().nullable()
});

function normaliseString(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normaliseMetadata(value: unknown): Json {
  if (value === null || typeof value === "undefined") {
    return {};
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.length) {
      return {};
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed === null || typeof parsed !== "object") {
        throw new Error("Metadata must be a JSON object or array");
      }
      return parsed as Json;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Metadata must be valid JSON");
    }
  }

  if (typeof value === "object") {
    return value as Json;
  }

  throw new Error("Metadata must be a JSON object, array, or JSON string");
}

function parsePublishedAt(published: boolean, value?: string | null): string | null {
  const normalised = normaliseString(value);
  if (!normalised) {
    return published ? new Date().toISOString() : null;
  }

  const date = new Date(normalised);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid published at date");
  }
  return date.toISOString();
}

export async function GET() {
  await requireAdminUser();
  const posts = await getAdminBlogPosts();
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  const adminUser = await requireAdminUser();
  const body = await request.json();
  const parsed = baseSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid payload", code: "BAD_REQUEST" }, { status: 400 });
  }

  const { slug, title, excerpt, body: content, coverImage, authorName, tags, metadata, published } = parsed.data;

  let publishedAtValue: string | null;
  try {
    publishedAtValue = parsePublishedAt(Boolean(published), parsed.data.publishedAt ?? null);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message, code: "INVALID_PUBLISHED_AT" }, { status: 400 });
  }

  let metadataValue: Json;
  try {
    metadataValue = normaliseMetadata(metadata);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message, code: "INVALID_METADATA" }, { status: 400 });
  }

  const payload: Database["public"]["Tables"]["blog_posts"]["Insert"] = {
    slug,
    title: title.trim(),
    excerpt: normaliseString(excerpt),
    body: content.trim(),
    cover_image: normaliseString(coverImage),
    author_name: normaliseString(authorName),
    tags: tags?.length ? tags : [],
    metadata: metadataValue,
    published: Boolean(published),
    published_at: publishedAtValue
  };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("blog_posts").insert(payload).select("*").maybeSingle();

  if (error || !data) {
    console.error("Failed to create blog post", error);
    const conflict = (error as { code?: string } | null)?.code === "23505";
    const code = conflict ? "BLOG_SLUG_CONFLICT" : "BLOG_CREATE_ERROR";
    const message = conflict ? "Slug already exists. Choose a unique slug." : "Unable to create blog post";
    return NextResponse.json({ error: message, code }, { status: conflict ? 409 : 500 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "blog.created",
    entity: "blog_posts",
    entity_id: (data as BlogPostRow).id,
    metadata: { slug }
  });

  return NextResponse.json({ post: toAdminBlogPost(data as BlogPostRow) }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const adminUser = await requireAdminUser();
  const body = await request.json();
  const parsed = baseSchema.extend({ id: z.string().uuid() }).safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid payload", code: "BAD_REQUEST" }, { status: 400 });
  }

  const { id, slug, title, excerpt, body: content, coverImage, authorName, tags, metadata, published } = parsed.data;

  let publishedAtValue: string | null;
  try {
    publishedAtValue = parsePublishedAt(Boolean(published), parsed.data.publishedAt ?? null);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message, code: "INVALID_PUBLISHED_AT" }, { status: 400 });
  }

  let metadataValue: Json;
  try {
    metadataValue = normaliseMetadata(metadata);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message, code: "INVALID_METADATA" }, { status: 400 });
  }

  const update: Database["public"]["Tables"]["blog_posts"]["Update"] = {
    slug,
    title: title.trim(),
    excerpt: normaliseString(excerpt),
    body: content.trim(),
    cover_image: normaliseString(coverImage),
    author_name: normaliseString(authorName),
    tags: tags?.length ? tags : [],
    metadata: metadataValue,
    published: Boolean(published),
    published_at: publishedAtValue
  };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("blog_posts").update(update).eq("id", id).select("*").maybeSingle();

  if (error || !data) {
    console.error("Failed to update blog post", error);
    const conflict = (error as { code?: string } | null)?.code === "23505";
    const code = conflict ? "BLOG_SLUG_CONFLICT" : "BLOG_UPDATE_ERROR";
    const message = conflict ? "Slug already exists. Choose a unique slug." : "Unable to update blog post";
    return NextResponse.json({ error: message, code }, { status: conflict ? 409 : 500 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "blog.updated",
    entity: "blog_posts",
    entity_id: id,
    metadata: { slug }
  });

  return NextResponse.json({ post: toAdminBlogPost(data as BlogPostRow) });
}

export async function DELETE(request: NextRequest) {
  const adminUser = await requireAdminUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid blog post id", code: "BAD_REQUEST" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete blog post", error);
    return NextResponse.json({ error: "Unable to delete blog post", code: "BLOG_DELETE_ERROR" }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "blog.deleted",
    entity: "blog_posts",
    entity_id: id,
    metadata: {}
  });

  return NextResponse.json({ success: true });
}
