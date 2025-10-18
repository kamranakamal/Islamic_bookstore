import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </header>
      <div className="grid gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
