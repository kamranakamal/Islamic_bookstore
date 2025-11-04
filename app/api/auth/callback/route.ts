import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database, SessionTokens } from "@/lib/types";

interface AuthCallbackPayload {
  event: string;
  session: SessionTokens | null;
}

const REFRESH_TOKEN_NOT_FOUND = "refresh_token_not_found";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { event, session }: AuthCallbackPayload = await request.json();

  try {
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      if (!session?.access_token || !session?.refresh_token) {
        await supabase.auth.signOut();
        return NextResponse.json({ success: true, action: "cleared", reason: "missing_tokens" });
      }

      const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });

      if (error) {
        const status = (error as { status?: number; code?: string } | null)?.status;
        const code = (error as { code?: string } | null)?.code;

        if (code === REFRESH_TOKEN_NOT_FOUND || status === 400) {
          await supabase.auth.signOut();
          return NextResponse.json({ success: true, action: "cleared", reason: REFRESH_TOKEN_NOT_FOUND });
        }

        console.error("Auth callback failed to set session", error);
        return NextResponse.json({ success: false, error: "session_sync_failed" }, { status: 500 });
      }
    } else if (event === "SIGNED_OUT") {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Auth callback failed to sign out", error);
        return NextResponse.json({ success: false, error: "sign_out_failed" }, { status: 500 });
      }
    }
  } catch (error) {
    console.error("Auth callback encountered an unexpected error", error);
    return NextResponse.json({ success: false, error: "auth_callback_exception" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
