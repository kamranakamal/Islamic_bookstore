"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { SavedAddressesQuickSelect } from "@/components/site/addresses/SavedAddressesQuickSelect";
import { useCart } from "@/lib/hooks/useCart";
import type { BookSummary } from "@/lib/types";

type AddStatus = "none" | "not-found";

interface CartPageClientProps {
  bookToAdd: BookSummary | null;
  addStatus: AddStatus;
}

export function CartPageClient({ bookToAdd, addStatus }: CartPageClientProps) {
  const router = useRouter();
  const {
    items,
    subtotal,
    removeItem,
    clear,
    addItem,
    setItemQuantity,
    shippingAddress,
    setShippingAddress,
    isHydrated,
    isRemoteSynced
  } = useCart();
  const [recentlyAddedTitle, setRecentlyAddedTitle] = useState<string | null>(null);
  const [notFoundVisible, setNotFoundVisible] = useState(addStatus === "not-found");
  const processedAddIdRef = useRef<string | null>(null);
  const [addressFeedback, setAddressFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!bookToAdd) {
      processedAddIdRef.current = null;
      return;
    }

    if (processedAddIdRef.current === bookToAdd.id) return;

    processedAddIdRef.current = bookToAdd.id;
    addItem(bookToAdd);
    setRecentlyAddedTitle(bookToAdd.title);
    router.replace("/cart", { scroll: false });
  }, [addItem, bookToAdd, router]);

  useEffect(() => {
    if (addStatus !== "not-found") return;

    setNotFoundVisible(true);
    router.replace("/cart", { scroll: false });
  }, [addStatus, router]);

  useEffect(() => {
    if (!recentlyAddedTitle) return;

    const timeoutId = window.setTimeout(() => setRecentlyAddedTitle(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [recentlyAddedTitle]);

  useEffect(() => {
    if (!notFoundVisible) return;

    const timeoutId = window.setTimeout(() => setNotFoundVisible(false), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [notFoundVisible]);

  useEffect(() => {
    if (!addressFeedback) return;
    const timeoutId = window.setTimeout(() => setAddressFeedback(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [addressFeedback]);

  const handleAddressSelect = (address: Parameters<typeof setShippingAddress>[0]) => {
    setShippingAddress(address);
    if (address) {
      const label = address.label?.trim();
      const line = address.line1 ?? "";
      const summary = label?.length ? label : line;
      setAddressFeedback(summary.length ? `Using ${summary} for delivery.` : "Updated delivery address.");
    } else {
      setAddressFeedback("Cleared delivery address.");
    }
  };

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Your reading list</h1>
        <p className="text-gray-600">
          Review your selected titles. Our team can finalise payment and fulfilment details with you directly.
        </p>
        <Link
          href="/orders"
          className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800"
        >
          My orders
        </Link>
      </header>

      {notFoundVisible ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          We could not find that book. Please try adding it again from the catalogue.
        </div>
      ) : null}

      {recentlyAddedTitle ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Added <span className="font-semibold text-emerald-800">{recentlyAddedTitle}</span> to your cart.
        </div>
      ) : null}

      {!isHydrated ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          Loading your cart...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          <p className="mb-4">Your cart is currently empty.</p>
          <Link href="/" className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Continue browsing
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-4">
            <ul className="space-y-4" aria-live="polite">
              {items.map((item) => (
                <li
                  key={item.book.id}
                  className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold text-gray-900">{item.book.title}</p>
                      <p className="text-sm text-gray-500">{item.book.author}</p>
                    </div>
                    <p className="text-sm text-gray-600">{item.book.priceFormattedLocal}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="text-xs uppercase tracking-wide text-gray-500">Quantity</span>
                      <div className="inline-flex items-center rounded-full border border-gray-200 bg-white">
                        <button
                          type="button"
                          onClick={() => setItemQuantity(item.book.id, item.quantity - 1)}
                          className="h-8 w-8 rounded-full text-lg leading-none text-gray-600 transition hover:bg-gray-100"
                          aria-label={`Decrease quantity for ${item.book.title}`}
                        >
                          -
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setItemQuantity(item.book.id, item.quantity + 1)}
                          className="h-8 w-8 rounded-full text-lg leading-none text-gray-600 transition hover:bg-gray-100"
                          aria-label={`Increase quantity for ${item.book.title}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.book.id)}
                    className="inline-flex items-center justify-center rounded bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                    aria-label={`Remove ${item.book.title} from cart`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={clear}
              className="text-sm font-semibold text-red-600 underline underline-offset-4"
            >
              Clear cart
            </button>
          </section>

          <aside className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Delivery address</p>
                  <p className="text-xs text-gray-500">Choose where we should prepare to deliver this order.</p>
                </div>
                {shippingAddress ? (
                  <button
                    type="button"
                    onClick={() => handleAddressSelect(null)}
                    className="text-xs font-semibold text-primary underline underline-offset-2"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              {shippingAddress ? (
                <address className="space-y-1 text-sm not-italic text-gray-700">
                  {shippingAddress.label ? (
                    <p className="font-semibold text-gray-900">{shippingAddress.label}</p>
                  ) : null}
                  <p>{shippingAddress.fullName}</p>
                  <p>{shippingAddress.line1}</p>
                  {shippingAddress.line2 ? <p>{shippingAddress.line2}</p> : null}
                  {(() => {
                    const locality = [shippingAddress.city, shippingAddress.state].filter(Boolean).join(", ");
                    const code = shippingAddress.postalCode ?? "";
                    if (!locality && !code) return null;
                    return <p>{`${locality}${code ? ` ${code}` : ""}`.trim()}</p>;
                  })()}
                  <p>{shippingAddress.country ?? "India"}</p>
                  {shippingAddress.landmark ? <p className="text-xs font-medium text-gray-600 italic">Landmark: {shippingAddress.landmark}</p> : null}
                  {shippingAddress.phone ? <p className="text-xs text-gray-500">Phone: {shippingAddress.phone}</p> : null}
                </address>
              ) : (
                <p className="text-sm text-gray-600">Select one of your saved addresses below or manage them in your account.</p>
              )}
              {addressFeedback ? <p className="text-xs text-emerald-600">{addressFeedback}</p> : null}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Subtotal</p>
              <p className="text-2xl font-semibold text-primary">{subtotal}</p>
            </div>
            <p className="text-sm text-gray-600">
              Share these selections with the team and we’ll confirm availability, pricing, and delivery or collection options within one working day.
            </p>
            <Link
              href="/checkout"
              className="block rounded bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              Proceed to checkout
            </Link>
            <p className="text-xs text-gray-500">
              {isRemoteSynced
                ? "Cart items are saved to your account."
                : "Cart items are stored on this device. Sign in to sync across devices."}
            </p>
            <SavedAddressesQuickSelect
              selectedId={shippingAddress?.id ?? null}
              onSelect={(address) => handleAddressSelect(address)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
