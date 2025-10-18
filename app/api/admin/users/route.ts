import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/authHelpers";
import { getAdminUsers } from "@/lib/data/admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const updateSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["admin", "member"] as const)
});

export async function GET() {
  await requireAdminUser();
  const users = await getAdminUsers();
  return NextResponse.json({ users });
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
  const { error } = await admin.from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.id);

  if (error) {
    console.error("Failed to update user role", error);
    return NextResponse.json({ error: "Unable to update role", code: "USER_UPDATE_ERROR" }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "user.role_updated",
    entity: "profiles",
    entity_id: parsed.data.id,
    metadata: { role: parsed.data.role }
  });

  return NextResponse.json({ success: true });
}
