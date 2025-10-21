"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseClient } from "@/lib/supabaseClient";
import type { SessionTokens } from "@/lib/types";

interface SupabaseListenerProps {
  serverSession: SessionTokens | null;
}

export function SupabaseListener({ serverSession }: SupabaseListenerProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseClient();

    const syncClientSession = async () => {
      if (!serverSession?.access_token || !serverSession?.refresh_token) {
        return;
      }

      const {
        data: { session: clientSession }
      } = await supabase.auth.getSession();

      if (clientSession?.access_token === serverSession.access_token) {
        return;
      }

      await supabase.auth.setSession({
        access_token: serverSession.access_token,
        refresh_token: serverSession.refresh_token
      });
    };

    void syncClientSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        let sessionTokens: SessionTokens | null = null;

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          const {
            data: { user: verifiedUser }
          } = await supabase.auth.getUser();

          if (!verifiedUser || !authSession?.access_token || !authSession?.refresh_token) {
            return;
          }

          sessionTokens = {
            access_token: authSession.access_token,
            refresh_token: authSession.refresh_token
          };
        }

        await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ event, session: sessionTokens })
        });

        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          router.refresh();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, serverSession?.access_token, serverSession?.refresh_token]);

  return null;
}
