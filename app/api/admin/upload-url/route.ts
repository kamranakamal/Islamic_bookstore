import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/authHelpers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const schema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().regex(/^image\//, "Only image uploads are supported"),
  fileSize: z.coerce.number().max(5 * 1024 * 1024, "Images must be smaller than 5MB"),
  bucket: z.enum(["cover", "gallery"]).default("cover")
});

const COVER_BUCKET = process.env.SUPABASE_COVER_BUCKET ?? process.env.SUPABASE_BUCKET_NAME ?? "book-cover";
const GALLERY_BUCKET = process.env.SUPABASE_GALLERY_BUCKET ?? "book-images";
const BUCKET_BY_ALIAS: Record<"cover" | "gallery", string> = {
  cover: COVER_BUCKET,
  gallery: GALLERY_BUCKET
};
const SIGNED_URL_EXPIRY_SECONDS = 60 * 15; // 15 minutes

export async function GET(request: NextRequest) {
  await requireAdminUser();

  const url = new URL(request.url);
  const input = {
    fileName: url.searchParams.get("fileName") ?? "",
    fileType: url.searchParams.get("fileType") ?? "",
    fileSize: Number(url.searchParams.get("fileSize") ?? "0"),
    bucket: (url.searchParams.get("bucket") as "cover" | "gallery" | null) ?? "cover"
  };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const { fileName, fileType, bucket } = parsed.data;
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-]/g, "-");
  const filePath = `${crypto.randomUUID()}-${safeFileName}`;
  const bucketName = BUCKET_BY_ALIAS[bucket];

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage.from(bucketName).createSignedUploadUrl(filePath, {
    upsert: true
  });

  if (error || !data) {
    console.error("Failed to create signed upload URL", error);
    return NextResponse.json({ error: "Unable to create upload URL", code: "UPLOAD_ERROR" }, { status: 500 });
  }

  return NextResponse.json({
    url: data.signedUrl,
  bucket: bucketName,
    path: filePath,
    token: data.token,
    expiresAt: new Date(Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000).toISOString(),
    contentType: fileType
  });
}
