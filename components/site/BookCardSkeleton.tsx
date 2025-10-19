import { Skeleton } from "@/components/ui/Skeleton";

export function BookCardSkeleton() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-sm ring-1 ring-white/60 backdrop-blur">
      <div className="relative aspect-[3/4] w-full bg-gray-100">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:gap-2 sm:p-5">
        <Skeleton className="h-5 w-3/4 sm:h-6" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-2/3 sm:h-4" />
        <div className="mt-auto space-y-2">
          <Skeleton className="h-9 w-full rounded-full" />
        </div>
      </div>
    </article>
  );
}
