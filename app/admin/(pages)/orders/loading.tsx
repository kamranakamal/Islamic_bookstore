import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminOrdersLoading() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </header>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="mb-4 h-6 w-full" />
        ))}
      </div>
    </div>
  );
}
