import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

import { BooksManager } from "@/components/admin/BooksManager";
import { getAdminBooksData } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage() {
  const data = await getAdminBooksData();
  const queryClient = new QueryClient();
  queryClient.setQueryData(["admin-books"], data);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manage books</h1>
          <p className="text-sm text-gray-600">Add new titles, update metadata, and curate featured works.</p>
        </div>
        <a
          href="/api/admin/books/export"
          className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
        >
          <span aria-hidden="true">⬇️</span>
          Export catalog CSV
        </a>
      </header>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BooksManager books={data.books} categories={data.categories} />
      </HydrationBoundary>
    </div>
  );
}
