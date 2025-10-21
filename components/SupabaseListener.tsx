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
      const {
        data: { session: clientSession }
      } = await supabase.auth.getSession();

      if (!serverSession?.access_token || !serverSession?.refresh_token) {
        if (clientSession) {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error("Failed to clear client session", error);
          }
        }
        return;
      }

      if (clientSession?.access_token === serverSession.access_token) {
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: serverSession.access_token,
        refresh_token: serverSession.refresh_token
      });
      if (error) {
        console.error("Failed to sync client session", error);
      }
    };

    void syncClientSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "TOKEN_REFRESHED") {
        return;
      }

      let sessionTokens: SessionTokens | null = null;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (authSession?.access_token && authSession?.refresh_token) {
          const {
            data: { user: verifiedUser }
          } = await supabase.auth.getUser();

          if (verifiedUser) {
            sessionTokens = {
              access_token: authSession.access_token,
              refresh_token: authSession.refresh_token
            };
          } else {
            console.warn("Auth event without verified user");
          }
        } else {
          console.warn("Auth event missing session tokens", { event });
        }
      }

      try {
        const response = await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ event, session: sessionTokens })
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Callback responded with ${response.status}`);
        }
      } catch (error) {
        console.error("Failed to sync auth state with server", error);
        if (event !== "SIGNED_OUT") {
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) {
            console.error("Failed to sign out after callback error", signOutError);
          }
        }
      }

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, serverSession?.access_token, serverSession?.refresh_token]);

  return null;
}
