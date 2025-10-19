import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminFaqLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Spinner label="Loading FAQ entries" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="space-y-3 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
          </div>
        ))}
      </div>
    </div>
  );
}
