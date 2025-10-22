"use client";

import { useState } from "react";

import { getSupabaseClient } from "@/lib/supabaseClient";

interface LoginFormProps {
  redirectTo?: string;
}

type FormState = "idle" | "submitting" | "error";

type LoginError = {
  message: string;
};

function sanitizeRedirectPath(path?: string): string {
  if (!path || !path.startsWith("/")) {
    return "/";
  }
  return path;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const supabase = getSupabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<LoginError | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setState("submitting");
    setError(null);

    try {
      const redirectPath = sanitizeRedirectPath(redirectTo);
      console.log("Login attempt started, redirect path:", redirectPath);
      
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      console.log("Supabase auth response:", { data: !!data, error: signInError });

      if (signInError || !data?.user) {
        setState("error");
        setError({ message: signInError?.message ?? "Invalid credentials." });
        return;
      }

      if (data.session) {
        console.log("Setting session via auth callback...");
        const callbackResponse = await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ event: "SIGNED_IN", session: data.session })
        });

        console.log("Auth callback response:", callbackResponse.ok);

        await new Promise((resolve) => setTimeout(resolve, 500)); // Increased timeout

        try {
          console.log("Ensuring user profile...");
          const profileResponse = await fetch("/api/profile/ensure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              email: normalizedEmail,
              displayName: data.user.user_metadata?.display_name ?? null
            })
          });
          console.log("Profile ensure response:", profileResponse.ok);
        } catch (profileError) {
          console.error("Failed to sync profile", profileError);
        }
      }

      setState("idle");
      console.log("Login successful, redirecting to:", redirectPath);
      
      // Force a page refresh to ensure session is properly loaded
      if (typeof window !== 'undefined') {
        window.location.replace(redirectPath);
      }
    } catch (unknownError) {
      setState("error");
      setError({ message: unknownError instanceof Error ? unknownError.message : "Unable to sign in." });
    }
  };

  const isSubmitting = state === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="login-email" className="text-sm font-semibold text-gray-900">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="login-password" className="text-sm font-semibold text-gray-900">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      <button
        type="submit"
        className="w-full rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
