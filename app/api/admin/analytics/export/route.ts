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
    lines.push("Metric,Value");
    lines.push(`Total titles,${escapeCsv(snapshot.totalBooks)}`);
    lines.push(`Pending orders,${escapeCsv(snapshot.totalOrdersPending)}`);
    lines.push(`Team members,${escapeCsv(snapshot.totalUsers)}`);
    lines.push("");
    lines.push("Most requested title,Count");
    if (snapshot.mostRequestedTitles.length === 0) {
      lines.push("(none),0");
    } else {
      for (const item of snapshot.mostRequestedTitles) {
        lines.push(`${escapeCsv(item.title)},${escapeCsv(item.count)}`);
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
