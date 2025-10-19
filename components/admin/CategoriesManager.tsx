"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";

import type { CategorySummary } from "@/lib/types";

interface CategoriesManagerProps {
  categories: CategorySummary[];
}

type FormState = {
  name: string;
  slug: string;
  description: string;
};

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const defaultForm: FormState = {
  name: "",
  slug: "",
  description: ""
};

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => ({ ...defaultForm }));
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const categoriesQuery = useQuery<CategorySummary[]>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/categories");
      const payload = (await response.json()) as { categories?: CategorySummary[]; error?: string };
      if (!response.ok || !payload.categories) {
        throw new Error(payload.error ?? "Failed to load categories");
      }
      return payload.categories;
    },
    initialData: categories
  });

  const sortedCategories = useMemo(() => {
    const data = categoriesQuery.data ?? categories;
    return [...data].sort((a, b) => a.name.localeCompare(b.name));
  }, [categoriesQuery.data, categories]);

  const createMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { category?: CategorySummary; error?: string };
      if (!response.ok || !data.category) {
        throw new Error(data.error ?? "Unable to create category");
      }
      return data.category;
    },
    onSuccess: (category) => {
      queryClient.setQueryData<CategorySummary[] | undefined>(["admin-categories"], (current) => {
        const next = current ? [...current] : [];
        const index = next.findIndex((item) => item.id === category.id);
        if (index >= 0) {
          next[index] = category;
        } else {
          next.push(category);
        }
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      setForm({ ...defaultForm });
      setSuccessMessage(`Category “${category.name}” created successfully.`);
      setFormError(null);
    },
    onError: (error) => {
      setSuccessMessage(null);
      setFormError(error instanceof Error ? error.message : "Failed to create category");
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const trimmedName = form.name.trim();
    const trimmedSlug = form.slug.trim();

    if (!trimmedName.length) {
      setFormError("Name is required");
      return;
    }
    if (!trimmedSlug.length) {
      setFormError("Slug is required");
      return;
    }

    createMutation.mutate({
      name: trimmedName,
      slug: trimmedSlug,
      description: form.description.trim()
    });
  };

  const isSubmitting = createMutation.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px),1fr]">
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Create a category</h2>
          <p className="text-sm text-gray-600">Define a new catalog category for organising books.</p>
        </header>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="category-name" className="text-sm font-semibold text-gray-900">
              Name
            </label>
            <input
              id="category-name"
              type="text"
              value={form.name}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({ ...prev, name: value }));
              }}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="E.g. Seerah, Hadith"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="category-slug" className="flex items-center justify-between text-sm font-semibold text-gray-900">
              <span>Slug</span>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    slug: prev.name ? slugify(prev.name) : prev.slug
                  }))
                }
                className="text-xs font-semibold text-primary hover:underline"
              >
                Generate
              </button>
            </label>
            <input
              id="category-slug"
              type="text"
              value={form.slug}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  slug: slugify(event.target.value)
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="lowercase-with-hyphens"
              required
            />
            <p className="text-xs text-gray-500">Lowercase letters, numbers, and hyphens only.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="category-description" className="text-sm font-semibold text-gray-900">
              Description (optional)
            </label>
            <textarea
              id="category-description"
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Brief summary for admins"
            />
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}
          <button
            type="submit"
            className="w-full rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-75"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating…" : "Create category"}
          </button>
        </form>
      </section>
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Existing categories</h2>
            <p className="text-sm text-gray-600">
              {sortedCategories.length} categor{sortedCategories.length === 1 ? "y" : "ies"} available
              {categoriesQuery.isFetching ? <span className="ml-2 text-xs text-gray-400">Refreshing…</span> : null}
            </p>
          </div>
        </header>
        {sortedCategories.length === 0 ? (
          <div className="rounded border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
            No categories yet. Create one using the form.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Slug</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-sm text-gray-700">
                {sortedCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{category.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{category.slug}</code>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {category.description?.length ? category.description : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {category.updatedAt
                        ? new Date(category.updatedAt).toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
