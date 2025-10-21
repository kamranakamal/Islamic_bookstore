import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

import { OrdersList } from "@/components/admin/OrdersList";
import { getAdminOrders } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();
  const queryClient = new QueryClient();
  queryClient.setQueryData(["admin-orders"], orders);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Order requests</h1>
          <p className="text-sm text-gray-600">Review, approve, and update manual order requests.</p>
        </div>
        <a
          href="/api/admin/orders/export"
          className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
        >
          <span aria-hidden="true">⬇️</span>
          Export orders CSV
        </a>
      </header>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <OrdersList orders={orders} />
      </HydrationBoundary>
    </div>
  );
}
