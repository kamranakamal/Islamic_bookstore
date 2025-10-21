import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminBulkOrdersLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Spinner label="Loading bulk order requests" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-72" />
      </header>
      <div className="space-y-4 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:space-y-0"
          >
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
