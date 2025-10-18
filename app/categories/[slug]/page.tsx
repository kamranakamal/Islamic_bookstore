import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCard } from "@/components/site/BookCard";
import { getCategoryWithBooks } from "@/lib/data/categories";
import type { PageParams } from "@/lib/types";
import { appUrl } from "@/lib/config";

export const revalidate = 60;

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const category = await getCategoryWithBooks(params.slug);
  if (!category) return { title: "Category not found" };

  const canonical = `${appUrl}/categories/${params.slug}`;

  return {
    title: `${category.name} books`,
    description: category.description,
    alternates: {
      canonical
    },
    openGraph: {
      title: `${category.name} books`,
      description: category.description,
      url: canonical
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} books`,
      description: category.description
    }
  };
}

export default async function CategoryPage({ params }: PageParams) {
  const category = await getCategoryWithBooks(params.slug);
  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
              { "@type": "ListItem", position: 2, name: category.name, item: `${appUrl}/categories/${category.slug}` }
            ]
          })
        }}
      />
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">{category.name}</h1>
          <p className="max-w-2xl text-gray-600">{category.description}</p>
        </div>
        <Link href="/order-request" className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Request bulk order
        </Link>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {category.books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
