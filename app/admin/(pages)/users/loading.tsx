import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </header>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="mb-4 h-6 w-full" />
        ))}
      </div>
    </div>
  );
}
