import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCard } from "@/components/site/BookCard";
import { getCategoryWithBooks } from "@/lib/data/categories";
import type { PageParams } from "@/lib/types";

export const revalidate = 120;

export async function generateMetadata({ params }: PageParams) {
  const category = await getCategoryWithBooks(params.slug);
  if (!category) return { title: "Category not found" };

  return {
    title: `${category.name} books`,
    description: category.description
  };
}

export default async function CategoryPage({ params }: PageParams) {
  const category = await getCategoryWithBooks(params.slug);
  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-10">
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
