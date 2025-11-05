import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/site/LoginForm";
import { getSessionUser } from "@/lib/authHelpers";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function resolveRedirectParam(param: string | string[] | undefined): string | undefined {
  if (!param) return undefined;
  const value = Array.isArray(param) ? param[0] : param;
  if (!value.startsWith("/")) return undefined;
  return value;
}

export const metadata: Metadata = {
  title: "Sign in · Maktab Muhammadiya"
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sessionUser = await getSessionUser();
  const redirectParam = resolveRedirectParam(searchParams?.redirect);
  const signupHref = redirectParam ? `/signup?redirect=${encodeURIComponent(redirectParam)}` : "/signup";

  if (sessionUser) {
    redirect(redirectParam ?? "/");
  }

  return (
    <div className="mx-auto my-16 flex w-full max-w-md flex-col gap-8 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <header className="space-y-1 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Welcome back</p>
        <h1 className="text-2xl font-semibold text-gray-900">Sign in to your account</h1>
        <p className="text-sm text-gray-600">Access your saved carts and continue exploring the catalogue.</p>
      </header>
      <LoginForm redirectTo={redirectParam} />
      <p className="text-center text-xs text-gray-500">
        <span className="block text-gray-600">
          New here?{" "}
          <Link href={signupHref} className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </span>
        <Link href="/" className="font-semibold text-primary hover:underline">
          Return to the website
        </Link>
      </p>
    </div>
  );
}
