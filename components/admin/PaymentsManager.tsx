"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AdminCheckoutPreference, CheckoutPaymentStatus } from "@/lib/types";

interface PaymentsManagerProps {
  preferences: AdminCheckoutPreference[];
}

const PAYMENT_STATUS_OPTIONS: Array<{ value: CheckoutPaymentStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" }
];

const STATUS_UPDATE_OPTIONS = PAYMENT_STATUS_OPTIONS.filter(
  (option): option is { value: CheckoutPaymentStatus; label: string } => option.value !== "all"
);

const PAYMENT_STATUS_KEYS = STATUS_UPDATE_OPTIONS.map((option) => option.value);

const STATUS_COLORS: Record<CheckoutPaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  contacted: "bg-sky-100 text-sky-700 border-sky-200",
  awaiting_payment: "bg-indigo-100 text-indigo-700 border-indigo-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200"
};

function formatTitleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function PaymentsManager({ preferences }: PaymentsManagerProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<CheckoutPaymentStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const paymentsQuery = useQuery<AdminCheckoutPreference[]>({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const response = await fetch("/api/admin/payments");
      const data = (await response.json()) as {
        preferences?: AdminCheckoutPreference[];
        error?: string;
      };

      if (!response.ok || !data.preferences) {
        throw new Error(data.error ?? "Unable to load payments");
      }

      return data.preferences;
    },
    initialData: preferences,
    staleTime: 15_000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always"
  });

  const sortedPreferences = useMemo(() => {
    const list = paymentsQuery.data ?? [];
    return list
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [paymentsQuery.data]);

  const filteredPreferences = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    const byStatus = statusFilter === "all" ? sortedPreferences : sortedPreferences.filter((entry) => entry.status === statusFilter);
    if (!needle) return byStatus;
    return byStatus.filter((entry) => {
      const haystack = [
        entry.profileName,
        entry.billingName,
        entry.billingEmail,
        entry.profileEmail,
        entry.referenceCode,
        entry.paymentMethod
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [sortedPreferences, statusFilter, searchTerm]);

  const pendingCount = useMemo(() => {
    return sortedPreferences.filter((entry) => entry.status === "pending").length;
  }, [sortedPreferences]);

  const statusSummary = useMemo(() => {
    return PAYMENT_STATUS_KEYS.reduce<Record<CheckoutPaymentStatus, number>>((acc, key) => {
      acc[key] = sortedPreferences.filter((entry) => entry.status === key).length;
      return acc;
    },
    {
      pending: 0,
      contacted: 0,
      awaiting_payment: 0,
      paid: 0,
      cancelled: 0
    });
  }, [sortedPreferences]);

  const loadError = paymentsQuery.isError
    ? paymentsQuery.error instanceof Error
      ? paymentsQuery.error.message
      : "Unable to load payments"
    : null;

  const combinedError = errorMessage ?? loadError;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/admin/payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to delete payment preference");
      }
      return id;
    },
    onMutate: async (id) => {
      setDeletingId(id);
      setErrorMessage(null);
      await queryClient.cancelQueries({ queryKey: ["admin-payments"] });
      const previous = queryClient.getQueryData<AdminCheckoutPreference[]>(["admin-payments"]);
      if (previous) {
        queryClient.setQueryData<AdminCheckoutPreference[]>(["admin-payments"], (old = []) =>
          old.filter((entry) => entry.id !== id)
        );
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete payment preference");
      if (context?.previous) {
        queryClient.setQueryData(["admin-payments"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"], exact: true }).catch(() => {
        /* ignore */
      });
    },
    onSettled: () => {
      setDeletingId(null);
    }
  });

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this checkout submission? This action cannot be undone."
    );
    if (!confirmed) return;
    deleteMutation.mutate(id);
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CheckoutPaymentStatus }) => {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to update payment status");
      }

      return { id, status };
    },
    onMutate: async ({ id, status }) => {
      setUpdatingId(id);
      setErrorMessage(null);
      await queryClient.cancelQueries({ queryKey: ["admin-payments"] });

      const previous = queryClient.getQueryData<AdminCheckoutPreference[]>(["admin-payments"]);

      if (previous) {
        queryClient.setQueryData<AdminCheckoutPreference[]>(["admin-payments"], (old = []) =>
          old.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  status,
                  updatedAt: new Date().toISOString()
                }
              : entry
          )
        );
      }

      return { previous };
    },
    onError: (error, _variables, context) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update payment status");

      if (context?.previous) {
        queryClient.setQueryData(["admin-payments"], context.previous);
      }
    },
    onSuccess: ({ id, status }) => {
      queryClient.setQueryData<AdminCheckoutPreference[]>(["admin-payments"], (current = []) =>
        current.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status,
                updatedAt: new Date().toISOString()
              }
            : entry
        )
      );
    },
    onSettled: () => {
      setUpdatingId(null);
    }
  });

  if ((paymentsQuery.data ?? []).length === 0) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Checkout payment details</h2>
        <p className="mt-2 text-sm text-gray-500">No checkout preferences have been submitted yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto pb-2 sm:mx-0 sm:flex-wrap sm:gap-4 sm:overflow-visible">
        <div className="min-w-[180px] snap-start rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-primary/10 sm:min-w-[200px] sm:flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total submissions</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{sortedPreferences.length}</p>
          <p className="text-xs text-gray-500">Pending follow-ups: {pendingCount}</p>
        </div>
        {PAYMENT_STATUS_KEYS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter((current) => (current === status ? "all" : status))}
            className={`min-w-[160px] snap-start rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 hover:-translate-y-0.5 hover:shadow-md sm:min-w-[200px] sm:flex-1 ${
              statusFilter === status ? "ring-2 ring-primary/40" : ""
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{formatTitleCase(status)}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{statusSummary[status]}</p>
            <p className="text-xs text-gray-500">{statusFilter === status ? "Showing all" : "Tap to filter"}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <header className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Checkout payment details</h2>
            <p className="text-sm text-gray-600">
              Review recent checkout submissions and confirm next steps with each customer.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Showing {filteredPreferences.length} of {sortedPreferences.length} submissions · Pending: {pendingCount}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="payment-status-filter"
                className="text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Status
              </label>
              <select
                id="payment-status-filter"
                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as CheckoutPaymentStatus | "all")}
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="payments-search" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Search
              </label>
              <div className="flex w-full max-w-xs items-center rounded-full border border-gray-300 bg-white pl-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
                <span aria-hidden="true" className="text-sm text-gray-400">
                  🔍
                </span>
                <input
                  id="payments-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Filter by name, email, or reference"
                  className="w-full rounded-full border-0 bg-transparent px-2 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    className="px-3 text-xs font-semibold uppercase tracking-wide text-primary"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {combinedError ? (
          <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">{combinedError}</div>
        ) : null}

        {/* Mobile card view */}
        <div className="grid gap-4 p-4 sm:hidden">
          {filteredPreferences.length ? (
            filteredPreferences.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-semibold text-gray-900">{entry.profileName ?? "Member"}</span>
                      <span className="text-xs text-gray-500">ID: {entry.profileId.slice(0, 8)}...</span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLORS[entry.status]}`}
                    >
                      {formatTitleCase(entry.status)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-900 text-sm">{entry.billingName ?? "—"}</span>
                    <a
                      href={`mailto:${entry.billingEmail ?? entry.profileEmail}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {entry.billingEmail ?? entry.profileEmail}
                    </a>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-gray-600">
                    <span><strong>Payment:</strong> {formatTitleCase(entry.paymentMethod)}</span>
                    <span><strong>Delivery:</strong> {entry.deliveryWindow ?? "—"}</span>
                    <span><strong>Reference:</strong> {entry.referenceCode ? entry.referenceCode.slice(0, 10) : "—"}</span>
                    <span><strong>Updated:</strong> {new Date(entry.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <select
                      aria-label={`Update status for ${entry.profileName ?? entry.profileEmail}`}
                      className="min-w-[160px] rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                      value={entry.status}
                      onChange={(event) =>
                        updateMutation.mutate({
                          id: entry.id,
                          status: event.target.value as CheckoutPaymentStatus
                        })
                      }
                      disabled={updatingId === entry.id}
                    >
                      {STATUS_UPDATE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="inline-flex w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={deletingId === entry.id}
                    >
                      {deletingId === entry.id ? "Removing…" : "Delete submission"}
                    </button>
                  </div>
                  {updatingId === entry.id ? (
                    <span className="text-xs text-gray-500">Saving changes…</span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
              No submissions match the selected filters.
            </div>
          )}
        </div>

        {/* Table view for larger screens */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  Contact
                </th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600 md:table-cell">
                  Payment method
                </th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600 lg:table-cell">
                  Delivery window
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  Reference
                </th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600 lg:table-cell">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  Manage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPreferences.length ? (
                filteredPreferences.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div>
                          <p>{entry.profileName ?? "Member"}</p>
                          <p className="text-xs text-gray-500">ID: {entry.profileId.slice(0, 8)}...</p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLORS[entry.status]}`}
                        >
                          {formatTitleCase(entry.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{entry.billingName ?? "—"}</p>
                        <a
                          href={`mailto:${entry.billingEmail ?? entry.profileEmail}`}
                          className="block text-xs text-primary hover:underline"
                        >
                          {entry.billingEmail ?? entry.profileEmail}
                        </a>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-gray-700 md:table-cell">
                      <span className="font-semibold text-gray-900">{formatTitleCase(entry.paymentMethod)}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-gray-700 lg:table-cell">{entry.deliveryWindow ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span>{entry.referenceCode ? entry.referenceCode.slice(0, 10) : "—"}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-gray-500 lg:table-cell">{new Date(entry.updatedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      <select
                        aria-label={`Update status for ${entry.profileName ?? entry.profileEmail}`}
                        className="min-w-[140px] rounded-full border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                        value={entry.status}
                        onChange={(event) =>
                          updateMutation.mutate({
                            id: entry.id,
                            status: event.target.value as CheckoutPaymentStatus
                          })
                        }
                        disabled={updatingId === entry.id}
                      >
                        {STATUS_UPDATE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {updatingId === entry.id ? (
                        <span className="mt-1 block text-xs text-gray-500">Saving changes…</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingId === entry.id}
                      >
                        {deletingId === entry.id ? "Removing…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                    No submissions match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
