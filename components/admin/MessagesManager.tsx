"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { SVGProps } from "react";

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

  const getPrimaryName = (fullName: string) => {
    const parts = fullName.trim().split(" ").filter(Boolean);
    return parts.length ? parts[0] : fullName;
  };

  const buildEmailSubject = (subject: string | null) =>
    subject && subject.trim().length ? `Re: ${subject.trim()}` : "Regarding your message to Maktab Muhammadiya";

  const buildEmailBody = (name: string, originalMessage: string) =>
    `Assalamu alaykum ${getPrimaryName(name)},

JazakAllahu khayran for reaching out to Maktab Muhammadiya.

> ${originalMessage.replace(/\r?\n/g, "\n> ")}

`;

  const buildWhatsappMessage = (name: string, originalMessage: string) =>
    `Assalamu alaykum ${getPrimaryName(name)},

We received your message:
"${originalMessage}"

How can we assist you further?`;

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

              <QuickActions
                message={message}
                buildEmailSubject={buildEmailSubject}
                buildEmailBody={buildEmailBody}
                buildWhatsappMessage={buildWhatsappMessage}
              />

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

interface QuickActionsProps {
  message: AdminContactMessage;
  buildEmailSubject: (subject: string | null) => string;
  buildEmailBody: (name: string, originalMessage: string) => string;
  buildWhatsappMessage: (name: string, originalMessage: string) => string;
}

function QuickActions({ message, buildEmailSubject, buildEmailBody, buildWhatsappMessage }: QuickActionsProps) {
  const normalizedPhone = message.phone ? message.phone.replace(/[^\d]/g, "") : null;
  const hasPhone = Boolean(normalizedPhone && normalizedPhone.length >= 8);
  const firstName = message.name.trim().split(/\s+/)[0] || message.name;

  const emailSubject = buildEmailSubject(message.subject ?? null);
  const emailBody = buildEmailBody(message.name, message.message);
  const mailParams = new URLSearchParams();
  mailParams.set("subject", emailSubject);
  mailParams.set("body", emailBody);
  const emailHref = `mailto:${message.email}?${mailParams.toString()}`;

  const messageParams = new URLSearchParams();
  messageParams.set("body", `Assalamu alaykum ${firstName}, we received your message.`);
  const smsHref = hasPhone ? `sms:${normalizedPhone}?${messageParams.toString()}` : null;

  const whatsappHref = hasPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(buildWhatsappMessage(message.name, message.message))}`
    : null;

  const actions: ActionLinkProps[] = [
    {
      label: "Email",
      description: `Reply to ${message.name} via email`,
      href: emailHref,
      Icon: IconMail
    },
    {
      label: "Message",
      description: `Send an SMS to ${message.name}`,
      href: smsHref,
      Icon: IconMessage
    },
    {
      label: "WhatsApp",
      description: hasPhone ? `Open WhatsApp chat with ${message.name}` : "WhatsApp number unavailable",
      href: whatsappHref,
      Icon: IconWhatsapp
    }
  ];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      {actions.map((action) => (
        <ActionLink key={action.label} {...action} />
      ))}
    </div>
  );
}

interface ActionLinkProps {
  label: string;
  description: string;
  href: string | null;
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}

function ActionLink({ label, description, href, Icon }: ActionLinkProps) {
  const className =
    "group flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 font-medium text-gray-600 transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary";

  if (!href) {
    return (
      <span className={`${className} cursor-not-allowed opacity-60`} aria-label={`${description} (unavailable)`}>
        <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-400">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={description}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      {label}
    </a>
  );
}

function IconMail(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function IconMessage(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 01-2 2H9l-4 4v-4H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2z" />
      <path d="M7 9h10M7 13h6" />
    </svg>
  );
}

function IconWhatsapp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3.8 20.2l1.1-4.1a7.5 7.5 0 111.4 1.4z" />
      <path d="M14.8 13.4a2.8 2.8 0 01-1.3.4 2.9 2.9 0 01-1.4-.4c-.8-.5-1.5-1.1-2-1.9-.4-.7-.7-1.3-.6-1.7.1-.4.3-.8.7-1.1.2-.2.3-.3.3-.5.2-.3.2-.5.1-.8l-.5-1.3c-.1-.3-.4-.5-.7-.5-.3 0-.5.1-.8.3-.7.4-1.1 1.1-1.2 1.9-.1.8.3 1.9 1 3.2.7 1.2 1.6 2.3 2.7 3 1.1.7 2.1 1.1 3 1 .8-.1 1.4-.4 1.8-1.1.2-.2.3-.5.3-.8 0-.4-.2-.6-.5-.7l-1.3-.5c-.3-.1-.5-.1-.8.1-.1.1-.3.2-.4.3-.2.3-.5.6-.9.7" />
    </svg>
  );
}
