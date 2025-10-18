import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/types";

const messageSchema = z.object({
  name: z.string().min(3, "Please share your full name"),
  email: z.string().email("Provide a valid email address"),
  phone: z.string().max(50).optional().transform((value) => (value?.trim().length ? value.trim() : null)),
  subject: z
    .string()
    .max(120)
    .optional()
    .transform((value) => (value?.trim().length ? value.trim() : null)),
  message: z.string().min(10, "Let us know how we can help")
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid payload", code: "BAD_REQUEST" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const payload: Database["public"]["Tables"]["contact_messages"]["Insert"] = {
    name: parsed.data.name.trim(),
    email: parsed.data.email.trim().toLowerCase(),
    phone: parsed.data.phone ?? null,
    subject: parsed.data.subject ?? null,
    message: parsed.data.message.trim(),
    status: "new"
  };

  const { error } = await supabase.from("contact_messages").insert(payload);

  if (error) {
    console.error("Failed to store contact message", error);
    return NextResponse.json({ error: "Unable to submit message", code: "MESSAGE_STORE_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
