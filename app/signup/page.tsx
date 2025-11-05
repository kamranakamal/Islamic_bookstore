import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/site/SignupForm";
import { getSessionUser } from "@/lib/authHelpers";

export const dynamic = "force-dynamic";

interface SignupPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function resolveRedirectParam(param: string | string[] | undefined): string | undefined {
  if (!param) return undefined;
  const value = Array.isArray(param) ? param[0] : param;
  if (!value.startsWith("/")) return undefined;
  return value;
}

export const metadata: Metadata = {
  title: "Create account · Maktab Muhammadiya"
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const sessionUser = await getSessionUser();
  const redirectParam = resolveRedirectParam(searchParams?.redirect);
  const loginHref = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : "/login";

  if (sessionUser) {
    redirect(redirectParam ?? "/");
  }

  return (
    <div className="mx-auto my-16 flex w-full max-w-md flex-col gap-8 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <header className="space-y-1 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Join the library</p>
        <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
        <p className="text-sm text-gray-600">Save your details, manage carts, and stay up to date with the latest releases.</p>
      </header>
      <SignupForm redirectTo={redirectParam} />
      <p className="text-center text-xs text-gray-500">
        <span className="block text-gray-600">
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </span>
        <Link href="/" className="font-semibold text-primary hover:underline">
          Return to the website
        </Link>
      </p>
    </div>
  );
}
