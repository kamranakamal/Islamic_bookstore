import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminMessagesLoading() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-7 w-60" />
        <Skeleton className="h-4 w-96" />
      </header>
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
