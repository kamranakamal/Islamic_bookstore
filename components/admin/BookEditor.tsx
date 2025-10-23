"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import clsx from "clsx";
import Image from "next/image";

import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  BOOK_LANGUAGES,
  getBookLanguageLabel,
  type AdminBook,
  type BookLanguage,
  type CategorySummary,
  type CreateOrUpdateBookPayload,
  type UploadUrlResponse
} from "@/lib/types";

const LANGUAGE_OPTIONS = BOOK_LANGUAGES.map((value) => ({ value, label: getBookLanguageLabel(value) }));

const DEFAULT_FORMAT_OPTIONS = ["Hardcover", "Paperback", "Softcover", "Digital", "Audio"] as const;

const buildPublicImageUrl = (path: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return "/logo.svg";
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const separator = path.includes("?") ? "&" : "?";
  return `${normalizedBase}/storage/v1/object/public/${path}${separator}width=400&quality=80`;
};

const formSchema = z.object({
  title: z.string().min(3),
  author: z.string().min(3),
  availableFormats: z.array(z.string().min(1)).min(1, { message: "Select at least one format." }),
  availableLanguages: z
    .array(z.enum(["arabic", "urdu", "roman_urdu", "english", "hindi"]))
    .min(1, { message: "Select at least one language." }),
  pageCount: z.coerce.number().int().positive(),
  stockQuantity: z.coerce.number().int().min(0),
  priceLocalInr: z.coerce.number().min(0),
  priceInternationalUsd: z.coerce.number().min(0),
  description: z.string().min(20),
  categoryId: z.string().uuid(),
  coverPath: z.string().optional(),
  galleryPaths: z.array(z.string().min(1)).default([]),
  isFeatured: z.boolean().optional()
});

type FormValues = z.infer<typeof formSchema>;

const mapBookToFormValues = (book: AdminBook, fallbackCategoryId: string): FormValues => ({
  title: book.title,
  author: book.author,
  availableFormats: book.availableFormats ?? [],
  availableLanguages: book.availableLanguages ?? [],
  pageCount: book.pageCount,
  stockQuantity: book.stockQuantity,
  priceLocalInr: book.priceLocalInr,
  priceInternationalUsd: book.priceInternationalUsd,
  description: book.description,
  categoryId: book.categoryId ?? fallbackCategoryId,
  coverPath: book.coverPath ?? "",
  galleryPaths: book.galleryPaths ?? [],
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
  const [galleryUploading, setGalleryUploading] = useState(false);

  const hasCategories = categories.length > 0;
  const defaultCategoryId = categories[0]?.id ?? "";

  const formatOptions = useMemo(() => {
    const base = new Set<string>(DEFAULT_FORMAT_OPTIONS);
    for (const entry of book?.availableFormats ?? []) {
      if (entry) {
        base.add(entry);
      }
    }
    return Array.from(base);
  }, [book?.availableFormats]);

  const defaultFormValues = useMemo<FormValues>(
    () => ({
      title: "",
      author: "",
      availableFormats: [],
      availableLanguages: [],
      pageCount: 0,
      stockQuantity: 0,
      priceLocalInr: 0,
      priceInternationalUsd: 0,
      description: "",
      categoryId: defaultCategoryId,
      coverPath: "",
      galleryPaths: [],
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
    getValues,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues
  });

  useEffect(() => {
    register("availableFormats");
    register("availableLanguages");
    register("galleryPaths");
  }, [register]);

  const coverPathValue = watch("coverPath");
  const titleValue = watch("title") ?? book?.title ?? "";
  const galleryPaths = watch("galleryPaths") ?? [];
  const selectedFormats = watch("availableFormats") ?? [];
  const selectedLanguages = watch("availableLanguages") ?? [];
  const disableSubmit = status === "saving" || uploading || galleryUploading || !hasCategories;

  const isEditing = Boolean(book);
  const currentCoverUrl = book?.coverUrl ?? null;
  const coverPreviewUrl = coverPathValue?.length ? buildPublicImageUrl(coverPathValue) : currentCoverUrl;

  useEffect(() => {
    if (book) {
      reset(mapBookToFormValues(book, defaultCategoryId));
    } else {
      reset(defaultFormValues);
    }
    setStatus("idle");
    setError(null);
  }, [book, defaultCategoryId, defaultFormValues, reset]);

  const toggleFormat = useCallback(
    (format: string) => {
      const current = getValues("availableFormats") ?? [];
      const next = current.includes(format)
        ? current.filter((item) => item !== format)
        : [...current, format];
      setValue("availableFormats", next, { shouldDirty: true, shouldValidate: true });
    },
    [getValues, setValue]
  );

  const toggleLanguage = useCallback(
    (language: BookLanguage) => {
      const current = getValues("availableLanguages") ?? [];
      const next = current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language];
      setValue("availableLanguages", next, { shouldDirty: true, shouldValidate: true });
    },
    [getValues, setValue]
  );

  type StorageBucketAlias = "cover" | "gallery";

  const uploadImageFile = async (file: File, bucket: StorageBucketAlias): Promise<string> => {
    const params = new URLSearchParams({
      fileName: file.name,
      fileType: file.type,
      fileSize: String(file.size)
    });
    params.set("bucket", bucket);
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
      throw new Error((uploadError as { message?: string })?.message ?? "Failed to upload image");
    }

    return `${data.bucket}/${data.path}`;
  };

  const onSubmit = async (values: FormValues) => {
    setStatus("saving");
    setError(null);

    const payload: CreateOrUpdateBookPayload = {
      ...(book ? { id: book.id } : {}),
      title: values.title.trim(),
      author: values.author.trim(),
      availableFormats: values.availableFormats,
      availableLanguages: values.availableLanguages,
      pageCount: values.pageCount,
      stockQuantity: values.stockQuantity,
      priceLocalInr: values.priceLocalInr,
      priceInternationalUsd: values.priceInternationalUsd,
      description: values.description.trim(),
      categoryId: values.categoryId,
      coverPath: values.coverPath?.length ? values.coverPath : null,
      galleryPaths: values.galleryPaths ?? [],
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
  const path = await uploadImageFile(file, "cover");
      setValue("coverPath", path, { shouldDirty: true });
      const gallery = getValues("galleryPaths") ?? [];
      if (!gallery.includes(path)) {
        setValue("galleryPaths", [path, ...gallery], { shouldDirty: true, shouldValidate: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload cover");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setGalleryUploading(true);
    setError(null);

    try {
      const uploadedPaths: string[] = [];
      for (const file of Array.from(files)) {
  const path = await uploadImageFile(file, "gallery");
        uploadedPaths.push(path);
      }

      const current = getValues("galleryPaths") ?? [];
      const merged = [...current];
      for (const path of uploadedPaths) {
        if (!merged.includes(path)) {
          merged.push(path);
        }
      }

      setValue("galleryPaths", merged, { shouldDirty: true, shouldValidate: true });

      if (!getValues("coverPath") && uploadedPaths[0]) {
        setValue("coverPath", uploadedPaths[0], { shouldDirty: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload gallery images");
    } finally {
      setGalleryUploading(false);
      event.target.value = "";
    }
  };

  const removeGalleryImage = useCallback(
    (index: number) => {
      const current = getValues("galleryPaths") ?? [];
      if (!current[index]) return;
      const [removed] = current.splice(index, 1);
      setValue("galleryPaths", [...current], { shouldDirty: true, shouldValidate: true });
      if (removed && removed === getValues("coverPath")) {
        setValue("coverPath", current[0] ?? "", { shouldDirty: true });
      }
    },
    [getValues, setValue]
  );

  const moveGalleryImage = useCallback(
    (index: number, direction: -1 | 1) => {
      const current = getValues("galleryPaths") ?? [];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      setValue("galleryPaths", next, { shouldDirty: true, shouldValidate: true });
    },
    [getValues, setValue]
  );

  const setCoverFromGallery = useCallback(
    (path: string) => {
      setValue("coverPath", path, { shouldDirty: true });
    },
    [setValue]
  );

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
            {isEditing ? `Edit “${book?.title ?? "book"}”` : "Add a new book"}
          </h2>
          <p className="text-sm text-gray-600">
            {isEditing
              ? "Update metadata, formats, pricing, and languages for this title."
              : "Complete the metadata, choose formats and languages, then upload a cover to publish a title."}
          </p>
        </div>
        {isEditing ? (
          <button
            type="button"
            onClick={onCancel}
            className="w-full self-start rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 md:w-auto md:py-1"
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

        <div className="md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-gray-700">Available formats</span>
          <div className="flex flex-wrap gap-2">
            {formatOptions.map((format) => {
              const isSelected = selectedFormats.includes(format);
              return (
                <button
                  type="button"
                  key={format}
                  onClick={() => toggleFormat(format)}
                  className={clsx(
                    "rounded-full border px-3 py-1 text-sm transition",
                    isSelected
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-gray-300 bg-white text-gray-700 hover:border-primary hover:text-primary"
                  )}
                  aria-pressed={isSelected}
                >
                  {format}
                </button>
              );
            })}
          </div>
          {errors.availableFormats ? (
            <p className="mt-1 text-xs text-red-600">{errors.availableFormats.message}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">Tap to toggle the formats this title supports.</p>
          )}
        </div>

        <div className="md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-gray-700">Available languages</span>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = selectedLanguages.includes(option.value);
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => toggleLanguage(option.value)}
                  className={clsx(
                    "rounded-full border px-3 py-1 text-sm transition",
                    isSelected
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-gray-300 bg-white text-gray-700 hover:border-primary hover:text-primary"
                  )}
                  aria-pressed={isSelected}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {errors.availableLanguages ? (
            <p className="mt-1 text-xs text-red-600">{errors.availableLanguages.message}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">Tap to select the languages this title is offered in.</p>
          )}
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
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="stockQuantity">
            Stock quantity
          </label>
          <input
            id="stockQuantity"
            type="number"
            {...register("stockQuantity")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.stockQuantity ? <p className="mt-1 text-xs text-red-600">{errors.stockQuantity.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="priceLocalInr">
            Price – Local (INR)
          </label>
          <input
            id="priceLocalInr"
            type="number"
            step="0.01"
            {...register("priceLocalInr")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.priceLocalInr ? (
            <p className="mt-1 text-xs text-red-600">{errors.priceLocalInr.message}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="priceInternationalUsd">
            Price – International (USD)
          </label>
          <input
            id="priceInternationalUsd"
            type="number"
            step="0.01"
            {...register("priceInternationalUsd")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.priceInternationalUsd ? (
            <p className="mt-1 text-xs text-red-600">{errors.priceInternationalUsd.message}</p>
          ) : null}
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
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="cover">
            Primary cover image
          </label>
          <input
            id="cover"
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            This image appears across the storefront and is added to the gallery automatically. Accepted formats: JPG, PNG.
          </p>
          {uploading ? <p className="text-xs text-gray-500">Uploading…</p> : null}
          {coverPreviewUrl ? (
            <div className="mt-3 flex items-center gap-4">
              <div className="relative h-24 w-20 overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
                <Image
                  src={coverPreviewUrl}
                  alt={`Current cover preview for ${titleValue || "book"}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
              <div className="text-xs text-gray-600">
                <p className="font-medium text-gray-700">Current cover preview</p>
                {coverPathValue ? (
                  <p className="mt-0.5 break-all">Stored at: {coverPathValue}</p>
                ) : book?.coverPath ? (
                  <p className="mt-0.5 break-all">Stored at: {book.coverPath}</p>
                ) : null}
                <a
                  href={coverPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex text-primary hover:underline"
                >
                  Open full preview
                </a>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-500">No cover uploaded yet.</p>
          )}
          {errors.coverPath ? <p className="mt-1 text-xs text-red-600">{errors.coverPath.message}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="gallery">
            Gallery images
          </label>
          <input
            id="gallery"
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryUpload}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            Upload additional images to showcase different angles or spreads. Use the buttons below each image to reorder or set the primary cover.
          </p>
          {galleryUploading ? <p className="mt-1 text-xs text-gray-500">Uploading gallery images…</p> : null}
          {galleryPaths.length ? (
            <ul className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {galleryPaths.map((path, index) => {
                const url = buildPublicImageUrl(path);
                const isCoverImage = coverPathValue === path;
                return (
                  <li
                    key={`${path}-${index}`}
                    className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="relative aspect-[3/4] w-full bg-gray-50">
                      <Image src={url} alt={`Gallery image ${index + 1} for ${titleValue || "book"}`} fill sizes="280px" className="object-cover" />
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 text-xs">
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 font-medium",
                          isCoverImage ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {isCoverImage ? "Primary cover" : `Image ${index + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="text-gray-500 transition hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 px-3 pb-3 text-xs">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveGalleryImage(index, -1)}
                        className={clsx(
                          "rounded border px-2 py-1 transition",
                          index === 0
                            ? "cursor-not-allowed border-gray-200 text-gray-300"
                            : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                        )}
                      >
                        Move left
                      </button>
                      <button
                        type="button"
                        disabled={index === galleryPaths.length - 1}
                        onClick={() => moveGalleryImage(index, 1)}
                        className={clsx(
                          "rounded border px-2 py-1 transition",
                          index === galleryPaths.length - 1
                            ? "cursor-not-allowed border-gray-200 text-gray-300"
                            : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                        )}
                      >
                        Move right
                      </button>
                      <button
                        type="button"
                        disabled={isCoverImage}
                        onClick={() => setCoverFromGallery(path)}
                        className={clsx(
                          "rounded border px-2 py-1 transition",
                          isCoverImage
                            ? "cursor-not-allowed border-primary bg-primary/10 text-primary"
                            : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                        )}
                      >
                        Set as cover
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-gray-500">No gallery images yet. Upload images above to build a visual set.</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="isFeatured">
            Featured
          </label>
          <input id="isFeatured" type="checkbox" {...register("isFeatured")} className="mr-2 align-middle" />
          <span className="text-sm text-gray-600">Showcase this title on the homepage featured carousel.</span>
        </div>

        {error ? <p className="md:col-span-2 text-sm text-red-600">{error}</p> : null}
        {status === "success" ? (
          <p className="md:col-span-2 text-sm text-green-600">Book saved. The catalog has been refreshed.</p>
        ) : null}

        <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
          {isEditing ? (
            <button
              type="button"
              onClick={() => {
                reset(defaultFormValues);
                onCancel?.();
              }}
              className="w-full rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 md:w-auto"
              disabled={status === "saving" || uploading}
            >
              Start new book
            </button>
          ) : null}
          <button
            type="submit"
            disabled={disableSubmit}
            title={!hasCategories ? "Add a category first" : undefined}
            className="w-full rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
          >
            {status === "saving" ? "Saving…" : isEditing ? "Update book" : "Save book"}
          </button>
        </div>
      </form>
    </section>
  );
}
