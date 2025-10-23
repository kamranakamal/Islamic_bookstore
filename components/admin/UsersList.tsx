"use client";

import { useMemo } from "react";

import type { AdminUserSummary } from "@/lib/types";

interface UsersListProps {
  users: AdminUserSummary[];
}

export function UsersList({ users }: UsersListProps) {
  const sorted = useMemo(
    () => users.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [users]
  );

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Admin workspace members</h2>
          <p className="text-sm text-gray-600">Review who has access and what permissions they have.</p>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-4">User</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:table-cell">Role</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                  No users yet. Invite team members through Supabase authentication to manage catalog access.
                </td>
              </tr>
            ) : (
              sorted.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm font-medium text-gray-900 sm:px-4">
                    <div>
                      <p className="truncate">{user.displayName ?? "Unspecified"}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs font-medium text-gray-600 capitalize sm:hidden">{user.role}</p>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-700 capitalize sm:table-cell">{user.role}</td>
                  <td className="px-3 py-3 text-right text-sm text-gray-500 sm:px-4">
                    <span className="hidden sm:inline">{new Date(user.createdAt).toLocaleDateString()}</span>
                    <span className="sm:hidden">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
