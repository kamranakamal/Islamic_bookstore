import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

import { BooksManager } from "@/components/admin/BooksManager";
import { getAdminBooksData } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage() {
  const data = await getAdminBooksData();
  const queryClient = new QueryClient();
  queryClient.setQueryData(["admin-books"], data);

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Manage books</h1>
          <p className="mt-1 text-sm text-gray-600">Add new titles, update metadata, and curate featured works.</p>
        </div>
        <a
          href="/api/admin/books/export"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10 sm:w-auto"
        >
          <span aria-hidden="true">⬇️</span>
          <span>Export catalog CSV</span>
        </a>
      </header>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BooksManager books={data.books} categories={data.categories} />
      </HydrationBoundary>
    </div>
  );
}
