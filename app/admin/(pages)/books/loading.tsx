import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminBooksLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="mt-4 h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
