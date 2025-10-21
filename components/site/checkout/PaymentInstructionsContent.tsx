"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  CHECKOUT_PAYMENT_CONTEXT_STORAGE_KEY,
  BANK_ACCOUNT_DETAILS,
  UPI_BENEFICIARY_NAME,
  UPI_PAYMENT_ID,
  WHATSAPP_PAYMENT_NUMBER
} from "@/lib/constants";

interface PaymentContextItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  total: number;
}

interface PaymentContextPayload {
  orderId: string;
  amount: number;
  currency: string;
  items: PaymentContextItem[];
  warnings?: string[];
}

export function PaymentInstructionsContent() {
  const searchParams = useSearchParams();
  const orderIdFromQuery = searchParams?.get("orderId");
  const [paymentContext, setPaymentContext] = useState<PaymentContextPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upi" | "bank">("upi");

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(CHECKOUT_PAYMENT_CONTEXT_STORAGE_KEY);

      if (!raw) {
        setError("We could not find your recent order details. Please return to checkout to start again.");
        return;
      }

      const parsed = JSON.parse(raw) as PaymentContextPayload | null;

      if (!parsed || typeof parsed !== "object" || !parsed.orderId) {
        setError("We could not find your recent order details. Please return to checkout to start again.");
        return;
      }

      if (orderIdFromQuery && parsed.orderId !== orderIdFromQuery) {
        parsed.orderId = orderIdFromQuery;
      }

      setPaymentContext(parsed);
    } catch (storageError) {
      console.error("Failed to read checkout payment context", storageError);
      setError("We could not load your payment instructions. Please return to checkout.");
    }
  }, [orderIdFromQuery]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }), []);

  const amountDisplay = paymentContext ? currencyFormatter.format(paymentContext.amount) : "";
  const upiAmountParam = paymentContext ? paymentContext.amount.toFixed(2) : "0.00";
  const upiLink = paymentContext
    ? `upi://pay?pa=${encodeURIComponent(UPI_PAYMENT_ID)}&pn=${encodeURIComponent(UPI_BENEFICIARY_NAME)}&am=${encodeURIComponent(
        upiAmountParam
      )}&cu=INR&tn=${encodeURIComponent(`Order ${paymentContext.orderId}`)}`
    : "#";

  const itemsSummaryList = paymentContext
    ? paymentContext.items.map((item) => `• ${item.title} × ${item.quantity}`).join("\n")
    : "";

  const whatsappMessage = paymentContext
    ? `I made the payment for order ${paymentContext.orderId}.\nBooks:\n${itemsSummaryList}\nTotal amount paid: ${currencyFormatter.format(
        paymentContext.amount
      )}.\nI'm sending the payment screenshot in a minute.`
    : "";

  const whatsappLink = paymentContext
    ? `https://wa.me/${WHATSAPP_PAYMENT_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`
    : "#";

  const whatsappBankSupportMessage = paymentContext
    ? `I need confirmation for the bank transfer details for order ${paymentContext.orderId}.`
    : "";

  const whatsappBankSupportLink = paymentContext
    ? `https://wa.me/${WHATSAPP_PAYMENT_NUMBER}?text=${encodeURIComponent(whatsappBankSupportMessage)}`
    : "#";

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      console.warn(`Clipboard API not available to copy ${label}`);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch (clipboardError) {
      console.warn(`Failed to copy ${label}`, clipboardError);
    }
  }, []);

  const handleCopyUpi = useCallback(() => {
    void copyToClipboard(UPI_PAYMENT_ID, "UPI ID");
  }, [copyToClipboard]);

  const tabButtonClass = (tab: "upi" | "bank") =>
    `flex-1 min-w-[160px] rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 sm:flex-none sm:px-6 ${
      activeTab === tab
        ? "border-primary bg-primary/10 text-primary shadow-sm"
        : "border-transparent text-gray-600 hover:border-primary/40 hover:bg-primary/5"
    }`;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Step 3 of 3</p>
        <h1 className="text-3xl font-semibold text-gray-900">Complete your payment</h1>
        <p className="text-gray-600">
          Thank you for confirming your order. Please choose a payment option below and share the payment confirmation so we can dispatch your books promptly.
        </p>
      </header>

      {error ? (
        <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p>{error}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Return to checkout
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
            >
              Browse more books
            </Link>
          </div>
        </div>
      ) : null}

      {!paymentContext && !error ? (
        <div className="rounded-3xl border border-gray-200 bg-white/95 p-6 text-sm text-gray-600 shadow-sm">
          Preparing payment instructions...
        </div>
      ) : null}

      {paymentContext ? (
        <div className="space-y-8">
          {paymentContext.warnings && paymentContext.warnings.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Heads up:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {paymentContext.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <section className="space-y-6 rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Order reference</p>
                <p className="text-2xl font-semibold text-gray-900">{paymentContext.orderId}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Amount due</p>
                <p className="text-2xl font-semibold text-gray-900">{amountDisplay}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 rounded-2xl bg-gray-50 p-2">
              <button
                type="button"
                onClick={() => setActiveTab("upi")}
                className={tabButtonClass("upi")}
                aria-pressed={activeTab === "upi"}
              >
                <span className="block">UPI payment</span>
                <span className="block text-xs font-normal text-gray-500">Instant confirmation via your UPI app</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bank")}
                className={tabButtonClass("bank")}
                aria-pressed={activeTab === "bank"}
              >
                <span className="block">Bank transfer</span>
                <span className="block text-xs font-normal text-gray-500">Transfer directly to our ICICI account</span>
              </button>
            </div>

            {activeTab === "upi" ? (
              <div className="space-y-4">
                <a
                  href={upiLink}
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Pay via UPI
                </a>
                <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4">
                  <h2 className="text-sm font-semibold text-gray-900">UPI instructions</h2>
                  <p className="text-sm text-gray-600">
                    The payment link will open your preferred UPI app with the amount filled in. Before authorising, confirm the beneficiary name shows <strong>{UPI_BENEFICIARY_NAME}</strong>.
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                    <span className="rounded-full bg-gray-50 px-3 py-1 font-semibold">UPI ID: {UPI_PAYMENT_ID}</span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:-translate-y-0.5 hover:bg-gray-100"
                    >
                      Copy UPI ID
                    </button>
                  </div>
                  <p className="text-sm text-emerald-700">After the payment succeeds, capture a screenshot of the confirmation screen.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4">
                  <h2 className="text-sm font-semibold text-gray-900">Bank transfer instructions</h2>
                  <p className="text-sm text-gray-600">
                    Use the ICICI Bank account below and include your order ID {paymentContext.orderId} in the narration / remark field for easy tracking.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bank name</p>
                      <p className="text-sm font-semibold text-gray-900">{BANK_ACCOUNT_DETAILS.bankName}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Account holder</p>
                      <p className="text-sm font-semibold text-gray-900">{BANK_ACCOUNT_DETAILS.accountHolder}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Account number</p>
                          <p className="text-sm font-semibold text-gray-900">{BANK_ACCOUNT_DETAILS.accountNumber}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(BANK_ACCOUNT_DETAILS.accountNumber, "account number")}
                          className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:-translate-y-0.5 hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">IFSC code</p>
                          <p className="text-sm font-semibold text-gray-900">{BANK_ACCOUNT_DETAILS.ifscCode}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(BANK_ACCOUNT_DETAILS.ifscCode, "IFSC code")}
                          className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:-translate-y-0.5 hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Need additional confirmation or a PDF invoice? WhatsApp us and we will respond promptly.</p>
                  <a
                    href={whatsappBankSupportLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
                  >
                    WhatsApp us for account confirmation
                  </a>
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <h2 className="text-sm font-semibold text-gray-900">Send us your proof</h2>
              <p className="text-sm text-gray-600">Share the payment screenshot on WhatsApp so we can verify and dispatch your books quickly.</p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Message us on WhatsApp
              </a>
              <Link
                href="/orders"
                className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:-translate-y-0.5 hover:bg-white"
              >
                My orders
              </Link>
              <p className="text-xs text-gray-500">
                The pre-filled message includes your order ID, book list, quantity, and total paid amount to speed up verification.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-900">Order summary</h2>
              <ul className="space-y-2 text-sm text-gray-700">
                {paymentContext.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2">
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <span className="text-sm text-gray-600">{currencyFormatter.format(item.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
