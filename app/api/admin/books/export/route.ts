import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/authHelpers";
import { getAdminBooksData } from "@/lib/data/admin";
import { getBookLanguageLabel } from "@/lib/types";

function escapeCsv(value: string | number): string {
  const stringValue = typeof value === "number" ? String(value) : value;
  if (/["\n,]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET() {
  await requireAdminUser();
  const data = await getAdminBooksData();

  const header = [
    "ID",
    "Title",
    "Author",
    "Category",
    "Formats",
    "Languages",
    "Page count",
    "Stock quantity",
    "Price (INR)",
    "Price (USD)",
    "Featured",
    "Gallery images",
    "Created at",
    "Updated at",
    "Description"
  ];

  const lines = [header.join(",")];

  for (const book of data.books) {
    const formats = book.availableFormats.join("; ");
    const languages = book.availableLanguages.map((language) => getBookLanguageLabel(language)).join("; ");
    const featured = book.isFeatured ? "Yes" : "No";
    const galleryCount = book.galleryPaths.length;

    const row = [
      escapeCsv(book.id),
      escapeCsv(book.title),
      escapeCsv(book.author),
      escapeCsv(book.categoryName ?? "Uncategorised"),
      escapeCsv(formats || "None"),
      escapeCsv(languages || "None"),
      escapeCsv(book.pageCount),
      escapeCsv(book.stockQuantity),
      escapeCsv(book.priceLocalInr),
      escapeCsv(book.priceInternationalUsd),
      escapeCsv(featured),
      escapeCsv(galleryCount),
      escapeCsv(book.createdAt),
      escapeCsv(book.updatedAt),
      escapeCsv(book.description)
    ];

    lines.push(row.join(","));
  }

  const csv = lines.join("\n");
  const timestamp = new Date().toISOString().replace(/[:T]/g, "-").split(".")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=books-${timestamp}.csv`
    }
  });
}
