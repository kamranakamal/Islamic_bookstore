import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminOrdersLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Spinner label="Fetching recent orders" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </header>
      <div className="space-y-4 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
