"use client";

import Link from "next/link";

import { useCart } from "@/lib/hooks/useCart";

export default function CartPage() {
  const { items, subtotal, removeItem, clear } = useCart();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Your reading list</h1>
  <p className="text-gray-600">Review your selected titles. Our team can finalise payment and fulfilment details with you directly.</p>
      </header>

      {items.length === 0 ? (
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
                <li key={item.book.slug} className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4">
                  <div>
                    <p className="font-semibold text-gray-900">{item.book.title}</p>
                    <p className="text-sm text-gray-500">{item.book.author}</p>
                    <p className="text-xs text-gray-400">Quantity: {item.quantity}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.book.slug)}
                    className="rounded bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
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
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Subtotal</p>
              <p className="text-2xl font-semibold text-primary">{subtotal}</p>
            </div>
            <p className="text-sm text-gray-600">
              Share these selections with the team and we’ll confirm availability, pricing, and delivery or collection options within one working day.
            </p>
            <Link
              href="/contact"
              className="block rounded bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              Contact us to complete order
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
