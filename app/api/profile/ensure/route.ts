import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getRouteHandlerSupabaseClient } from "@/lib/authHelpers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const payloadSchema = z
  .object({
    email: z.string().email().optional(),
    displayName: z.string().trim().min(1).max(120).optional().nullable()
  })
  .optional();

export async function POST(request: NextRequest) {
  const supabase = getRouteHandlerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => undefined);
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success && json !== undefined) {
    const message = parsed.error.issues[0]?.message ?? "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const preferredEmail = parsed.success && parsed.data?.email ? parsed.data.email : user.email ?? undefined;
  const displayName = parsed.success ? parsed.data?.displayName ?? null : null;
  const normalizedEmail = preferredEmail?.trim().toLowerCase();

  const admin = getSupabaseAdmin();
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, display_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    const { error } = await admin.from("profiles").insert({
      auth_user_id: user.id,
      email: normalizedEmail ?? "",
      display_name: displayName
    });

    if (error && error.code !== "23505") {
      console.error("Failed to create profile", error);
      return NextResponse.json({ error: "Unable to create profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, created: true });
  }

  if (displayName && displayName !== existingProfile.display_name) {
    const { error: updateError } = await admin
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", existingProfile.id);

    if (updateError) {
      console.error("Failed to update profile", updateError);
      return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, created: false });
}
