import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminUser } from "@/lib/authHelpers";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin · Maktab Muhammadiya"
  }
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminUser({ redirectTo: "/admin" });

  return <AdminShell user={user}>{children}</AdminShell>;
}
