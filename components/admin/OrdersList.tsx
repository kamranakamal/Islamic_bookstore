"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AdminOrder } from "@/lib/types";

interface OrdersListProps {
  orders: AdminOrder[];
}

const STATUS_OPTIONS: Array<{ value: AdminOrder["status"]; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" }
];

const STATUS_FILTER_OPTIONS: Array<{ value: AdminOrder["status"] | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  ...STATUS_OPTIONS
];

const STATUS_COLORS: Record<AdminOrder["status"], string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-sky-100 text-sky-700 border-sky-200",
  processing: "bg-indigo-100 text-indigo-700 border-indigo-200",
  shipped: "bg-blue-100 text-blue-700 border-blue-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  refunded: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200"
};

function formatAddressForCopy(order: AdminOrder): string {
  const lines: string[] = [];

  if (order.shippingAddress?.fullName) {
    lines.push(order.shippingAddress.fullName);
  } else {
    lines.push(order.fullName);
  }

  const address = order.shippingAddress;
  if (address?.line1) {
    lines.push(address.line1);
    if (address.line2) lines.push(address.line2);
  }

  if (address?.landmark) {
    lines.push(address.landmark);
  }

  if (address?.postalCode) {
    lines.push(address.postalCode);
  }

  if (address?.phone) {
    lines.push(address.phone);
  } else if (order.phone) {
    lines.push(order.phone);
  }

  if (order.items && order.items.length > 0) {
    const bookLines = order.items.map((item) => `Book quantity: ${item.quantity}`);
    lines.push(...bookLines);
  }

  return lines.filter(Boolean).join("\n");
}

export function OrdersList({ orders }: OrdersListProps) {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdminOrder["status"] | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ordersQuery = useQuery<AdminOrder[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const response = await fetch("/api/admin/orders");
      const data = (await response.json()) as { orders?: AdminOrder[]; error?: string };
      if (!response.ok || !data.orders) {
        throw new Error(data.error ?? "Unable to load admin orders");
      }
      return data.orders;
    },
    initialData: orders,
    staleTime: 15_000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always"
  });

  const handleCopyAddress = async (order: AdminOrder) => {
    const text = formatAddressForCopy(order);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(order.id);
      setTimeout(() => setCopiedId((prev) => (prev === order.id ? null : prev)), 2500);
    } catch (error) {
      console.error("Failed to copy address", error);
    }
  };

  const updateMutation = useMutation<
    { id: string; status: AdminOrder["status"] },
    Error,
    { id: string; status: AdminOrder["status"] },
    { previous?: AdminOrder[] }
  >({
    mutationFn: async (payload) => {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to update order");
      }
      return payload;
    },
    onMutate: async ({ id, status }) => {
      setUpdatingId(id);
      setErrorMessage(null);
      await queryClient.cancelQueries({ queryKey: ["admin-orders"] });
      const previous = queryClient.getQueryData<AdminOrder[]>(["admin-orders"]);
      if (previous) {
        queryClient.setQueryData<AdminOrder[]>(["admin-orders"], (current = []) =>
          current.map((order) => (order.id === id ? { ...order, status, updatedAt: new Date().toISOString() } : order))
        );
      }
      return { previous };
    },
    onError: (error, _payload, context) => {
      setErrorMessage(error.message ?? "Failed to update order status");
      if (context?.previous) {
        queryClient.setQueryData(["admin-orders"], context.previous);
      }
    },
    onSuccess: ({ id, status }) => {
      queryClient.setQueryData<AdminOrder[]>(["admin-orders"], (current = []) =>
        current.map((order) => (order.id === id ? { ...order, status, updatedAt: new Date().toISOString() } : order))
      );
    },
    onSettled: () => {
      setUpdatingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"], exact: true }).catch(() => {
        /* ignore background refetch errors */
      });
    }
  });

  const deleteMutation = useMutation<string, Error, string, { previous?: AdminOrder[] }>({
    mutationFn: async (id) => {
      const response = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to delete order");
      }
      return id;
    },
    onMutate: async (id) => {
      setDeletingId(id);
      setErrorMessage(null);
      await queryClient.cancelQueries({ queryKey: ["admin-orders"] });
      const previous = queryClient.getQueryData<AdminOrder[]>(["admin-orders"]);
      if (previous) {
        queryClient.setQueryData<AdminOrder[]>(["admin-orders"], (current = []) =>
          current.filter((order) => order.id !== id)
        );
      }
      return { previous };
    },
    onError: (error, _id, context) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete order");
      if (context?.previous) {
        queryClient.setQueryData(["admin-orders"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"], exact: true }).catch(() => {
        /* background refetch failure ignored */
      });
    },
    onSettled: () => {
      setDeletingId(null);
    }
  });

  const handleDelete = (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this order? This action cannot be undone.");
    if (!confirmed) return;
    deleteMutation.mutate(id);
  };

  const loadError = ordersQuery.isError
    ? ordersQuery.error instanceof Error
      ? ordersQuery.error.message
      : "Unable to load admin orders"
    : null;

  const sortedOrders = useMemo(() => {
    const list = ordersQuery.data ?? [];
    return list
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ordersQuery.data]);

  const filteredOrders = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    const byStatus = statusFilter === "all" ? sortedOrders : sortedOrders.filter((order) => order.status === statusFilter);
    if (!needle) return byStatus;
    return byStatus.filter((order) => {
      const haystack = [
        order.fullName,
        order.email,
        order.phone,
        order.institution,
        order.notes,
        order.shippingAddress?.fullName,
        order.shippingAddress?.line1,
        order.shippingAddress?.line2,
        order.shippingAddress?.city,
        order.shippingAddress?.state
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [sortedOrders, statusFilter, searchTerm]);

  const statusSummary = useMemo(() => {
    const list = ordersQuery.data ?? [];
    return STATUS_OPTIONS.reduce<Record<AdminOrder["status"], number>>(
      (acc, option) => {
        acc[option.value] = list.filter((order) => order.status === option.value).length;
        return acc;
      },
      {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0
      }
    );
  }, [ordersQuery.data]);

  if (!sortedOrders.length) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Recent order requests</h2>
        <p className="mt-2 text-sm text-gray-500">No manual order requests have been submitted yet.</p>
      </section>
    );
  }

  const totalOrders = sortedOrders.length;

  return (
    <section className="space-y-6">
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto pb-2 sm:mx-0 sm:flex-wrap sm:gap-4 sm:overflow-visible">
        <div className="min-w-[180px] snap-start rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-primary/10 sm:min-w-[200px] sm:flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total orders</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{totalOrders}</p>
        </div>
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatusFilter((current) => (current === option.value ? "all" : option.value))}
            className={`min-w-[160px] snap-start rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 hover:-translate-y-0.5 hover:shadow-md sm:min-w-[200px] sm:flex-1 ${
              statusFilter === option.value ? "ring-2 ring-primary/40" : ""
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{option.label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{statusSummary[option.value]}</p>
            <p className="text-xs text-gray-500">{statusFilter === option.value ? "Showing all" : "Tap to filter"}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {errorMessage || loadError ? (
          <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">{errorMessage ?? loadError}</div>
        ) : null}
        <header className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent order requests</h2>
            <p className="text-sm text-gray-600">Track inbound manual orders and their fulfilment status.</p>
            <p className="mt-1 text-xs text-gray-500">
              Showing {filteredOrders.length} of {totalOrders} orders
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="orders-status-filter" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </label>
              <select
                id="orders-status-filter"
                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as AdminOrder["status"] | "all")}
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="orders-search" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Search
              </label>
              <div className="flex w-full max-w-xs items-center rounded-full border border-gray-300 bg-white pl-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
                <span aria-hidden="true" className="text-sm text-gray-400">
                  🔍
                </span>
                <input
                  id="orders-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Filter by name, email, or notes"
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

        <div className="grid gap-4 px-4 pb-4 lg:hidden">
          {filteredOrders.length ? (
            filteredOrders.map((order) => (
              <article key={order.id} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{order.fullName}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLORS[order.status]}`}
                  >
                    {STATUS_OPTIONS.find((option) => option.value === order.status)?.label ?? order.status}
                  </span>
                  <select
                    className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={order.status}
                    onChange={(event) =>
                      updateMutation.mutate({ id: order.id, status: event.target.value as AdminOrder["status"] })
                    }
                    disabled={updatingId === order.id}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold text-gray-900">Email:</span>{" "}
                    <a href={`mailto:${order.email}`} className="text-primary hover:underline">
                      {order.email}
                    </a>
                  </p>
                  {order.phone ? (
                    <p>
                      <span className="font-semibold text-gray-900">Phone:</span>{" "}
                      <a href={`tel:${order.phone}`} className="text-primary hover:underline">
                        {order.phone}
                      </a>
                    </p>
                  ) : null}
                  {order.institution ? (
                    <p>
                      <span className="font-semibold text-gray-900">Institution:</span> {order.institution}
                    </p>
                  ) : null}
                  {order.shippingAddress ? (
                    <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                      <p className="font-semibold text-gray-700">Shipping address</p>
                      {order.shippingAddress.line1 ? <p>{order.shippingAddress.line1}</p> : null}
                      {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
                      {(() => {
                        const locality = [order.shippingAddress.city, order.shippingAddress.state]
                          .filter(Boolean)
                          .join(", ");
                        const code = order.shippingAddress.postalCode ?? "";
                        if (!locality && !code) return null;
                        return <p>{`${locality}${code ? ` ${code}` : ""}`.trim()}</p>;
                      })()}
                      {order.shippingAddress.landmark ? <p>Landmark: {order.shippingAddress.landmark}</p> : null}
                    </div>
                  ) : null}
                  <p>
                    <span className="font-semibold text-gray-900">Items:</span> {order.items.reduce((total, item) => total + item.quantity, 0)}
                  </p>
                  {order.notes ? (
                    <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">Note: {order.notes}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleCopyAddress(order)}
                    className="inline-flex min-w-[160px] flex-1 items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
                  >
                    {copiedId === order.id ? "✓ Copied" : "Copy address"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(order.id)}
                    className="inline-flex min-w-[160px] flex-1 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deletingId === order.id}
                  >
                    {deletingId === order.id ? "Removing…" : "Delete order"}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              No orders match your filters.
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">Email</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">Institution</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-600">Items</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-600">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-600">Requested</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredOrders.length ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div>
                        <p>{order.fullName}</p>
                        {order.phone ? <p className="text-xs text-gray-500">{order.phone}</p> : null}
                        {order.shippingAddress ? (
                          <div className="mt-2 space-y-1 text-xs text-gray-500">
                            {order.shippingAddress.label ? (
                              <p className="font-semibold text-gray-600">{order.shippingAddress.label}</p>
                            ) : null}
                            {order.shippingAddress.fullName && order.shippingAddress.fullName !== order.fullName ? (
                              <p>{order.shippingAddress.fullName}</p>
                            ) : null}
                            {order.shippingAddress.line1 ? <p>{order.shippingAddress.line1}</p> : null}
                            {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
                            {(() => {
                              const locality = [order.shippingAddress.city, order.shippingAddress.state]
                                .filter(Boolean)
                                .join(", ");
                              const code = order.shippingAddress.postalCode ?? "";
                              if (!locality && !code) return null;
                              return <p>{`${locality}${code ? ` ${code}` : ""}`.trim()}</p>;
                            })()}
                            {order.shippingAddress.landmark ? (
                              <p className="font-medium">Landmark: {order.shippingAddress.landmark}</p>
                            ) : null}
                            {order.shippingAddress.country ? <p>{order.shippingAddress.country}</p> : null}
                            {order.shippingAddress.phone && order.shippingAddress.phone !== order.phone ? (
                              <p>Alt phone: {order.shippingAddress.phone}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <a href={`mailto:${order.email}`} className="text-primary hover:underline">
                        {order.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.institution ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {order.items.reduce((total, item) => total + item.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLORS[order.status]}`}
                        >
                          {STATUS_OPTIONS.find((option) => option.value === order.status)?.label ?? order.status}
                        </span>
                        <select
                          className="min-w-[150px] rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                          value={order.status}
                          onChange={(event) =>
                            updateMutation.mutate({ id: order.id, status: event.target.value as AdminOrder["status"] })
                          }
                          disabled={updatingId === order.id}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {updatingId === order.id ? (
                          <span className="text-xs text-gray-500">Saving changes…</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyAddress(order)}
                          className="inline-flex items-center rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
                        >
                          {copiedId === order.id ? "✓ Copied" : "Copy address"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(order.id)}
                          className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={deletingId === order.id}
                        >
                          {deletingId === order.id ? "Removing…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                    No orders match your filters.
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
