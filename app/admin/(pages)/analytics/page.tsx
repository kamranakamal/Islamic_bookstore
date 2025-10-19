import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";
import { getAdminAnalytics } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-600">Monitor catalog performance, search trends, and fulfilment status.</p>
        </div>
        <a
          href="/api/admin/analytics/export"
          className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
        >
          <span aria-hidden="true">⬇️</span>
          Export as CSV
        </a>
      </header>
      <AnalyticsPanel snapshot={analytics} />
    </div>
  );
}
