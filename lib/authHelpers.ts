import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createRouteHandlerClient,
  createServerComponentClient
} from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";

import type { Database, ProfileRow } from "@/lib/types";
import { fetchWithRetry } from "@/lib/utils/fetchWithRetry";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: ProfileRow["role"];
};

export type RequireAdminOptions = {
  redirectTo?: string;
};

export function getServerSupabaseClient() {
  return createServerComponentClient<Database>(
    { cookies },
    {
      options: {
        global: {
          fetch: (input: RequestInfo | URL, init?: RequestInit) => fetchWithRetry(input, init)
        }
      }
    }
  );
}

export function getRouteHandlerSupabaseClient() {
  return createRouteHandlerClient<Database>(
    { cookies },
    {
      options: {
        global: {
          fetch: (input: RequestInfo | URL, init?: RequestInit) => fetchWithRetry(input, init)
        }
      }
    }
  );
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = getServerSupabaseClient();
  let user: User | null = null;

  try {
    const response = await supabase.auth.getUser();
    user = response.data.user;
  } catch (error) {
    console.error("Failed to retrieve Supabase user", error);
    throw new Error(
      "Unable to reach the authentication service. Please verify your Supabase configuration and internet connectivity."
    );
  }

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, display_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const typedProfile = profile as Pick<ProfileRow, "id" | "email" | "role" | "display_name"> | null;

  if (!typedProfile) return null;

  return {
    id: typedProfile.id,
    email: typedProfile.email,
    displayName: typedProfile.display_name ?? null,
    role: typedProfile.role
  };
}

export async function requireAdminUser(options: RequireAdminOptions = {}): Promise<SessionUser> {
  const redirectTo = options.redirectTo ?? "/admin";
  const loginPath = redirectTo
    ? `/adminlogin?redirect=${encodeURIComponent(redirectTo)}`
    : "/adminlogin";

  const maybeUser = await getSessionUser();
  
  if (!maybeUser) {
    redirect(loginPath);
  }
  const user = maybeUser as SessionUser;
  if (user.role !== "admin") {
    redirect(loginPath);
  }
  return user;
}

export async function requireAuthenticatedRouteUser(): Promise<{ user: User; profile: ProfileRow }> {
  const supabase = getRouteHandlerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User session not found");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !profile) {
    throw new Error("Profile not found");
  }

  return { user, profile: profile as ProfileRow };
}
