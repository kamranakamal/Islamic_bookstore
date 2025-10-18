import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminUser } from "@/lib/authHelpers";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin · Maktab Muhammadiya"
  }
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminUser({ redirectTo: "/admin" });

  return (
    <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
      <aside className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-gray-900">{user.displayName ?? user.email}</p>
          <p className="text-xs text-gray-500">Administrator</p>
        </div>
        <AdminNav />
      </aside>
      <section className="space-y-6">{children}</section>
    </div>
  );
}
