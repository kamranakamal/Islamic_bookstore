"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCart } from "@/lib/hooks/useCart";
import type { CartItem, OrderRequestPayload } from "@/lib/types";

const schema = z.object({
  name: z.string().min(3, "Please enter your full name"),
  email: z.string().email("Provide a valid email address"),
  phone: z.string().optional(),
  institution: z.string().optional(),
  message: z.string().max(1000, "Message is too long").optional()
});

type OrderFormValues = z.infer<typeof schema>;

async function submitOrder(payload: OrderRequestPayload) {
  const response = await fetch("/api/order-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data?.error ?? "Unable to submit request");
  }
}

export default function OrderRequestPage() {
  const { items, clear } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<OrderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      institution: "",
      message: ""
    }
  });

  useEffect(() => {
    const bookParam = searchParams.get("book");
  if (bookParam && !items.find((item: CartItem) => item.book.slug === bookParam)) {
      // We only prefill the message with the book slug to guide the admin.
      const existingMessage = getValues("message");
      const nextMessage = `${existingMessage ? `${existingMessage}\n\n` : ""}Interested in: ${bookParam}`;
      setValue("message", nextMessage, { shouldDirty: true });
    }
  }, [getValues, items, searchParams, setValue]);

  const onSubmit = async (values: OrderFormValues) => {
    if (items.length === 0) {
      setError("Add at least one book to your cart before submitting an order.");
      return;
    }

    setStatus("submitting");
    setError(null);

    const payload: OrderRequestPayload = {
      ...values,
  items: items.map((item: CartItem) => ({ bookSlug: item.book.slug, quantity: item.quantity }))
    };

    try {
      await submitOrder(payload);
      setStatus("success");
      clear();
      setTimeout(() => router.push("/"), 3000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unable to submit request.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold text-gray-900">Manual order request</h1>
          <p className="mt-2 text-gray-600">
            Provide your details and we will confirm availability, pricing, and delivery or collection options within one
            working day.
          </p>
        </header>
        <form
          onSubmit={(event: FormEvent<HTMLFormElement>) => void handleSubmit(onSubmit)(event)}
          className="space-y-5"
          noValidate
        >
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              {...register("name")}
              className="w-full rounded border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="w-full rounded border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
              Phone (optional)
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              {...register("phone")}
              className="w-full rounded border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
          </div>

          <div>
            <label htmlFor="institution" className="mb-1 block text-sm font-medium text-gray-700">
              Institution or masjid (optional)
            </label>
            <input
              id="institution"
              type="text"
              {...register("institution")}
              className="w-full rounded border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {errors.institution ? <p className="mt-1 text-xs text-red-600">{errors.institution.message}</p> : null}
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
              Additional notes
            </label>
            <textarea
              id="message"
              rows={4}
              {...register("message")}
              className="w-full rounded border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {errors.message ? <p className="mt-1 text-xs text-red-600">{errors.message.message}</p> : null}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "submitting" ? "Submitting…" : "Submit request"}
          </button>
          {status === "success" ? (
            <p className="text-sm text-green-600">Request received. Redirecting you to the catalog shortly.</p>
          ) : null}
        </form>
      </section>

      <aside className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Add books to your cart to include them in this request.</p>
        ) : (
          <ul className="space-y-3 text-sm text-gray-600">
            {items.map((item: CartItem) => (
              <li key={item.book.slug} className="flex items-center justify-between">
                <span>
                  {item.book.title}
                  <span className="block text-xs text-gray-400">Qty: {item.quantity}</span>
                </span>
                <span>{item.book.priceFormatted}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
