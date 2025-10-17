import type { AdminAnalyticsSnapshot } from "@/lib/types";

interface AnalyticsPanelProps {
  snapshot: AdminAnalyticsSnapshot;
}

export function AnalyticsPanel({ snapshot }: AnalyticsPanelProps) {
  return (
    <section className="grid gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Total titles</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{snapshot.totalBooks}</p>
        <p className="mt-1 text-xs text-gray-500">Books currently published in the catalog.</p>
      </div>
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Pending orders</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{snapshot.totalOrdersPending}</p>
        <p className="mt-1 text-xs text-gray-500">Manual requests waiting for action.</p>
      </div>
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Team members</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{snapshot.totalUsers}</p>
        <p className="mt-1 text-xs text-gray-500">Profiles with admin workspace access.</p>
      </div>
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 xl:col-span-1 xl:row-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Most requested titles</p>
        {snapshot.mostRequestedTitles.length ? (
          <ol className="mt-3 space-y-2 text-sm text-gray-700">
            {snapshot.mostRequestedTitles.map((item) => (
              <li key={item.title} className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2">
                <span className="line-clamp-2 pr-3 font-medium text-gray-800">{item.title}</span>
                <span className="text-xs font-semibold text-gray-500">×{item.count}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No recent order activity recorded.</p>
        )}
      </div>
    </section>
  );
}
