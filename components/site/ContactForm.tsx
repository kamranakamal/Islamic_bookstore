"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(3, "Please share your name"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(50).optional(),
  subject: z.string().max(120).optional(),
  message: z.string().min(10, "Let us know how we can help"),
  consent: z
    .boolean({ required_error: "Please acknowledge our privacy notice" })
    .refine((value) => value === true, {
      message: "Please acknowledge our privacy notice"
    })
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      consent: false
    }
  });

  const onSubmit = async (values: FormValues) => {
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone?.trim().length ? values.phone.trim() : undefined,
          subject: values.subject?.trim().length ? values.subject.trim() : undefined,
          message: values.message.trim()
        })
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error((payload as { error?: string })?.error ?? "Unable to submit message");
      }

      setStatus("success");
      reset({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        consent: false
      });
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unable to submit message");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register("name")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
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
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
            Phone (optional)
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...register("phone")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
        </div>
        <div>
          <label htmlFor="subject" className="mb-1 block text-sm font-medium text-gray-700">
            Subject (optional)
          </label>
          <input
            id="subject"
            type="text"
            {...register("subject")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.subject ? <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          {...register("message")}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {errors.message ? <p className="mt-1 text-xs text-red-600">{errors.message.message}</p> : null}
      </div>

      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/60"
          {...register("consent")}
        />
        <span>
          I consent to Maktab Muhammadiya storing my details for the sole purpose of responding to this inquiry.
        </span>
      </label>
      {errors.consent ? <p className="-mt-2 text-xs text-red-600">{errors.consent.message}</p> : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {status === "success" ? (
        <p className="text-sm text-emerald-600">Message received. We’ll reply within one working day in shaa Allah.</p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
