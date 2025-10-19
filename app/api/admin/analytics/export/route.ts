import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/authHelpers";
import { getAdminAnalytics } from "@/lib/data/admin";

function escapeCsv(value: string | number): string {
  const stringValue = typeof value === "number" ? String(value) : value;
  if (/[,"\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildCsv(): Promise<string> {
  return getAdminAnalytics().then((snapshot) => {
    const lines: string[] = [];
    lines.push("Metric,Value,Notes");
    lines.push(`Total titles,${escapeCsv(snapshot.totalBooks)},Books currently published`);
    lines.push(`New (30 days),${escapeCsv(snapshot.newBooksLast30Days)},Books added in last 30 days`);
    lines.push(`Featured titles,${escapeCsv(snapshot.featuredBooks)},Marked as featured in catalog`);
    lines.push(`Orders placed,${escapeCsv(snapshot.totalOrders)},All recorded orders`);
    lines.push(`Pending orders,${escapeCsv(snapshot.totalOrdersPending)},Awaiting manual action`);
    lines.push(`Order items,${escapeCsv(snapshot.totalOrderItems)},Total quantity across orders`);
    lines.push(`Estimated local revenue,${escapeCsv(snapshot.estimatedLocalRevenue)},INR for non-cancelled orders`);
    lines.push(`Team members,${escapeCsv(snapshot.totalUsers)},Profiles with admin access`);
    lines.push("");

    lines.push("Books by category,Count");
    if (snapshot.booksByCategory.length === 0) {
      lines.push("(none),0");
    } else {
      for (const item of snapshot.booksByCategory) {
        lines.push(`${escapeCsv(item.category)},${escapeCsv(item.count)}`);
      }
    }
    lines.push("");

    lines.push("Books by language,Count");
    if (snapshot.booksByLanguage.length === 0) {
      lines.push("(none),0");
    } else {
      for (const item of snapshot.booksByLanguage) {
        lines.push(`${escapeCsv(item.language)},${escapeCsv(item.count)}`);
      }
    }
    lines.push("");

    lines.push("Orders by status,Count");
    if (snapshot.ordersByStatus.length === 0) {
      lines.push("(none),0");
    } else {
      for (const item of snapshot.ordersByStatus) {
        lines.push(`${escapeCsv(item.status)},${escapeCsv(item.count)}`);
      }
    }
    lines.push("");

    lines.push("Most requested title,Quantity ordered");
    if (snapshot.mostRequestedTitles.length === 0) {
      lines.push("(none),0");
    } else {
      for (const item of snapshot.mostRequestedTitles) {
        lines.push(`${escapeCsv(item.title)},${escapeCsv(item.count)}`);
      }
    }
    lines.push("");

    lines.push("Recent book ID,Title,Category,Created at,Featured");
    if (snapshot.recentBooks.length === 0) {
      lines.push("(none),(none),(none),(none),(none)");
    } else {
      for (const book of snapshot.recentBooks) {
        lines.push(
          `${escapeCsv(book.id)},${escapeCsv(book.title)},${escapeCsv(book.category ?? "Uncategorised")},${escapeCsv(book.createdAt)},${escapeCsv(book.isFeatured ? "Yes" : "No")}`
        );
      }
    }

    return lines.join("\n");
  });
}

export async function GET() {
  await requireAdminUser();
  const csv = await buildCsv();
  const timestamp = new Date().toISOString().replace(/[:T]/g, "-").split(".")[0];
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=analytics-${timestamp}.csv`
    }
  });
}
