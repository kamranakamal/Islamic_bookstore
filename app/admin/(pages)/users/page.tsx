import { UsersList } from "@/components/admin/UsersList";
import { getAdminUsers } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-600">Manage roles and audit access to the admin workspace.</p>
      </header>
      <UsersList users={users} />
    </div>
  );
}
