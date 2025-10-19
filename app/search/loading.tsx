import { BookCardSkeleton } from "@/components/site/BookCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

export default function SearchLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Spinner label="Searching the catalogue" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <BookCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
