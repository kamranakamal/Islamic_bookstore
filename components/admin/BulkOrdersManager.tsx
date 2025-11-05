"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AdminBulkOrderRequest } from "@/lib/types";

interface BulkOrdersManagerProps {
  requests: AdminBulkOrderRequest[];
}

type BulkOrderStatus = AdminBulkOrderRequest["status"];

const STATUS_OPTIONS: Array<{ value: BulkOrderStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Reviewing" },
  { value: "quoted", label: "Quoted" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }
];

const STATUS_LABELS: Record<BulkOrderStatus, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  quoted: "Quoted",
  completed: "Completed",
  cancelled: "Cancelled"
};

const BULK_STATUS_KEYS = Object.keys(STATUS_LABELS) as BulkOrderStatus[];

const STATUS_COLORS: Record<BulkOrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  reviewing: "bg-sky-100 text-sky-700 border-sky-200",
  quoted: "bg-indigo-100 text-indigo-700 border-indigo-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200"
};

function normalizePhoneForWhatsapp(phone: string): string {
  const digits = phone.replace(/[^0-9+]/g, "");
  return digits.startsWith("+") ? digits.slice(1) : digits;
}

function normalizePhoneForTel(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

function buildMessageBody(request: AdminBulkOrderRequest): string {
  const titles = request.requestedTitles.length ? `\n\nRequested titles:\n- ${request.requestedTitles.join("\n- ")}` : "";
  const quantity = request.quantityEstimate ? `\nEstimated quantity: ${request.quantityEstimate}` : "";
  return (
    `Assalamu alaikum ${request.contactName},` +
    "\n\n" +
    "Jazakum Allahu khairan for reaching out to Maktab Muhammadiya about a bulk order." +
    `\nOrganisation: ${request.organizationName}` +
    (request.location ? `\nLocation: ${request.location}` : "") +
    quantity +
    titles +
    "\n\nLet us know if there are any other details we should keep in mind and we will respond with the next steps soon inshaAllah."
  );
}

export function BulkOrdersManager({ requests }: BulkOrdersManagerProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<BulkOrderStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestsQuery = useQuery<AdminBulkOrderRequest[]>({
    queryKey: ["admin-bulk-orders"],
    queryFn: async () => {
      const response = await fetch("/api/admin/bulk-orders");
      const data = (await response.json()) as { requests?: AdminBulkOrderRequest[]; error?: string };
      if (!response.ok || !data.requests) {
        throw new Error(data.error ?? "Unable to load bulk orders");
      }
      return data.requests;
    },
    initialData: requests,
    staleTime: 15_000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always"
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; status: BulkOrderStatus }) => {
      const response = await fetch("/api/admin/bulk-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to update status");
      }
      return payload;
    },
    onMutate: async ({ id, status }) => {
      setUpdatingId(id);
      setErrorMessage(null);
      await queryClient.cancelQueries({ queryKey: ["admin-bulk-orders"] });
      const previous = queryClient.getQueryData<AdminBulkOrderRequest[]>(["admin-bulk-orders"]);
      if (previous) {
        queryClient.setQueryData<AdminBulkOrderRequest[]>(["admin-bulk-orders"], (old = []) =>
          old.map((request) => (request.id === id ? { ...request, status } : request))
        );
      }
      return { previous };
    },
    onError: (error, _payload, context) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update status");
      if (context?.previous) {
        queryClient.setQueryData(["admin-bulk-orders"], context.previous);
      }
    },
    onSuccess: ({ id, status }) => {
      queryClient.setQueryData<AdminBulkOrderRequest[]>(["admin-bulk-orders"], (current = []) =>
        current.map((request) =>
          request.id === id ? { ...request, status, updatedAt: new Date().toISOString() } : request
        )
      );
    },
    onSettled: () => {
      setUpdatingId(null);
    }
  });

  const filteredRequests = useMemo(() => {
    const list = requestsQuery.data ?? [];
    const needle = searchTerm.trim().toLowerCase();
    const byStatus = statusFilter === "all" ? list : list.filter((request) => request.status === statusFilter);
    if (!needle) return byStatus;
    return byStatus.filter((request) => {
      const haystack = [
        request.organizationName,
        request.contactName,
        request.contactEmail,
        request.contactPhone,
        request.location,
        request.requestedTitles.join(" ")
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [requestsQuery.data, statusFilter, searchTerm]);

  const totalPending = useMemo(() => {
    const list = requestsQuery.data ?? [];
    return list.filter((request) => request.status === "pending").length;
  }, [requestsQuery.data]);

  const statusSummary = useMemo(() => {
    const list = requestsQuery.data ?? [];
    return BULK_STATUS_KEYS.reduce<Record<BulkOrderStatus, number>>((acc, key) => {
      acc[key] = list.filter((request) => request.status === key).length;
      return acc;
    },
    {
      pending: 0,
      reviewing: 0,
      quoted: 0,
      completed: 0,
      cancelled: 0
    });
  }, [requestsQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/admin/bulk-orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to delete bulk order");
      }
      return id;
    },
    onMutate: async (id) => {
      setDeletingId(id);
      setErrorMessage(null);
      await queryClient.cancelQueries({ queryKey: ["admin-bulk-orders"] });

      const previous = queryClient.getQueryData<AdminBulkOrderRequest[]>(["admin-bulk-orders"]);
      if (previous) {
        queryClient.setQueryData<AdminBulkOrderRequest[]>(["admin-bulk-orders"], (old = []) =>
          old.filter((request) => request.id !== id)
        );
      }

      return { previous };
    },
    onError: (error, _variables, context) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete bulk order");
      if (context?.previous) {
        queryClient.setQueryData(["admin-bulk-orders"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bulk-orders"], exact: true }).catch(() => {
        /* ignore background refetch errors */
      });
    },
    onSettled: () => {
      setDeletingId(null);
    }
  });

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this bulk order request? This action cannot be undone."
    );
    if (!confirmed) return;
    deleteMutation.mutate(id);
  };

  if ((requestsQuery.data ?? []).length === 0) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">No bulk order requests yet</h2>
        <p className="mt-2 text-sm text-gray-600">
          When institutions use the public bulk order form their messages will appear here for quick follow-up.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        <div className="min-w-[155px] rounded-xl border border-gray-200 bg-white p-3 shadow-sm shadow-primary/5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Total requests</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{requestsQuery.data?.length ?? 0}</p>
          <p className="text-[11px] text-gray-500">Pending: {totalPending}</p>
        </div>
        {BULK_STATUS_KEYS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter((current) => (current === status ? "all" : status))}
            className={`min-w-[140px] rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 hover:-translate-y-0.5 hover:shadow-md ${
              statusFilter === status ? "ring-2 ring-primary/40" : ""
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{STATUS_LABELS[status]}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{statusSummary[status]}</p>
            <p className="text-[11px] text-gray-500">{statusFilter === status ? "Showing all" : "Tap to filter"}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="bulk-order-status-filter" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Status
          </label>
          <select
            id="bulk-order-status-filter"
            className="rounded-full border border-gray-300 bg-white px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as BulkOrderStatus | "all")}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="bulk-order-search" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Search
          </label>
          <div className="flex w-full max-w-xs items-center rounded-full border border-gray-300 bg-white pl-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
            <span aria-hidden="true" className="text-xs text-gray-400">
              🔍
            </span>
            <input
              id="bulk-order-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Filter by organisation or contact"
              className="w-full rounded-full border-0 bg-transparent px-2 py-1.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
            {searchTerm ? (
              <button
                type="button"
                className="px-2 text-[11px] font-semibold uppercase tracking-wide text-primary"
                onClick={() => setSearchTerm("")}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-3 lg:hidden">
        {filteredRequests.length ? filteredRequests.map((request) => {
          const messageBody = buildMessageBody(request);
          const whatsappHref = request.contactPhone
            ? `https://wa.me/${encodeURIComponent(normalizePhoneForWhatsapp(request.contactPhone))}?text=${encodeURIComponent(messageBody)}`
            : null;
          const emailHref = `mailto:${encodeURIComponent(request.contactEmail)}?subject=${encodeURIComponent(
            `Bulk order follow-up from Maktab Muhammadiya`
          )}&body=${encodeURIComponent(messageBody)}`;
          const smsHref = request.contactPhone
            ? `sms:${normalizePhoneForTel(request.contactPhone)}?body=${encodeURIComponent(messageBody)}`
            : null;

          return (
            <article
              key={request.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-primary/5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{request.organizationName}</h3>
                  <p className="text-sm text-gray-600">Contact: {request.contactName}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_COLORS[request.status]}`}
                >
                  {STATUS_LABELS[request.status]}
                </span>
              </div>

              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold text-gray-900">Email:</span>{" "}
                  <a href={`mailto:${request.contactEmail}`} className="text-primary hover:underline">
                    {request.contactEmail}
                  </a>
                </p>
                {request.contactPhone ? (
                  <p>
                    <span className="font-semibold text-gray-900">Phone:</span>{" "}
                    <a href={`tel:${normalizePhoneForTel(request.contactPhone)}`} className="text-primary hover:underline">
                      {request.contactPhone}
                    </a>
                  </p>
                ) : null}
                {request.location ? (
                  <p>
                    <span className="font-semibold text-gray-900">Location:</span> {request.location}
                  </p>
                ) : null}
                {request.quantityEstimate ? (
                  <p>
                    <span className="font-semibold text-gray-900">Estimated quantity:</span> {request.quantityEstimate}
                  </p>
                ) : null}
                {request.budgetRange ? (
                  <p>
                    <span className="font-semibold text-gray-900">Budget range:</span> {request.budgetRange}
                  </p>
                ) : null}
                {request.requestedTitles.length ? (
                  <div>
                    <p className="font-semibold text-gray-900">Requested titles</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-600">
                      {request.requestedTitles.map((title) => (
                        <li key={title}>{title}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {request.notes ? (
                  <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{request.notes}</p>
                ) : null}
                <p className="text-xs text-gray-500">
                  Submitted: {new Date(request.submittedAt).toLocaleString()}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 sm:flex-1 sm:min-w-[130px]"
                  >
                    WhatsApp
                  </a>
                ) : null}
                <a
                  href={emailHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary px-3 py-1.5 text-sm font-semibold text-primary transition hover:border-primary/80 hover:bg-primary/10 sm:flex-1 sm:min-w-[130px]"
                >
                  Email
                </a>
                {smsHref ? (
                  <a
                    href={smsHref}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 sm:flex-1 sm:min-w-[130px]"
                  >
                    SMS
                  </a>
                ) : null}
              </div>

              <div className="mt-4">
                <label htmlFor={`status-${request.id}`} className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Update status
                </label>
                <select
                  id={`status-${request.id}`}
                  className="mt-1 w-full rounded-full border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={request.status}
                  onChange={(event) =>
                    updateMutation.mutate({ id: request.id, status: event.target.value as BulkOrderStatus })
                  }
                  disabled={updatingId === request.id}
                >
                  {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleDelete(request.id)}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deletingId === request.id}
                >
                  {deletingId === request.id ? "Removing…" : "Delete request"}
                </button>
              </div>
            </article>
          );
        }) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            No requests match your filters.
          </div>
        )}
      </div>

      <div className="hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">Organisation</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">Contact</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">Details</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">Requested</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">Status</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">Submitted</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-600">Quick actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredRequests.length ? filteredRequests.map((request) => {
                const messageBody = buildMessageBody(request);
                const whatsappHref = request.contactPhone
                  ? `https://wa.me/${encodeURIComponent(normalizePhoneForWhatsapp(request.contactPhone))}?text=${encodeURIComponent(messageBody)}`
                  : null;
                const emailHref = `mailto:${encodeURIComponent(request.contactEmail)}?subject=${encodeURIComponent(
                  `Bulk order follow-up from Maktab Muhammadiya`
                )}&body=${encodeURIComponent(messageBody)}`;
                const smsHref = request.contactPhone
                  ? `sms:${normalizePhoneForTel(request.contactPhone)}?body=${encodeURIComponent(messageBody)}`
                  : null;

                return (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-semibold text-gray-900">{request.organizationName}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{request.contactName}</p>
                        <a href={`mailto:${request.contactEmail}`} className="text-primary hover:underline">
                          {request.contactEmail}
                        </a>
                        {request.contactPhone ? (
                          <a href={`tel:${normalizePhoneForTel(request.contactPhone)}`} className="block text-sm text-primary hover:underline">
                            {request.contactPhone}
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {request.location ? <p>Location: {request.location}</p> : null}
                      {request.quantityEstimate ? <p>Quantity: {request.quantityEstimate}</p> : null}
                      {request.budgetRange ? <p>Budget: {request.budgetRange}</p> : null}
                      {request.notes ? <p className="mt-2 text-xs text-gray-500">Notes: {request.notes}</p> : null}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {request.requestedTitles.length ? (
                        <ul className="list-disc space-y-1 pl-5">
                          {request.requestedTitles.map((title) => (
                            <li key={title}>{title}</li>
                          ))}
                        </ul>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      <select
                        className="rounded-full border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={request.status}
                        onChange={(event) =>
                          updateMutation.mutate({ id: request.id, status: event.target.value as BulkOrderStatus })
                        }
                        disabled={updatingId === request.id}
                      >
                        {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {new Date(request.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {whatsappHref ? (
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-600"
                          >
                            WhatsApp
                          </a>
                        ) : null}
                        <a
                          href={emailHref}
                          className="inline-flex items-center rounded-full border border-primary px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:border-primary/80 hover:bg-primary/10"
                        >
                          Email
                        </a>
                        {smsHref ? (
                          <a
                            href={smsHref}
                            className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                          >
                            SMS
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDelete(request.id)}
                          className="inline-flex items-center rounded-full border border-rose-200 px-2.5 py-1 text-[11px] font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={deletingId === request.id}
                        >
                          {deletingId === request.id ? "Removing…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                    No requests match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
