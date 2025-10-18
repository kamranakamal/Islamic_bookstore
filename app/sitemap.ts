import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/config";
import { listBookIds } from "@/lib/data/books";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await listBookIds();

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
    url: `${appUrl}/books/${book.id}`,
    lastModified: new Date(book.updatedAt)
  }));

  return [...base, ...bookEntries];
}
