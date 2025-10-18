"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  organizationName: z.string().min(2, "Please provide the organization name"),
  contactName: z.string().min(2, "Let us know who to reach"),
  contactEmail: z.string().email("Enter a valid email"),
  contactPhone: z.string().max(50).optional(),
  location: z.string().max(120).optional(),
  quantityEstimate: z
    .string()
    .optional()
    .refine((value) => !value?.length || /^[0-9]+$/.test(value.trim()), {
      message: "Enter a whole number quantity"
    }),
  budgetRange: z.string().max(120).optional(),
  requestedTitles: z.string().min(5, "Please list requested titles or themes"),
  notes: z.string().optional()
});

export type BulkOrderFormValues = z.infer<typeof schema>;

export function BulkOrderForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<BulkOrderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationName: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      location: "",
      quantityEstimate: "",
      budgetRange: "",
      requestedTitles: "",
      notes: ""
    }
  });

  const onSubmit = async (values: BulkOrderFormValues) => {
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/bulk-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: values.organizationName.trim(),
          contactName: values.contactName.trim(),
          contactEmail: values.contactEmail.trim(),
          contactPhone: values.contactPhone?.trim().length ? values.contactPhone.trim() : undefined,
          location: values.location?.trim().length ? values.location.trim() : undefined,
          quantityEstimate:
            values.quantityEstimate && values.quantityEstimate.trim().length
              ? Number(values.quantityEstimate.trim())
              : null,
          budgetRange: values.budgetRange?.trim().length ? values.budgetRange.trim() : undefined,
          requestedTitles: values.requestedTitles
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean),
          notes: values.notes?.trim().length ? values.notes.trim() : undefined
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to submit request");
      }

      setStatus("success");
      reset();
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unable to submit request");
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="organizationName" className="mb-1 block text-sm font-semibold text-gray-900">
            Organisation / Institution
          </label>
          <input
            id="organizationName"
            type="text"
            {...register("organizationName")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.organizationName ? (
            <p className="mt-1 text-xs text-red-600">{errors.organizationName.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="contactName" className="mb-1 block text-sm font-semibold text-gray-900">
            Your name
          </label>
          <input
            id="contactName"
            type="text"
            {...register("contactName")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.contactName ? <p className="mt-1 text-xs text-red-600">{errors.contactName.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="contactEmail" className="mb-1 block text-sm font-semibold text-gray-900">
            Email
          </label>
          <input
            id="contactEmail"
            type="email"
            {...register("contactEmail")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.contactEmail ? <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p> : null}
        </div>
        <div>
          <label htmlFor="contactPhone" className="mb-1 block text-sm font-semibold text-gray-900">
            Phone (optional)
          </label>
          <input
            id="contactPhone"
            type="tel"
            {...register("contactPhone")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.contactPhone ? <p className="mt-1 text-xs text-red-600">{errors.contactPhone.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-semibold text-gray-900">
            Location (optional)
          </label>
          <input
            id="location"
            type="text"
            {...register("location")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.location ? <p className="mt-1 text-xs text-red-600">{errors.location.message}</p> : null}
        </div>
        <div>
          <label htmlFor="quantityEstimate" className="mb-1 block text-sm font-semibold text-gray-900">
            Estimated quantity (optional)
          </label>
          <input
            id="quantityEstimate"
            type="number"
            min={1}
            step={1}
            {...register("quantityEstimate")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.quantityEstimate ? (
            <p className="mt-1 text-xs text-red-600">{errors.quantityEstimate.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="budgetRange" className="mb-1 block text-sm font-semibold text-gray-900">
          Budget range (optional)
        </label>
        <input
          id="budgetRange"
          type="text"
          {...register("budgetRange")}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {errors.budgetRange ? <p className="mt-1 text-xs text-red-600">{errors.budgetRange.message}</p> : null}
      </div>

      <div>
        <label htmlFor="requestedTitles" className="mb-1 block text-sm font-semibold text-gray-900">
          Requested titles or themes
        </label>
        <textarea
          id="requestedTitles"
          rows={5}
          {...register("requestedTitles")}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="List specific titles, authors, or subject areas."
        />
        {errors.requestedTitles ? (
          <p className="mt-1 text-xs text-red-600">{errors.requestedTitles.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-semibold text-gray-900">
          Additional notes (optional)
        </label>
        <textarea
          id="notes"
          rows={4}
          {...register("notes")}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Share deadlines, delivery preferences, or other helpful context."
        />
        {errors.notes ? <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p> : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {status === "success" ? (
        <p className="text-sm text-emerald-600">Request received. We will respond within two working days, in shaa Allah.</p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "submitting" ? "Sending…" : "Submit bulk order request"}
      </button>
    </form>
  );
}
