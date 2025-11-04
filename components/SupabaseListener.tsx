"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseClient } from "@/lib/supabaseClient";
import type { SessionTokens } from "@/lib/types";

interface SupabaseListenerProps {
  serverSession: SessionTokens | null;
}

type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED";

type AuthEventPayload = {
  event: AuthEvent;
  session: SessionTokens | null;
};

const REFRESH_TOKEN_NOT_FOUND = "refresh_token_not_found";

const buildTokenKey = (tokens: SessionTokens | null): string | null =>
  tokens ? `${tokens.access_token}:${tokens.refresh_token}` : null;

export function SupabaseListener({ serverSession }: SupabaseListenerProps) {
  const router = useRouter();
  const isProcessingRef = useRef(false);
  const queuedEventRef = useRef<AuthEventPayload | null>(null);
  const lastPostedKeyRef = useRef<string | null>(null);
  const lastClientSyncKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let isMounted = true;

    const signOutClient = async (reason: string) => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Supabase signOut failed", reason, error);
        }
      } catch (error) {
        console.error("Supabase signOut threw", reason, error);
      } finally {
        lastClientSyncKeyRef.current = null;
        lastPostedKeyRef.current = null;
      }
    };

    const syncClientSession = async () => {
      try {
        const {
          data: { session: clientSession }
        } = await supabase.auth.getSession();

        const serverTokens = serverSession?.access_token && serverSession?.refresh_token
          ? {
              access_token: serverSession.access_token,
              refresh_token: serverSession.refresh_token
            }
          : null;

        if (!serverTokens) {
          if (clientSession) {
            await signOutClient("server-session-missing");
          }
          return;
        }

        const serverKey = buildTokenKey(serverTokens);

        if (clientSession?.access_token === serverTokens.access_token) {
          lastClientSyncKeyRef.current = serverKey;
          return;
        }

        const { error } = await supabase.auth.setSession(serverTokens);

        if (error) {
          const status = (error as { status?: number; code?: string } | null)?.status;
          const code = (error as { code?: string } | null)?.code;

          if (code === REFRESH_TOKEN_NOT_FOUND || status === 400) {
            console.warn("Clearing stale Supabase session due to missing refresh token", { status, code });
            await signOutClient("client-session-stale");
            return;
          }

          console.error("Failed to sync client session", error);
          return;
        }

        lastClientSyncKeyRef.current = serverKey;
      } catch (error) {
        console.error("Error during syncClientSession", error);
      }
    };

    void syncClientSession();

    const processEvent = async ({ event, session }: AuthEventPayload) => {
      const key = buildTokenKey(session);

      if (event === "SIGNED_OUT") {
        lastPostedKeyRef.current = null;
        lastClientSyncKeyRef.current = null;
      } else {
        if (!key) {
          console.warn("Auth event missing session tokens", { event });
          await signOutClient("auth-event-missing-tokens");
          return;
        }

        if (key === lastPostedKeyRef.current && event !== "TOKEN_REFRESHED") {
          return;
        }

        lastPostedKeyRef.current = key;
        lastClientSyncKeyRef.current = key;
      }

      try {
        const response = await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ event, session })
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Callback responded with ${response.status}`);
        }
      } catch (error) {
        const status = (error as { status?: number } | null)?.status;
        const code = (error as { code?: string } | null)?.code;
        const message = error instanceof Error ? error.message : String(error);

        if (code === REFRESH_TOKEN_NOT_FOUND || status === 400 || message.includes("400")) {
          console.warn("Auth callback rejected invalid refresh token; clearing session.");
        } else if (code === "over_request_rate_limit" || status === 429 || message.includes("429")) {
          console.warn("Auth callback rate limited; clearing session.");
        } else {
          console.error("Failed to sync auth state with server", error);
        }

        await signOutClient("callback-error");
        return;
      }

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    };

    const enqueueEvent = (payload: AuthEventPayload) => {
      if (!isMounted) return;

      if (isProcessingRef.current) {
        queuedEventRef.current = payload;
        return;
      }

      isProcessingRef.current = true;

      const run = async () => {
        try {
          await processEvent(payload);
        } finally {
          isProcessingRef.current = false;
          if (queuedEventRef.current) {
            const next = queuedEventRef.current;
            queuedEventRef.current = null;
            enqueueEvent(next);
          }
        }
      };

      void run();
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT") {
        enqueueEvent({ event, session: null });
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (!authSession?.access_token || !authSession?.refresh_token) {
          console.warn("Auth session missing tokens for event", { event });
          await signOutClient("event-missing-tokens");
          return;
        }

        const tokens: SessionTokens = {
          access_token: authSession.access_token,
          refresh_token: authSession.refresh_token
        };

        const key = buildTokenKey(tokens);
        if (event === "SIGNED_IN" && key && key === lastClientSyncKeyRef.current) {
          return;
        }

        enqueueEvent({ event, session: tokens });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, serverSession?.access_token, serverSession?.refresh_token]);

  return null;
}
