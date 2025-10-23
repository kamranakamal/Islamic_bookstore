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
      {/* Mobile card view */}
      <div className="grid gap-4 p-4 sm:hidden">
        {sorted.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
            No users yet. Invite team members through Supabase authentication to manage catalog access.
          </div>
        ) : (
          sorted.map((user) => (
            <div key={user.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-900 text-base">{user.displayName ?? "Unspecified"}</span>
                    <span className="text-xs text-gray-500 truncate">{user.email}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 capitalize bg-gray-100 px-2 py-1 rounded">
                    {user.role}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table view for larger screens */}
      <div className="overflow-x-auto -mx-4 hidden sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-6">User</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-6 md:table-cell">Role</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-6">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500 sm:px-6">
                  No users yet. Invite team members through Supabase authentication to manage catalog access.
                </td>
              </tr>
            ) : (
              sorted.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 sm:px-6">
                    <div>
                      <p>{user.displayName ?? "Unspecified"}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-700 capitalize sm:px-6 md:table-cell">{user.role}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500 sm:px-6 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
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
