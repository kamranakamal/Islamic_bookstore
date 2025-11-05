import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/authHelpers";
import { getAdminBooksData, getAdminOrders } from "@/lib/data/admin";
import type { AdminOrder } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatShippingAddress(address: AdminOrder["shippingAddress"]): string {
  if (!address) return "";
  const lines: string[] = [];
  if (address.label) lines.push(address.label);
  if (address.fullName) lines.push(address.fullName);
  const street = [address.line1, address.line2].filter(Boolean).join(", ");
  if (street) lines.push(street);
  const locality = [address.city, address.state].filter(Boolean).join(", ");
  const code = address.postalCode ?? "";
  if (locality || code) {
    lines.push(`${locality}${code ? ` ${code}` : ""}`.trim());
  }
  if (address.country) lines.push(address.country);
  if (address.phone) lines.push(`Phone: ${address.phone}`);
  return lines.filter(Boolean).join(" | ");
}

function escapeCsv(value: string | number): string {
  const stringValue = typeof value === "number" ? String(value) : value;
  if (/["\n,]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET() {
  await requireAdminUser();
  const [orders, booksData] = await Promise.all([getAdminOrders(), getAdminBooksData()]);

  const titleById = new Map<string, { title: string; priceLocalInr: number }>();
  for (const book of booksData.books) {
    titleById.set(book.id, { title: book.title, priceLocalInr: book.priceLocalInr });
  }

  const header = [
    "ID",
    "Status",
    "Customer",
    "Email",
    "Phone",
    "Institution",
    "Created at",
    "Items",
    "Total quantity",
    "Estimated value (INR)",
    "Item details",
    "Notes",
    "Shipping address"
  ];

  const lines = [header.join(",")];

  for (const order of orders) {
    const items = order.items ?? [];
    const itemCount = items.length;
    const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
    const estimatedValue = items.reduce((total, item) => {
      const price = titleById.get(item.book_id)?.priceLocalInr ?? 0;
      return total + price * item.quantity;
    }, 0);

    const itemDetails = items
      .map((item) => {
        const lookup = titleById.get(item.book_id);
        const label = lookup ? `${lookup.title} (₹${lookup.priceLocalInr})` : item.book_id;
        return `${label} ×${item.quantity}`;
      })
      .join(" | ");

    const row = [
      escapeCsv(order.id),
      escapeCsv(order.status),
      escapeCsv(order.fullName),
      escapeCsv(order.email),
      escapeCsv(order.phone ?? ""),
      escapeCsv(order.institution ?? ""),
      escapeCsv(order.createdAt),
      escapeCsv(itemCount),
      escapeCsv(totalQuantity),
      escapeCsv(estimatedValue),
      escapeCsv(itemDetails || "No items"),
      escapeCsv(order.notes ?? ""),
      escapeCsv(formatShippingAddress(order.shippingAddress))
    ];

    lines.push(row.join(","));
  }

  const csv = lines.join("\n");
  const timestamp = new Date().toISOString().replace(/[:T]/g, "-").split(".")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=orders-${timestamp}.csv`
    }
  });
}
