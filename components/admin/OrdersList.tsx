"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AdminOrder } from "@/lib/types";

interface OrdersListProps {
  orders: AdminOrder[];
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "shipped", label: "Shipped" },
  { value: "cancelled", label: "Cancelled" }
];

function formatAddressForCopy(order: AdminOrder): string {
  const lines: string[] = [];

  // Name
  if (order.shippingAddress?.fullName) {
    lines.push(order.shippingAddress.fullName);
  } else {
    lines.push(order.fullName);
  }

  // Address
  const address = order.shippingAddress;
  if (address?.line1) {
    lines.push(address.line1);
    if (address.line2) lines.push(address.line2);
  }

  // Landmark
  if (address?.landmark) {
    lines.push(address.landmark);
  }

  // Pincode
  if (address?.postalCode) {
    lines.push(address.postalCode);
  }

  // Phone
  if (address?.phone) {
    lines.push(address.phone);
  } else if (order.phone) {
    lines.push(order.phone);
  }

  // Books with quantity
  if (order.items && order.items.length > 0) {
    const bookLines = order.items.map((item) => {
      return `Book quantity: ${item.quantity}`;
    });
    lines.push(...bookLines);
  }

  return lines.filter(Boolean).join("\n");
}

export function OrdersList({ orders }: OrdersListProps) {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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

  const loadError = ordersQuery.isError
    ? ordersQuery.error instanceof Error
      ? ordersQuery.error.message
      : "Unable to load admin orders"
    : null;

  const sorted = useMemo(() => {
    const list = ordersQuery.data ?? [];
    return list
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ordersQuery.data]);

  if (!sorted.length) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Recent order requests</h2>
        <p className="mt-2 text-sm text-gray-500">No manual order requests have been submitted yet.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {errorMessage || loadError ? (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">{errorMessage ?? loadError}</div>
      ) : null}
      <header className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recent order requests</h2>
          <p className="text-sm text-gray-600">Track inbound manual orders and their fulfilment status.</p>
        </div>
      </header>
      <div className="grid gap-4 px-4 pb-4 lg:hidden">
        {sorted.map((order) => (
          <article key={order.id} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{order.fullName}</p>
                <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <select
                className="rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">Note: {order.notes}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCopyAddress(order)}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-primary px-3 py-2 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
              >
                {copiedId === order.id ? "✓ Copied" : "Copy address"}
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Institution</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Items</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Requested</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sorted.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  <div>
                    <p>{order.fullName}</p>
                    {order.phone ? <p className="text-xs text-gray-500">{order.phone}</p> : null}
                    {order.shippingAddress ? (
                      <div className="mt-3 space-y-1 text-xs text-gray-500">
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
                  <select
                    className="rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  <button
                    type="button"
                    onClick={() => handleCopyAddress(order)}
                    className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
                  >
                    {copiedId === order.id ? "✓ Copied" : "Copy address"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
