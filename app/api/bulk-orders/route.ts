import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/types";

const payloadSchema = z.object({
  organizationName: z.string().min(2),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  location: z.string().optional(),
  quantityEstimate: z.number().int().positive().nullable().optional(),
  budgetRange: z.string().optional(),
  requestedTitles: z.array(z.string().min(1)).min(1),
  notes: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid payload", code: "BAD_REQUEST" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const payload: Database["public"]["Tables"]["bulk_order_requests"]["Insert"] = {
    organization_name: parsed.data.organizationName.trim(),
    contact_name: parsed.data.contactName.trim(),
    contact_email: parsed.data.contactEmail.trim().toLowerCase(),
    contact_phone: parsed.data.contactPhone?.trim() ?? null,
    location: parsed.data.location?.trim() ?? null,
    quantity_estimate: parsed.data.quantityEstimate ?? null,
    budget_range: parsed.data.budgetRange?.trim() ?? null,
    notes: parsed.data.notes?.trim() ?? null,
    requested_titles: parsed.data.requestedTitles,
    metadata: {}
  };

  const { error } = await supabase.from("bulk_order_requests").insert(payload);

  if (error) {
    console.error("Failed to submit bulk order request", error);
    return NextResponse.json(
      { error: "Unable to submit bulk order request", code: "BULK_ORDER_STORE_ERROR" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
