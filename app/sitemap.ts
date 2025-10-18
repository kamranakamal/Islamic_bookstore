import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/config";
import { listBookSlugs } from "@/lib/data/books";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await listBookSlugs();

  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    {
      url: appUrl,
      lastModified: now
    },
    {
      url: `${appUrl}/cart`,
      lastModified: now
    },
    {
      url: `${appUrl}/bulk-order`,
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

  return [...base, ...bookEntries];
}
