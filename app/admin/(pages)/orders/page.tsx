import { OrdersList } from "@/components/admin/OrdersList";
import { getAdminOrders } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Order requests</h1>
        <p className="text-sm text-gray-600">Review, approve, and update manual order requests.</p>
      </header>
      <OrdersList orders={orders} />
    </div>
  );
}
