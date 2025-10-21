import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

import { BulkOrdersManager } from "@/components/admin/BulkOrdersManager";
import { getAdminBulkOrderRequests } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminBulkOrdersPage() {
  const requests = await getAdminBulkOrderRequests();
  const queryClient = new QueryClient();
  queryClient.setQueryData(["admin-bulk-orders"], requests);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bulk order requests</h1>
          <p className="text-sm text-gray-600">
            Review bulk and institutional queries, respond quickly, and keep their status up to date.
          </p>
        </div>
      </header>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BulkOrdersManager requests={requests} />
      </HydrationBoundary>
    </div>
  );
}
