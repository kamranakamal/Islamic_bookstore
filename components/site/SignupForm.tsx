"use client";

import { useState } from "react";

import { getSupabaseClient } from "@/lib/supabaseClient";

interface SignupFormProps {
  redirectTo?: string;
}

type FormState = "idle" | "submitting" | "success" | "error";

type SignupError = {
  message: string;
};

function sanitizeRedirectPath(path?: string): string {
  if (!path || !path.startsWith("/")) {
    return "/";
  }
  return path;
}

export function SignupForm({ redirectTo }: SignupFormProps) {
  const supabase = getSupabaseClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<SignupError | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setState("submitting");
    setError(null);
    setInfoMessage(null);

    try {
      if (password !== confirmPassword) {
        setState("error");
        setError({ message: "Passwords do not match." });
        return;
      }

      const redirectPath = sanitizeRedirectPath(redirectTo);
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedName = fullName.trim();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: trimmedName ? { display_name: trimmedName } : undefined
        }
      });

      if (signUpError || !data?.user) {
        setState("error");
        setError({ message: signUpError?.message ?? "Unable to sign up." });
        return;
      }

      if (data.session) {
        await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ event: "SIGNED_IN", session: data.session })
        });

        await new Promise((resolve) => setTimeout(resolve, 200));

        try {
          await fetch("/api/profile/ensure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              email: normalizedEmail,
              displayName: trimmedName || null
            })
          });
        } catch (profileError) {
          console.error("Failed to create profile", profileError);
        }

        setState("idle");
        window.location.href = redirectPath;
        return;
      }

      setState("success");
      setInfoMessage("Check your email to confirm your account. Once verified you can sign in.");
      setPassword("");
      setConfirmPassword("");
    } catch (unknownError) {
      setState("error");
      setError({ message: unknownError instanceof Error ? unknownError.message : "Unable to sign up." });
    }
  };

  const isSubmitting = state === "submitting";
  const isSuccess = state === "success";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="signup-name" className="text-sm font-semibold text-gray-900">
          Full name <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="signup-email" className="text-sm font-semibold text-gray-900">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="signup-password" className="text-sm font-semibold text-gray-900">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="signup-password-confirm" className="text-sm font-semibold text-gray-900">
          Confirm password
        </label>
        <input
          id="signup-password-confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      {infoMessage ? <p className="text-sm text-green-600">{infoMessage}</p> : null}
      <button
        type="submit"
        className="w-full rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting || isSuccess}
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
