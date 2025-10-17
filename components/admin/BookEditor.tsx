"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getSupabaseClient } from "@/lib/supabaseClient";
import type { AdminBook, CategorySummary, CreateOrUpdateBookPayload, UploadUrlResponse } from "@/lib/types";

const formSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  author: z.string().min(3),
  publisher: z.string().optional(),
  format: z.string().min(2),
  pageCount: z.coerce.number().int().positive(),
  language: z.string().min(2),
  isbn: z.string().optional(),
  priceCents: z.coerce.number().int().min(0),
  summary: z.string().min(10),
  description: z.string().min(20),
  categoryId: z.string().uuid(),
  coverPath: z.string().optional(),
  highlights: z.string().optional(),
  isFeatured: z.boolean().optional()
});

type FormValues = z.infer<typeof formSchema>;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const mapBookToFormValues = (book: AdminBook, fallbackCategoryId: string): FormValues => ({
  title: book.title,
  slug: book.slug,
  author: book.author,
  publisher: book.publisher ?? "",
  format: book.format,
  pageCount: book.pageCount,
  language: book.language,
  isbn: book.isbn ?? "",
  priceCents: book.priceCents,
  summary: book.summary,
  description: book.description,
  categoryId: book.categoryId ?? fallbackCategoryId,
  coverPath: book.coverPath ?? "",
  highlights: book.highlights.length ? book.highlights.join("\n") : "",
  isFeatured: book.isFeatured ?? false
});

interface BookEditorProps {
  categories: CategorySummary[];
  book?: AdminBook | null;
  onCancel?: () => void;
  onSuccess?: (book: AdminBook) => void;
}

export function BookEditor({ categories, book, onCancel, onSuccess }: BookEditorProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const hasCategories = categories.length > 0;
  const defaultCategoryId = categories[0]?.id ?? "";

  const defaultFormValues = useMemo<FormValues>(
    () => ({
      title: "",
      slug: "",
      author: "",
      publisher: "",
      format: "Hardback",
      pageCount: 0,
      language: "English",
      isbn: "",
      priceCents: 0,
      summary: "",
      description: "",
      categoryId: defaultCategoryId,
      coverPath: "",
      highlights: "",
      isFeatured: false
    }),
    [defaultCategoryId]
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues
  });

  const coverPathValue = watch("coverPath");
  const titleValue = watch("title");
  const slugValue = watch("slug");
  const disableSubmit = status === "saving" || uploading || !hasCategories;

  const isEditing = Boolean(book);
  const currentCoverUrl = book?.coverUrl ?? null;

  useEffect(() => {
    if (book) {
      reset(mapBookToFormValues(book, defaultCategoryId));
    } else {
      reset(defaultFormValues);
    }
    setStatus("idle");
    setError(null);
  }, [book, defaultCategoryId, defaultFormValues, reset]);

  useEffect(() => {
    if (!book && titleValue && !slugValue) {
      setValue("slug", slugify(titleValue), { shouldDirty: true });
    }
  }, [book, titleValue, slugValue, setValue]);

  const onSubmit = async (values: FormValues) => {
    setStatus("saving");
    setError(null);

    const highlights = values.highlights
      ? values.highlights
          .split("\n")
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [];

    const payload: CreateOrUpdateBookPayload = {
      ...(book ? { id: book.id } : {}),
      title: values.title,
      slug: values.slug,
      author: values.author,
      publisher: values.publisher?.length ? values.publisher : undefined,
      format: values.format,
      pageCount: values.pageCount,
      language: values.language,
      isbn: values.isbn?.length ? values.isbn : undefined,
      priceCents: values.priceCents,
      summary: values.summary,
      description: values.description,
      categoryId: values.categoryId,
      coverPath: values.coverPath?.length ? values.coverPath : null,
      highlights,
      isFeatured: values.isFeatured ?? false
    };

    const response = await fetch("/api/admin/books", {
      method: book ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await response.json();

    if (!response.ok) {
      setError((json as { error?: string })?.error ?? "Unable to save book");
      setStatus("error");
      return;
    }

    const saved = (json as { book: AdminBook }).book;
    setStatus("success");
    onSuccess?.(saved);
    if (book) {
      reset(mapBookToFormValues(saved, defaultCategoryId));
    } else {
      reset(defaultFormValues);
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-books"] });
    setTimeout(() => setStatus("idle"), 1500);
    return saved;
  };

  const handleCoverChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        fileName: file.name,
        fileType: file.type,
        fileSize: String(file.size)
      });
      const response = await fetch(`/api/admin/upload-url?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error((payload as { error?: string })?.error ?? "Failed to prepare upload");
      }
      const data = payload as UploadUrlResponse;

      const supabase = getSupabaseClient();
      const { error: uploadError } = await supabase.storage
        .from(data.bucket)
        .uploadToSignedUrl(data.path, data.token, file, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      setValue("coverPath", `${data.bucket}/${data.path}`, { shouldDirty: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload cover");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? `Edit “${book?.title ?? "book"}”` : "Add a new book"}
          </h2>
          <p className="text-sm text-gray-600">
            {isEditing
              ? "Update metadata, pricing, and highlights for this title."
              : "Complete the metadata and upload a cover image to publish a title."}
          </p>
        </div>
        {isEditing ? (
          <button
            type="button"
            onClick={onCancel}
            className="self-start rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            Cancel editing
          </button>
        ) : null}
      </header>
      {!hasCategories ? (
        <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Add at least one category before creating new books. Once a category exists you can save titles here.
        </p>
      ) : null}
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            {...register("title")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title.message}</p> : null}
          <input type="hidden" {...register("coverPath")} />
        </div>

        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            {...register("slug")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.slug ? <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p> : null}
        </div>

        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="author">
            Author
          </label>
          <input
            id="author"
            {...register("author")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.author ? <p className="mt-1 text-xs text-red-600">{errors.author.message}</p> : null}
        </div>

        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="publisher">
            Publisher
          </label>
          <input
            id="publisher"
            {...register("publisher")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.publisher ? <p className="mt-1 text-xs text-red-600">{errors.publisher.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="format">
            Format
          </label>
          <input
            id="format"
            {...register("format")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.format ? <p className="mt-1 text-xs text-red-600">{errors.format.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="pageCount">
            Page count
          </label>
          <input
            id="pageCount"
            type="number"
            {...register("pageCount")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.pageCount ? <p className="mt-1 text-xs text-red-600">{errors.pageCount.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="language">
            Language
          </label>
          <input
            id="language"
            {...register("language")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.language ? <p className="mt-1 text-xs text-red-600">{errors.language.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="isbn">
            ISBN
          </label>
          <input
            id="isbn"
            {...register("isbn")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.isbn ? <p className="mt-1 text-xs text-red-600">{errors.isbn.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="priceCents">
            Price (in pennies)
          </label>
          <input
            id="priceCents"
            type="number"
            {...register("priceCents")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.priceCents ? <p className="mt-1 text-xs text-red-600">{errors.priceCents.message}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="summary">
            Summary
          </label>
          <textarea
            id="summary"
            rows={2}
            {...register("summary")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.summary ? <p className="mt-1 text-xs text-red-600">{errors.summary.message}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register("description")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="categoryId">
            Category
          </label>
          <select
            id="categoryId"
            {...register("categoryId")}
            disabled={!hasCategories}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {hasCategories && errors.categoryId ? (
            <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>
          ) : null}
          {!hasCategories ? (
            <p className="mt-1 text-xs text-amber-600">Create a category in Supabase to enable this field.</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="cover">
            Cover image
          </label>
          <input
            id="cover"
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">Accepted formats: JPG, PNG. Max size 5MB.</p>
          {uploading ? <p className="text-xs text-gray-500">Uploading…</p> : null}
          {coverPathValue ? (
            <p className="mt-1 text-xs text-green-600">Cover uploaded ({coverPathValue})</p>
          ) : currentCoverUrl ? (
            <p className="mt-1 text-xs text-gray-500">
              Current cover: {" "}
              <a
                href={currentCoverUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Preview image
              </a>
              {book?.coverPath ? ` (${book.coverPath})` : null}
            </p>
          ) : null}
          {errors.coverPath ? <p className="mt-1 text-xs text-red-600">{errors.coverPath.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="isFeatured">
            Featured
          </label>
          <input id="isFeatured" type="checkbox" {...register("isFeatured")} className="mr-2 align-middle" />
          <span className="text-sm text-gray-600">Showcase this title on the homepage featured carousel.</span>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="highlights">
            Highlights (one per line)
          </label>
          <textarea
            id="highlights"
            rows={3}
            {...register("highlights")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {error ? <p className="md:col-span-2 text-sm text-red-600">{error}</p> : null}
        {status === "success" ? (
          <p className="md:col-span-2 text-sm text-green-600">Book saved. The catalog has been refreshed.</p>
        ) : null}

        <div className="md:col-span-2 flex justify-end gap-3">
          {isEditing ? (
            <button
              type="button"
              onClick={() => {
                reset(defaultFormValues);
                onCancel?.();
              }}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              disabled={status === "saving" || uploading}
            >
              Start new book
            </button>
          ) : null}
          <button
            type="submit"
            disabled={disableSubmit}
            title={!hasCategories ? "Add a category first" : undefined}
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "saving" ? "Saving…" : isEditing ? "Update book" : "Save book"}
          </button>
        </div>
      </form>
    </section>
  );
}
