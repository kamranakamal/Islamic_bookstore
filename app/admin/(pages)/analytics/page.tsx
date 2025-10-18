import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";
import { getAdminAnalytics } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-600">Monitor catalog performance, search trends, and fulfilment status.</p>
      </header>
      <AnalyticsPanel snapshot={analytics} />
    </div>
  );
}
