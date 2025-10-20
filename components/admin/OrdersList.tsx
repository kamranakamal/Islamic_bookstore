import type { AdminOrder } from "@/lib/types";

interface OrdersListProps {
  orders: AdminOrder[];
}

const STATUS_LABELS: Record<AdminOrder["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  shipped: "Shipped",
  cancelled: "Cancelled"
};

export function OrdersList({ orders }: OrdersListProps) {
  const sorted = orders.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!sorted.length) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Recent order requests</h2>
        <p className="mt-2 text-sm text-gray-500">No manual order requests have been submitted yet.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recent order requests</h2>
          <p className="text-sm text-gray-600">Track inbound manual orders and their fulfilment status.</p>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Institution</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Items</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Requested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sorted.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  <div>
                    <p>{order.fullName}</p>
                    {order.phone ? <p className="text-xs text-gray-500">{order.phone}</p> : null}
                    {order.shippingAddress ? (
                      <div className="mt-3 space-y-1 text-xs text-gray-500">
                        {order.shippingAddress.label ? (
                          <p className="font-semibold text-gray-600">{order.shippingAddress.label}</p>
                        ) : null}
                        {order.shippingAddress.fullName && order.shippingAddress.fullName !== order.fullName ? (
                          <p>{order.shippingAddress.fullName}</p>
                        ) : null}
                        {order.shippingAddress.line1 ? <p>{order.shippingAddress.line1}</p> : null}
                        {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
                        {(() => {
                          const locality = [order.shippingAddress.city, order.shippingAddress.state]
                            .filter(Boolean)
                            .join(", ");
                          const code = order.shippingAddress.postalCode ?? "";
                          if (!locality && !code) return null;
                          return <p>{`${locality}${code ? ` ${code}` : ""}`.trim()}</p>;
                        })()}
                        {order.shippingAddress.country ? <p>{order.shippingAddress.country}</p> : null}
                        {order.shippingAddress.phone && order.shippingAddress.phone !== order.phone ? (
                          <p>Alt phone: {order.shippingAddress.phone}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <a href={`mailto:${order.email}`} className="text-primary hover:underline">
                    {order.email}
                  </a>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{order.institution ?? "—"}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-700">
                  {order.items.reduce((total, item) => total + item.quantity, 0)}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
