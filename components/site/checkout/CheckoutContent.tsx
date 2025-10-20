"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { SavedAddressesQuickSelect } from "@/components/site/addresses/SavedAddressesQuickSelect";
import { useCart } from "@/lib/hooks/useCart";
import type { SessionUser } from "@/lib/authHelpers";

const PAYMENT_METHODS = [
  {
    id: "upi",
    label: "UPI Payment",
    description: "Pay securely using your preferred UPI app. We will confirm the UPI ID after review."
  },
  {
    id: "bank",
    label: "Bank Transfer",
    description: "Receive our bank details and transfer once we confirm stock."
  }
] as const;

const DELIVERY_WINDOWS = [
  "Standard delivery (8-10 working days)"
] as const;

type SubmissionState = "idle" | "processing" | "success";

interface CheckoutContentProps {
  sessionUser: SessionUser;
}

export function CheckoutContent({ sessionUser }: CheckoutContentProps) {
  const { items, subtotal, subtotalValue, isHydrated, isRemoteSynced } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]["id"]>(PAYMENT_METHODS[0]?.id ?? "upi");
  const [deliveryWindow, setDeliveryWindow] = useState<(typeof DELIVERY_WINDOWS)[number]>(DELIVERY_WINDOWS[0]);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }),
    []
  );

  const estimatedBooksTotal = useMemo(() => subtotalValue, [subtotalValue]);
  const estimatedGrandTotal = useMemo(() => estimatedBooksTotal, [estimatedBooksTotal]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length || submissionState === "processing") return;

    setSubmitError(null);
    setSubmissionState("processing");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
    const email = (formData.get("email") as string | null)?.trim() ?? "";
    const phone = (formData.get("phone") as string | null)?.trim() ?? "";
    const reference = (formData.get("reference") as string | null)?.trim() ?? "";
    const paymentId = (formData.get("paymentId") as string | null)?.trim() ?? "";

    const fallbackName = sessionUser.displayName ?? sessionUser.email;
    const fallbackEmail = sessionUser.email.toLowerCase();
    const normalizedEmail = email.length ? email.toLowerCase() : fallbackEmail;

    const payload = {
      paymentMethod,
      billingName: fullName.length ? fullName : fallbackName,
      billingEmail: normalizedEmail,
      billingPhone: phone.length ? phone : null,
      deliveryWindow,
      referenceCode: reference.length ? reference : null,
      paymentIdentifier: paymentId.length ? paymentId : null,
      notes: notes.trim().length ? notes.trim() : null
    };

    try {
      const response = await fetch("/api/profile/checkout-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "" }));
        const message = typeof body?.error === "string" && body.error.length ? body.error : "Unable to submit checkout preferences.";
        setSubmitError(message);
        setSubmissionState("idle");
        return;
      }

  setSubmissionState("success");
  setNotes("");
  form.reset();
  setPaymentMethod(PAYMENT_METHODS[0]?.id ?? "upi");
  setDeliveryWindow(DELIVERY_WINDOWS[0]);
    } catch (error) {
      console.error("Failed to submit checkout preferences", error);
      setSubmitError("Something went wrong while submitting. Please try again.");
      setSubmissionState("idle");
    }
  };

  if (!isHydrated) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white/90 p-8 text-center text-gray-600 shadow-sm">
        Preparing your checkout experience...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="space-y-6 rounded-3xl border border-dashed border-gray-300 bg-white/90 p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-gray-900">Your cart is empty</p>
        <p className="text-sm text-gray-600">Add books to your cart to continue to secure checkout.</p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Browse catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Step 2 of 3</p>
        <h1 className="text-3xl font-semibold text-gray-900">Checkout &amp; payment</h1>
        <p className="text-gray-600">
          Secure your request by confirming payment preferences. We will reach out within one working day to finalise delivery and share payment details.
        </p>
      </header>

      {submissionState === "success" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Thank you! We received your checkout preferences and will confirm the payment instructions at {sessionUser.email} once your order is approved.
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <section className="space-y-8 rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold uppercase tracking-wide text-gray-500">Payment method</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {PAYMENT_METHODS.map((method) => {
                  const isActive = method.id === paymentMethod;
                  return (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer flex-col rounded-2xl border p-4 transition ${
                        isActive ? "border-primary bg-primary/5 shadow-sm" : "border-gray-200 hover:border-primary/50"
                      }`}
                    >
                      <span className="flex items-center justify-between text-sm font-semibold text-gray-900">
                        {method.label}
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={isActive}
                          onChange={() => setPaymentMethod(method.id)}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                      </span>
                      <span className="mt-2 text-xs text-gray-500">{method.description}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold uppercase tracking-wide text-gray-500">Billing contact</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-gray-700">Full name</span>
                  <input
                    type="text"
                    name="fullName"
                    defaultValue={sessionUser.displayName ?? sessionUser.email}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-gray-700">Email</span>
                  <input
                    type="email"
                    name="email"
                    defaultValue={sessionUser.email}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-gray-700">Phone number</span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="e.g. +91 98765 43210"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-gray-700">Preferred delivery window</span>
                  <select
                    name="deliveryWindow"
                    value={deliveryWindow}
                    onChange={(event) => setDeliveryWindow(event.target.value as (typeof DELIVERY_WINDOWS)[number])}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {DELIVERY_WINDOWS.map((windowOption) => (
                      <option key={windowOption} value={windowOption}>
                        {windowOption}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold uppercase tracking-wide text-gray-500">Payment instructions</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-gray-700">Reference code</span>
                  <input
                    type="text"
                    name="reference"
                    placeholder="Choose a reference to quote in payment"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-gray-700">UPI / Bank ID (optional)</span>
                  <input
                    type="text"
                    name="paymentId"
                    placeholder="Share your UPI ID or bank account name"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-gray-700">Order notes</span>
                <textarea
                  name="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Mention delivery instructions or institutional requirements."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
            </fieldset>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                {isRemoteSynced
                  ? "Your cart is saved to your account and will stay in sync across devices."
                  : "Cart updates are stored on this device. Sign in to keep a copy on your account."}
              </p>
              <button
                type="submit"
                disabled={submissionState === "processing"}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submissionState === "processing" ? "Submitting..." : "Confirm checkout preferences"}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-6 rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">{items.length} {items.length === 1 ? "book" : "books"}</p>
          </div>
          <ul className="space-y-3 divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.book.id} className="pt-3 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.book.title}</p>
                    <p className="text-xs text-gray-500">{item.book.author}</p>
                  </div>
                  <div className="text-right text-sm text-gray-700">
                    <p>{item.book.priceFormattedLocal}</p>
                    <p className="text-xs text-gray-400">Qty {item.quantity}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <dt>Books subtotal</dt>
              <dd>{subtotal}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Estimated delivery</dt>
              <dd>No charge</dd>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-gray-900">
              <dt>Total (estimate)</dt>
              <dd>{currencyFormatter.format(estimatedGrandTotal)}</dd>
            </div>
          </dl>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs text-primary">
            We will verify availability before collecting payment. Once everything is confirmed, we will share payment instructions using your selected method.
          </div>
          <SavedAddressesQuickSelect />
        </aside>
      </div>
    </div>
  );
}
