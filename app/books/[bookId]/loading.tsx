import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

export default function BookLoading() {
  return (
    <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
      <article className="space-y-6">
        <Spinner label="Loading book details" />
        <Skeleton className="aspect-[3/4] w-full rounded-2xl lg:max-w-sm" />
        <div className="space-y-3 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-4 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </article>
      <aside className="space-y-4 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-full rounded-full" />
        <Skeleton className="h-10 w-full rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </aside>
    </div>
  );
}
