"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import type { AdminBlogPost, CreateOrUpdateBlogPostPayload, Json } from "@/lib/types";

interface BlogManagerProps {
  posts: AdminBlogPost[];
}

interface DraftBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: string;
  authorName: string;
  tags: string;
  metadata: string;
  published: boolean;
  publishedAt: string;
}

const createDefaultDraft = (): DraftBlogPost => ({
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImage: "",
  authorName: "",
  tags: "",
  metadata: "{}",
  published: false,
  publishedAt: ""
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function isoToLocalInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offsetMs = date.getTime() - date.getTimezoneOffset() * 60 * 1000;
  return new Date(offsetMs).toISOString().slice(0, 16);
}

function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function parseMetadata(value: string): Json {
  const trimmed = value.trim();
  if (!trimmed.length) {
    return {};
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed === null || typeof parsed !== "object") {
      throw new Error("Metadata must be a JSON object or array");
    }
    return parsed as Json;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Metadata must be valid JSON");
  }
}

export function BlogManager({ posts }: BlogManagerProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftBlogPost>(() => createDefaultDraft());
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"compose" | "manage">("compose");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const blogQuery = useQuery<AdminBlogPost[]>({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const response = await fetch("/api/admin/blog");
      const payload = (await response.json()) as { posts?: AdminBlogPost[]; error?: string };
      if (!response.ok || !payload.posts) {
        throw new Error(payload.error ?? "Failed to load blog posts");
      }
      return payload.posts;
    },
    initialData: posts
  });

  const sortedPosts = useMemo(() => {
    const list = blogQuery.data ?? posts;
    return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [blogQuery.data, posts]);

  const totalPosts = sortedPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalPosts);
  const paginatedPosts = sortedPosts.slice(startIndex, startIndex + pageSize);
  const isRefreshing = blogQuery.isFetching;

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (activeTab === "manage") {
      setPage(1);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!selectedId) {
      setDraft(createDefaultDraft());
      return;
    }
    const post = sortedPosts.find((item) => item.id === selectedId);
    if (!post) {
      setSelectedId(null);
      setDraft(createDefaultDraft());
      return;
    }
    setDraft({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      body: post.body,
      coverImage: post.coverImage ?? "",
      authorName: post.authorName ?? "",
      tags: post.tags.join(", "),
      metadata: JSON.stringify(post.metadata ?? {}, null, 2),
      published: post.published,
      publishedAt: isoToLocalInput(post.publishedAt)
    });
    setFormError(null);
  }, [selectedId, sortedPosts]);

  const resetDraft = () => {
    setSelectedId(null);
    setDraft(createDefaultDraft());
    setFormError(null);
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: CreateOrUpdateBlogPostPayload) => {
      const response = await fetch("/api/admin/blog", {
        method: payload.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { post?: AdminBlogPost; error?: string };
      if (!response.ok || !data.post) {
        throw new Error(data.error ?? "Unable to save blog post");
      }
      return data.post;
    },
    onSuccess: (post) => {
      queryClient.setQueryData<AdminBlogPost[] | undefined>(["admin-blog"], (current) => {
        if (!current) return [post];
        const exists = current.some((item) => item.id === post.id);
        if (exists) {
          return current.map((item) => (item.id === post.id ? post : item));
        }
        return [post, ...current];
      });
      setSelectedId(post.id);
      setDraft({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        body: post.body,
        coverImage: post.coverImage ?? "",
        authorName: post.authorName ?? "",
        tags: post.tags.join(", "),
        metadata: JSON.stringify(post.metadata ?? {}, null, 2),
        published: post.published,
        publishedAt: isoToLocalInput(post.publishedAt)
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to delete blog post");
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AdminBlogPost[] | undefined>(["admin-blog"], (current) => {
        if (!current) return [];
        return current.filter((item) => item.id !== id);
      });
      resetDraft();
    }
  });

  const isBusy =
    blogQuery.isLoading || upsertMutation.isPending || deleteMutation.isPending;

  const mutationError = (upsertMutation.error ?? deleteMutation.error) as Error | null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedTitle = draft.title.trim();
    const trimmedSlug = draft.slug.trim();

    if (!trimmedTitle.length) {
      setFormError("Title is required");
      return;
    }
    if (!trimmedSlug.length) {
      setFormError("Slug is required");
      return;
    }

    let metadataObject: Json;
    try {
      metadataObject = parseMetadata(draft.metadata);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Metadata must be valid JSON");
      return;
    }

    const tagsArray = draft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag, index, all) => tag.length > 0 && all.indexOf(tag) === index);

    let publishedAtIso: string | null = null;
    if (draft.published && draft.publishedAt) {
      publishedAtIso = localInputToIso(draft.publishedAt);
      if (!publishedAtIso) {
        setFormError("Published date must be a valid date/time");
        return;
      }
    }

    const payload: CreateOrUpdateBlogPostPayload = {
      ...(selectedId ? { id: selectedId } : {}),
      title: trimmedTitle,
      slug: trimmedSlug,
      excerpt: draft.excerpt.trim().length ? draft.excerpt.trim() : null,
      body: draft.body.trim(),
      coverImage: draft.coverImage.trim().length ? draft.coverImage.trim() : null,
      authorName: draft.authorName.trim().length ? draft.authorName.trim() : null,
      tags: tagsArray,
      metadata: metadataObject,
      published: draft.published,
      publishedAt: draft.published ? publishedAtIso : null
    };

    upsertMutation.mutate(payload);
  };

  const handleGenerateSlug = () => {
    if (!draft.title.trim()) return;
    const generated = slugify(draft.title);
    setDraft((prev) => ({ ...prev, slug: generated }));
  };

  const confirmAndDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this post?")) {
      return;
    }
    setFormError(null);
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-full border border-gray-200 bg-gray-100 p-1 text-sm font-semibold text-gray-600 shadow-sm">
        <button
          type="button"
          className={`flex-1 rounded-full px-4 py-2 text-center transition ${
            activeTab === "compose" ? "bg-white text-primary shadow" : "hover:text-primary"
          }`}
          onClick={() => setActiveTab("compose")}
        >
          Compose
        </button>
        <button
          type="button"
          className={`flex-1 rounded-full px-4 py-2 text-center transition ${
            activeTab === "manage" ? "bg-white text-primary shadow" : "hover:text-primary"
          }`}
          onClick={() => setActiveTab("manage")}
        >
          Manage posts
        </button>
      </div>

      {activeTab === "compose" ? (
        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedId ? "Edit blog post" : "Create a new blog post"}
              </h2>
              <p className="text-sm text-gray-600">
                Draft and schedule reflections, announcements, and knowledge pieces for the public blog.
              </p>
              {selectedId ? (
                <p className="text-xs text-gray-500">
                  Editing: <span className="font-medium text-gray-700">{draft.title || "Untitled"}</span>
                </p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  resetDraft();
                  setActiveTab("compose");
                }}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                disabled={isBusy}
              >
                New post
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("manage")}
                className="rounded border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                View posts
              </button>
            </div>
          </header>
          <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="blog-title" className="text-sm font-semibold text-gray-900">
                Title
              </label>
              <input
                id="blog-title"
                type="text"
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="blog-slug" className="flex items-center justify-between text-sm font-semibold text-gray-900">
                <span>Slug</span>
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Generate
                </button>
              </label>
              <input
                id="blog-slug"
                type="text"
                value={draft.slug}
                onChange={(event) => setDraft((prev) => ({ ...prev, slug: event.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              <p className="text-xs text-gray-500">Lowercase letters, numbers, and hyphens only.</p>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="blog-excerpt" className="text-sm font-semibold text-gray-900">
              Excerpt (optional)
            </label>
            <textarea
              id="blog-excerpt"
              rows={3}
              value={draft.excerpt}
              onChange={(event) => setDraft((prev) => ({ ...prev, excerpt: event.target.value }))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Short summary shown in listings"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="blog-body" className="text-sm font-semibold text-gray-900">
              Body
            </label>
            <textarea
              id="blog-body"
              rows={12}
              value={draft.body}
              onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Write the full article content here"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="blog-cover" className="text-sm font-semibold text-gray-900">
                Cover image path or URL (optional)
              </label>
              <input
                id="blog-cover"
                type="text"
                value={draft.coverImage}
                onChange={(event) => setDraft((prev) => ({ ...prev, coverImage: event.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="storage/bucket/path.jpg"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="blog-author" className="text-sm font-semibold text-gray-900">
                Author name (optional)
              </label>
              <input
                id="blog-author"
                type="text"
                value={draft.authorName}
                onChange={(event) => setDraft((prev) => ({ ...prev, authorName: event.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Maktab Editorial Team"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="blog-tags" className="text-sm font-semibold text-gray-900">
                Tags (comma separated)
              </label>
              <input
                id="blog-tags"
                type="text"
                value={draft.tags}
                onChange={(event) => setDraft((prev) => ({ ...prev, tags: event.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="spirituality, history"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      published: event.target.checked,
                      publishedAt: event.target.checked
                        ? prev.publishedAt || isoToLocalInput(new Date().toISOString())
                        : ""
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/60"
                />
                Published
              </label>
              <div className="space-y-1">
                <label htmlFor="blog-published-at" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Publish date (optional)
                </label>
                <input
                  id="blog-published-at"
                  type="datetime-local"
                  value={draft.publishedAt}
                  onChange={(event) => setDraft((prev) => ({ ...prev, publishedAt: event.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-100"
                  disabled={!draft.published}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="blog-metadata" className="text-sm font-semibold text-gray-900">
              Metadata JSON (optional)
            </label>
            <textarea
              id="blog-metadata"
              rows={4}
              value={draft.metadata}
              onChange={(event) => setDraft((prev) => ({ ...prev, metadata: event.target.value }))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder={`{
  "seoTitle": "..."
}`}
            />
          </div>
          {(formError || mutationError) && (
            <p className="text-sm text-red-600">{formError ?? mutationError?.message ?? "An error occurred"}</p>
          )}
          {upsertMutation.isSuccess && !formError && !mutationError ? (
            <p className="text-sm text-emerald-600">Post saved successfully.</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed"
              disabled={isBusy}
            >
              {selectedId ? "Save changes" : "Create post"}
            </button>
            {selectedId ? (
              <button
                type="button"
                  onClick={() => confirmAndDelete(selectedId)}
                className="rounded border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed"
                disabled={isBusy}
              >
                Delete
              </button>
            ) : null}
            <button
              type="button"
              onClick={resetDraft}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              disabled={isBusy}
            >
              Cancel
            </button>
          </div>
        </form>
        </section>
      ) : (
        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Existing posts</h2>
              <p className="text-sm text-gray-600">
                {totalPosts} post{totalPosts === 1 ? "" : "s"} total
                {isRefreshing ? <span className="ml-2 text-xs text-gray-400">Refreshing…</span> : null}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetDraft();
                setActiveTab("compose");
              }}
              className="rounded border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
            >
              New post
            </button>
          </header>
          {totalPosts === 0 ? (
            <div className="rounded border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
              No blog posts yet. Create your first story from the compose tab.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left">Slug</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Updated</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white text-sm text-gray-700">
                    {paginatedPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          <div className="flex flex-col">
                            <span>{post.title}</span>
                            <span className="text-xs text-gray-500">
                              {post.tags.length ? post.tags.join(", ") : "No tags"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{post.slug}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                              post.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {post.published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(post.updatedAt).toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedId(post.id);
                                setActiveTab("compose");
                              }}
                              className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmAndDelete(post.id)}
                              className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 text-sm text-gray-600">
                <p>
                  Showing {totalPosts === 0 ? 0 : startIndex + 1}–{endIndex} of {totalPosts} posts
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="self-center text-xs text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      )}
    </div>
  );
}
