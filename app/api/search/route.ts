import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { searchBooks } from "@/lib/data/search";

const paramsSchema = z.object({
  query: z.string().min(1),
  page: z.coerce.number().int().positive().optional()
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = paramsSchema.safeParse({
    query: url.searchParams.get("query") ?? "",
    page: url.searchParams.get("page") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const { query, page } = parsed.data;
  const results = await searchBooks({ query, page });
  return NextResponse.json(results);
}
