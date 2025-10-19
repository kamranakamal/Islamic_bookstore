import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminBooksLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Spinner label="Preparing book manager" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <div className="space-y-4 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
        <div className="space-y-4 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
