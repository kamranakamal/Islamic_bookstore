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
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Manage books</h1>
        <p className="text-sm text-gray-600">Add new titles, update metadata, and curate featured works.</p>
      </header>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BooksManager books={data.books} categories={data.categories} />
      </HydrationBoundary>
    </div>
  );
}
