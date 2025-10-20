import { PaymentsManager } from "@/components/admin/PaymentsManager";
import { getAdminCheckoutPreferences } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const preferences = await getAdminCheckoutPreferences();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Checkout payments</h1>
        <p className="text-sm text-gray-600">
          Monitor the checkout submissions from customers and coordinate their payments and deliveries.
        </p>
      </header>
      <PaymentsManager preferences={preferences} />
    </div>
  );
}
