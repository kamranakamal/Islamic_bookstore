import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminMessagesLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Spinner label="Syncing latest messages" />
        <Skeleton className="h-7 w-60" />
        <Skeleton className="h-4 w-96" />
      </header>
      <div className="space-y-4 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
