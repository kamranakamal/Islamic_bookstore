import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Spinner label="Aggregating analytics" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </header>
      <div className="grid gap-6 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm lg:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
