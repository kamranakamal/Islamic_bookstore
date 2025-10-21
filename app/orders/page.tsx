import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/authHelpers";
import { getUserOrders } from "@/lib/data/profile";
import type { ShippingAddressSnapshot, UserOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Orders · Maktab Muhammadiya",
  description: "Review your recent book orders, payment status, and delivery details."
};

const statusLabels: Record<UserOrder["status"], string> = {
  pending: "Pending review",
  approved: "Approved",
  shipped: "Shipped",
  cancelled: "Cancelled"
};

const statusClasses: Record<UserOrder["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  shipped: "bg-sky-100 text-sky-700",
  cancelled: "bg-rose-100 text-rose-700"
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatOrderDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateFormatter.format(date);
}

function addressLines(address: ShippingAddressSnapshot | null): string[] {
  if (!address) {
    return [];
  }

  const lines: string[] = [];

  if (address.label) lines.push(address.label);
  if (address.fullName) lines.push(address.fullName);
  if (address.line1) lines.push(address.line1);
  if (address.line2) lines.push(address.line2);

  const locality = [address.city, address.state].filter(Boolean).join(", ");
  const code = address.postalCode ?? "";
  const localityLine = [locality, code].filter(Boolean).join(" ").trim();
  if (localityLine) lines.push(localityLine);

  if (address.country) lines.push(address.country);
  if (address.landmark) lines.push(`Landmark: ${address.landmark}`);
  if (address.phone) lines.push(`Phone: ${address.phone}`);

  return lines.filter((line) => line.trim().length > 0);
}

export default async function OrdersPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect(`/login?redirect=${encodeURIComponent("/orders")}`);
  }

  const orders = await getUserOrders(sessionUser.id);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Account</p>
        <h1 className="text-3xl font-semibold text-gray-900">My orders</h1>
        <p className="text-gray-600">
          Track the orders you have placed with Maktab Muhammadiya. We will keep your status updated as our team verifies payments and schedules dispatch.
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white/95 p-10 text-center text-gray-600 shadow-sm">
          <p className="mb-4 text-sm">You have not placed any orders yet.</p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Browse books
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-2 font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
            >
              Go to cart
            </Link>
          </div>
        </div>
      ) : (
        <section className="space-y-6">
          {orders.map((order) => {
            const lines = addressLines(order.shippingAddress);

            return (
              <article
                key={order.id}
                className="space-y-6 rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order reference</p>
                    <p className="text-xl font-semibold text-gray-900">{order.id}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    <p className="text-xs text-gray-500">Placed on {formatOrderDate(order.createdAt)}</p>
                    {order.estimatedTotalFormatted ? (
                      <p className="text-sm font-semibold text-gray-900">Estimated total: {order.estimatedTotalFormatted}</p>
                    ) : null}
                  </div>
                </div>

                {order.hasUnavailableItems ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    One or more books in this order are no longer listed in the catalogue. The team will confirm replacements or refunds if needed.
                  </div>
                ) : null}

                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Books in this order</h2>
                  <ul className="mt-3 space-y-3">
                    {order.items.map((item) => (
                      <li
                        key={`${order.id}-${item.bookId}`}
                        className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          {item.author ? <p className="text-xs text-gray-500">by {item.author}</p> : null}
                          {item.isUnavailable ? (
                            <p className="text-xs font-medium text-amber-600">Currently unavailable&mdash;our team will advise next steps.</p>
                          ) : null}
                        </div>
                        <div className="text-sm text-gray-600 sm:text-right">
                          <p className="font-semibold text-gray-900">Quantity: {item.quantity}</p>
                          {item.unitPriceFormatted ? <p>Unit price: {item.unitPriceFormatted}</p> : null}
                          {item.lineTotalFormatted ? (
                            <p className="text-sm font-semibold text-gray-900">Line total: {item.lineTotalFormatted}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {lines.length ? (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <h2 className="text-sm font-semibold text-gray-900">Delivery address</h2>
                    <address className="mt-2 space-y-1 text-sm not-italic text-gray-700">
                      {lines.map((line, index) => (
                        <p key={`${order.id}-address-${index}`}>{line}</p>
                      ))}
                    </address>
                  </div>
                ) : null}

                {order.notes ? (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <h2 className="text-sm font-semibold text-gray-900">Notes</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{order.notes}</p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3 text-sm">
                  <Link
                    href={`/checkout/payment?orderId=${order.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
                  >
                    View payment instructions
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    Need assistance?
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
