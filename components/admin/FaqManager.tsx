"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

import type { AdminFaqEntry } from "@/lib/types";

interface FaqManagerProps {
  entries: AdminFaqEntry[];
}

interface DraftFaqEntry {
  question: string;
  answer: string;
  category: string;
  position: number;
  published: boolean;
}

const defaultDraft: DraftFaqEntry = {
  question: "",
  answer: "",
  category: "",
  position: 0,
  published: true
};

export function FaqManager({ entries }: FaqManagerProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftFaqEntry>(defaultDraft);

  const faqQuery = useQuery<AdminFaqEntry[]>({
    queryKey: ["admin-faq"],
    queryFn: async () => {
      const response = await fetch("/api/admin/faq");
      const data = (await response.json()) as { entries?: AdminFaqEntry[]; error?: string };
      if (!response.ok || !data.entries) {
        throw new Error(data.error ?? "Failed to load FAQs");
      }
      return data.entries;
    },
    initialData: entries
  });

  const sortedEntries = useMemo(() => {
    const list = faqQuery.data ?? entries;
    return [...list].sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
  }, [faqQuery.data, entries]);

  useEffect(() => {
    if (!selectedId) return;
    const entry = sortedEntries.find((item) => item.id === selectedId);
    if (entry) {
      setDraft({
        question: entry.question,
        answer: entry.answer,
        category: entry.category ?? "",
        position: entry.position,
        published: entry.published
      });
    }
  }, [selectedId, sortedEntries]);

  const resetDraft = () => {
    setSelectedId(null);
    setDraft(defaultDraft);
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: DraftFaqEntry & { id?: string }) => {
      const response = await fetch("/api/admin/faq", {
        method: payload.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          category: payload.category.trim() ? payload.category.trim() : null
        })
      });
      const data = (await response.json()) as { entry?: AdminFaqEntry; error?: string };
      if (!response.ok || !data.entry) {
        throw new Error(data.error ?? "Unable to save FAQ entry");
      }
      return data.entry;
    },
    onSuccess: (entry) => {
      queryClient.setQueryData<AdminFaqEntry[] | undefined>(["admin-faq"], (current) => {
        if (!current) return [entry];
        const exists = current.some((item) => item.id === entry.id);
        if (exists) {
          return current.map((item) => (item.id === entry.id ? entry : item));
        }
        return [...current, entry];
      });
      setSelectedId(entry.id);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/faq?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to delete FAQ entry");
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AdminFaqEntry[] | undefined>(["admin-faq"], (current) => {
        if (!current) return [];
        return current.filter((item) => item.id !== id);
      });
      resetDraft();
    }
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    upsertMutation.mutate({
      id: selectedId ?? undefined,
      ...draft
    });
  };

  const isLoading = faqQuery.isLoading || upsertMutation.isPending || deleteMutation.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Questions</h2>
          <button
            type="button"
            onClick={resetDraft}
            className="text-xs font-semibold text-primary hover:underline"
            disabled={isLoading}
          >
            New
          </button>
        </div>
        <ul className="space-y-2">
          {sortedEntries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => setSelectedId(entry.id)}
                className={clsx(
                  "w-full rounded border px-3 py-2 text-left text-sm transition",
                  selectedId === entry.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 text-gray-700 hover:border-primary/60"
                )}
              >
                <span className="block font-semibold">{entry.question}</span>
                <span className="text-xs text-gray-500">
                  Pos. {entry.position} · {entry.published ? "Published" : "Draft"}
                </span>
              </button>
            </li>
          ))}
          {sortedEntries.length === 0 ? (
            <li className="rounded border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-500">
              No FAQ entries yet.
            </li>
          ) : null}
        </ul>
      </section>
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedId ? "Edit question" : "New question"}
          </h2>
          <p className="text-sm text-gray-600">Maintain frequently asked questions for the support page.</p>
        </header>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="faq-question" className="text-sm font-semibold text-gray-900">
              Question
            </label>
            <input
              id="faq-question"
              type="text"
              value={draft.question}
              onChange={(event) => setDraft((prev) => ({ ...prev, question: event.target.value }))}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="faq-answer" className="text-sm font-semibold text-gray-900">
              Answer
            </label>
            <textarea
              id="faq-answer"
              rows={6}
              value={draft.answer}
              onChange={(event) => setDraft((prev) => ({ ...prev, answer: event.target.value }))}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="faq-category" className="text-sm font-semibold text-gray-900">
                Category (optional)
              </label>
              <input
                id="faq-category"
                type="text"
                value={draft.category}
                onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="faq-position" className="text-sm font-semibold text-gray-900">
                Position
              </label>
              <input
                id="faq-position"
                type="number"
                min={0}
                value={draft.position}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, position: Number(event.target.value) || 0 }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(event) => setDraft((prev) => ({ ...prev, published: event.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/60"
            />
            Published
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {selectedId ? "Save changes" : "Create question"}
            </button>
            {selectedId ? (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && !window.confirm("Delete this FAQ entry?")) {
                    return;
                  }
                  deleteMutation.mutate(selectedId);
                }}
                className="rounded border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Delete
              </button>
            ) : null}
            <button
              type="button"
              onClick={resetDraft}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
          {(upsertMutation.error || deleteMutation.error) && (
            <p className="text-sm text-red-600">
              {(upsertMutation.error ?? deleteMutation.error)?.message ?? "An error occurred"}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
