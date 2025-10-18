"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import type { AdminContactMessage, MessageStatus } from "@/lib/types";

interface MessagesManagerProps {
  messages: AdminContactMessage[];
}

interface UpdatePayload {
  id: string;
  status?: MessageStatus;
  adminNotes?: string | null;
  markResponded?: boolean;
}

const STATUS_LABELS: Record<MessageStatus, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
  archived: "Archived"
};

export function MessagesManager({ messages }: MessagesManagerProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | MessageStatus>("all");
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>(() => {
    const draft: Record<string, string> = {};
    for (const message of messages) {
      draft[message.id] = message.adminNotes ?? "";
    }
    return draft;
  });

  const messagesQuery = useQuery<AdminContactMessage[]>({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const response = await fetch("/api/admin/messages");
      const data = (await response.json()) as { messages?: AdminContactMessage[]; error?: string };
      if (!response.ok || !data.messages) {
        throw new Error(data.error ?? "Unable to load messages");
      }
      return data.messages;
    },
    initialData: messages
  });

  useEffect(() => {
    const currentMessages = messagesQuery.data ?? messages;
    setNotesDrafts((draft) => {
      const next = { ...draft };
      for (const message of currentMessages) {
        if (typeof next[message.id] === "undefined") {
          next[message.id] = message.adminNotes ?? "";
        }
      }
      return next;
    });
  }, [messagesQuery.data, messages]);

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdatePayload) => {
      const response = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { message?: AdminContactMessage; error?: string };
      if (!response.ok || !data.message) {
        throw new Error(data.error ?? "Unable to update message");
      }
      return data.message;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminContactMessage[] | undefined>(["admin-messages"], (current) => {
        if (!current) return [updated];
        return current.map((message) => (message.id === updated.id ? updated : message));
      });
      setNotesDrafts((draft) => ({
        ...draft,
        [updated.id]: updated.adminNotes ?? ""
      }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/messages?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to delete message");
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AdminContactMessage[] | undefined>(["admin-messages"], (current) => {
        if (!current) return [];
        return current.filter((message) => message.id !== id);
      });
      setNotesDrafts((draft) => {
        const next = { ...draft };
        delete next[id];
        return next;
      });
    }
  });

  const data = useMemo(() => {
    const all = messagesQuery.data ?? messages;
    if (filter === "all") return all;
    return all.filter((message) => message.status === filter);
  }, [filter, messages, messagesQuery.data]);

  const sorted = useMemo(
    () => data.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [data]
  );

  const handleStatusChange = (id: string, status: MessageStatus) => {
    updateMutation.mutate({ id, status });
  };

  const handleRespondedToggle = (message: AdminContactMessage) => {
    const markResponded = !message.respondedAt;
    updateMutation.mutate({ id: message.id, markResponded });
  };

  const handleNotesBlur = (id: string) => {
    const draft = notesDrafts[id] ?? "";
    updateMutation.mutate({ id, adminNotes: draft.trim().length ? draft.trim() : null });
  };

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this message? This can’t be undone.")) {
      return;
    }
    deleteMutation.mutate(id);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
          <p className="text-sm text-gray-600">Review outreach from the contact form and track responses.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="message-filter" className="text-gray-600">
            Filter
          </label>
          <select
            id="message-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | MessageStatus)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {messagesQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {(messagesQuery.error as Error).message}
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 shadow-sm">
          {filter === "all" ? "No messages yet." : "No messages match the selected status."}
        </div>
      ) : (
        <ul className="space-y-4">
          {sorted.map((message) => (
            <li key={message.id} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {message.name}
                    <span className="ml-2 align-middle text-xs font-medium text-primary">{message.email}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Received {new Date(message.createdAt).toLocaleString()}
                    {message.respondedAt ? ` · Responded ${new Date(message.respondedAt).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleRespondedToggle(message)}
                    className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    disabled={updateMutation.isPending}
                  >
                    {message.respondedAt ? "Mark unresponded" : "Mark responded"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(message.id)}
                    className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                {message.subject ? <p className="font-medium text-gray-900">Subject: {message.subject}</p> : null}
                <p className="whitespace-pre-line leading-relaxed">{message.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <p className="font-semibold text-gray-700">Status</p>
                  <select
                    value={message.status}
                    onChange={(event) => handleStatusChange(message.id, event.target.value as MessageStatus)}
                    className="rounded border border-gray-300 px-3 py-1 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={updateMutation.isPending}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {message.phone ? <p>Phone: {message.phone}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor={`notes-${message.id}`} className="text-sm font-medium text-gray-900">
                  Admin notes
                </label>
                <textarea
                  id={`notes-${message.id}`}
                  value={notesDrafts[message.id] ?? ""}
                  onChange={(event) =>
                    setNotesDrafts((draft) => ({
                      ...draft,
                      [message.id]: event.target.value
                    }))
                  }
                  onBlur={() => handleNotesBlur(message.id)}
                  rows={3}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Summarize follow-up steps or decisions."
                  disabled={updateMutation.isPending}
                />
                <p className="text-xs text-gray-500">Notes are visible only to the admin team.</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
