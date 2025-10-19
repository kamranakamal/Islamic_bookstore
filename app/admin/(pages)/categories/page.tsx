import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { getAdminCategories } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();
  const queryClient = new QueryClient();
  queryClient.setQueryData(["admin-categories"], categories);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Manage categories</h1>
        <p className="text-sm text-gray-600">Create and organise the catalog structure used across the site.</p>
      </header>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CategoriesManager categories={categories} />
      </HydrationBoundary>
    </div>
  );
}
