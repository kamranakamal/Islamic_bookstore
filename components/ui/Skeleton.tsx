import clsx from "clsx";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={clsx(
        "animate-pulse rounded-xl bg-slate-200/70 ring-1 ring-inset ring-white/60",
        className
      )}
    />
  );
}
