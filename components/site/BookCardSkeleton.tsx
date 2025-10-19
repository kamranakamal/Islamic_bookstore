import { Skeleton } from "@/components/ui/Skeleton";

export function BookCardSkeleton() {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm ring-1 ring-white/60 backdrop-blur-sm md:flex-row">
      <div className="relative h-56 w-full md:h-auto md:w-48 lg:w-56">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-4 w-1/3" />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>
    </article>
  );
}
