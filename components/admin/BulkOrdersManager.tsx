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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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
    if (statusFilter === "all") return list;
    return list.filter((request) => request.status === statusFilter);
  }, [requestsQuery.data, statusFilter]);

  const totalPending = useMemo(() => {
    const list = requestsQuery.data ?? [];
    return list.filter((request) => request.status === "pending").length;
  }, [requestsQuery.data]);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {filteredRequests.length} {filteredRequests.length === 1 ? "request" : "requests"}
          </p>
          <p className="text-xs text-gray-500">Pending responses: {totalPending}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="bulk-order-status-filter" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Filter
          </label>
          <select
            id="bulk-order-status-filter"
            className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 lg:hidden">
        {filteredRequests.map((request) => {
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
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
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
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                  >
                    WhatsApp
                  </a>
                ) : null}
                <a
                  href={emailHref}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-primary px-3 py-2 text-sm font-semibold text-primary transition hover:border-primary/80 hover:bg-primary/10"
                >
                  Email
                </a>
                {smsHref ? (
                  <a
                    href={smsHref}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
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
                  className="mt-1 w-full rounded-full border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Organisation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Requested</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Submitted</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">Quick actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredRequests.map((request) => {
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
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{request.organizationName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
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
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {request.location ? <p>Location: {request.location}</p> : null}
                      {request.quantityEstimate ? <p>Quantity: {request.quantityEstimate}</p> : null}
                      {request.budgetRange ? <p>Budget: {request.budgetRange}</p> : null}
                      {request.notes ? <p className="mt-2 text-xs text-gray-500">Notes: {request.notes}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
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
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <select
                        className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(request.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {whatsappHref ? (
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600"
                          >
                            WhatsApp
                          </a>
                        ) : null}
                        <a
                          href={emailHref}
                          className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:border-primary/80 hover:bg-primary/10"
                        >
                          Email
                        </a>
                        {smsHref ? (
                          <a
                            href={smsHref}
                            className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                          >
                            SMS
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
