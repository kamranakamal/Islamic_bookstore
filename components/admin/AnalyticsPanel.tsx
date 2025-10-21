import { getBookLanguageLabel, type AdminAnalyticsSnapshot } from "@/lib/types";

interface AnalyticsPanelProps {
  snapshot: AdminAnalyticsSnapshot;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("en-IN");

export function AnalyticsPanel({ snapshot }: AnalyticsPanelProps) {
  const statCards: Array<{ label: string; value: number | string; hint: string }> = [
    { label: "Total titles", value: numberFormatter.format(snapshot.totalBooks), hint: "Books currently published." },
    {
      label: "New (30 days)",
      value: numberFormatter.format(snapshot.newBooksLast30Days),
      hint: "Fresh titles added in the last month."
    },
    { label: "Featured titles", value: numberFormatter.format(snapshot.featuredBooks), hint: "Highlighted picks." },
    { label: "Pending orders", value: numberFormatter.format(snapshot.totalOrdersPending), hint: "Awaiting approval." },
    { label: "Orders placed", value: numberFormatter.format(snapshot.totalOrders), hint: "All-time order count." },
    { label: "Order items", value: numberFormatter.format(snapshot.totalOrderItems), hint: "Units requested or sold." },
    { label: "Team members", value: numberFormatter.format(snapshot.totalUsers), hint: "Profiles with access." },
    {
      label: "Est. local revenue",
      value: currencyFormatter.format(snapshot.estimatedLocalRevenue),
      hint: "Confirmed, processing, shipped, or delivered orders (INR)."
    }
  ];

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
            <p className="mt-1 text-xs text-gray-500">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Books by category</h3>
          {snapshot.booksByCategory.length ? (
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {snapshot.booksByCategory.map((item) => (
                <li key={item.category} className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
                  <span className="font-medium text-gray-800">{item.category}</span>
                  <span className="text-xs font-semibold text-gray-500">{numberFormatter.format(item.count)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No categories recorded yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Books by language</h3>
          {snapshot.booksByLanguage.length ? (
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {snapshot.booksByLanguage.map((item) => (
                <li key={item.language} className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
                  <span className="font-medium text-gray-800">{getBookLanguageLabel(item.language)}</span>
                  <span className="text-xs font-semibold text-gray-500">{numberFormatter.format(item.count)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No language data available.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Orders by status</h3>
          {snapshot.ordersByStatus.length ? (
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {snapshot.ordersByStatus.map((item) => (
                <li key={item.status} className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
                  <span className="font-medium capitalize text-gray-800">{item.status}</span>
                  <span className="text-xs font-semibold text-gray-500">{numberFormatter.format(item.count)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No orders recorded.</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Most requested titles</h3>
          {snapshot.mostRequestedTitles.length ? (
            <ol className="mt-3 space-y-2 text-sm text-gray-700">
              {snapshot.mostRequestedTitles.map((item) => (
                <li key={item.title} className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
                  <span className="line-clamp-2 pr-3 font-medium text-gray-800">{item.title}</span>
                  <span className="text-xs font-semibold text-gray-500">×{numberFormatter.format(item.count)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No recent order activity recorded.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Recent books</h3>
        {snapshot.recentBooks.length ? (
          <ul className="mt-3 divide-y divide-gray-100 text-sm text-gray-700">
            {snapshot.recentBooks.map((book) => (
              <li key={book.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-gray-900">{book.title}</p>
                  <p className="text-xs text-gray-500">
                    {book.category ?? "Uncategorized"} · {new Date(book.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {book.isFeatured ? "Featured" : "Standard"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No books have been added recently.</p>
        )}
      </div>
    </section>
  );
}
