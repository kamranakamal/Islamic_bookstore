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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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
    if (statusFilter === "all") {
      return sortedPreferences;
    }

    return sortedPreferences.filter((entry) => entry.status === statusFilter);
  }, [sortedPreferences, statusFilter]);

  const pendingCount = useMemo(() => {
    return sortedPreferences.filter((entry) => entry.status === "pending").length;
  }, [sortedPreferences]);

  const loadError = paymentsQuery.isError
    ? paymentsQuery.error instanceof Error
      ? paymentsQuery.error.message
      : "Unable to load payments"
    : null;

  const combinedError = errorMessage ?? loadError;

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
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
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
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="payment-status-filter"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Filter
          </label>
          <select
            id="payment-status-filter"
            className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
      </header>

      {combinedError ? (
        <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">{combinedError}</div>
      ) : null}

      <div className="overflow-x-auto -mx-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-6">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-6">
                Contact
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-6 md:table-cell">
                Payment method
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-6 lg:table-cell">
                Delivery window
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-6">
                Reference
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-6 lg:table-cell">
                Updated
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-6">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredPreferences.length ? (
              filteredPreferences.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 sm:px-6">
                    <div>
                      <p>{entry.profileName ?? "Member"}</p>
                      <p className="text-xs text-gray-500">ID: {entry.profileId.slice(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 sm:px-6">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{entry.billingName ?? "—"}</p>
                      <a
                        href={`mailto:${entry.billingEmail ?? entry.profileEmail}`}
                        className="block text-primary hover:underline text-xs"
                      >
                        {entry.billingEmail ?? entry.profileEmail}
                      </a>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-700 sm:px-6 md:table-cell">
                    <div className="space-y-1">
                      <span className="block font-semibold text-gray-900">
                        {formatTitleCase(entry.paymentMethod)}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-700 sm:px-6 lg:table-cell">{entry.deliveryWindow ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 sm:px-6">
                    <span>{entry.referenceCode ? entry.referenceCode.slice(0, 10) : "—"}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-500 sm:px-6 lg:table-cell">{new Date(entry.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right text-sm sm:px-6">
                    <div className="flex flex-col items-end gap-1">
                      <select
                        aria-label={`Update status for ${entry.profileName ?? entry.profileEmail}`}
                        className="min-w-[140px] rounded-full border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
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
                        <span className="text-xs text-gray-500">Saving changes…</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  No submissions match the selected status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
