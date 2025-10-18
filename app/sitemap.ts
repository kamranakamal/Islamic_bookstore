import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/config";
import { listBookSlugs } from "@/lib/data/books";
import { listCategorySummaries } from "@/lib/data/categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [books, categories] = await Promise.all([listBookSlugs(), listCategorySummaries()]);

  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    {
      url: appUrl,
      lastModified: now
    },
    {
      url: `${appUrl}/order-request`,
      lastModified: now
    },
    {
      url: `${appUrl}/cart`,
      lastModified: now
    },
    {
      url: `${appUrl}/search`,
      lastModified: now
    }
  ];

  const bookEntries = books.map((book) => ({
    url: `${appUrl}/books/${book.slug}`,
    lastModified: new Date(book.updatedAt)
  }));

  const categoryEntries = categories.map((category) => ({
    url: `${appUrl}/categories/${category.slug}`,
    lastModified: category.updatedAt ? new Date(category.updatedAt) : now
  }));

  return [...base, ...bookEntries, ...categoryEntries];
}
