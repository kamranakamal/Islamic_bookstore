import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types";

export async function POST() {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to sign out via API", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
