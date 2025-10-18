import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getSessionUser } from "@/lib/authHelpers";

interface AdminLoginPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function resolveRedirectParam(param: string | string[] | undefined): string | undefined {
  if (!param) return undefined;
  const value = Array.isArray(param) ? param[0] : param;
  if (!value.startsWith("/")) return undefined;
  return value;
}

export const metadata: Metadata = {
  title: "Admin login · Maktab Muhammadiya"
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const sessionUser = await getSessionUser();
  const redirectParam = resolveRedirectParam(searchParams?.redirect);

  if (sessionUser?.role === "admin") {
    redirect(redirectParam ?? "/admin");
  }

  return (
    <div className="mx-auto my-16 flex w-full max-w-md flex-col gap-8 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Administrator sign in</h1>
        <p className="text-sm text-gray-600">Enter your credentials to access the admin dashboard.</p>
      </header>
      <AdminLoginForm redirectTo={redirectParam} />
      <p className="text-center text-xs text-gray-500">
        <Link href="/" className="font-semibold text-primary hover:underline">
          Return to the website
        </Link>
      </p>
    </div>
  );
}
