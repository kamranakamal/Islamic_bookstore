import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminBlogLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Spinner label="Loading blog posts" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="space-y-4 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-9/12" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
