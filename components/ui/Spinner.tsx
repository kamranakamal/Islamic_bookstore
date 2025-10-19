import clsx from "clsx";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  label?: string;
  className?: string;
  size?: SpinnerSize;
}

const SIZE_MAP: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]"
};

export function Spinner({ label, className, size = "md" }: SpinnerProps) {
  const spinnerClass = SIZE_MAP[size];

  return (
    <div role="status" aria-live="polite" className={clsx("inline-flex items-center gap-3", className)}>
      <span
        className={clsx(
          "inline-block animate-spin rounded-full border-primary border-t-transparent",
          spinnerClass
        )}
        aria-hidden="true"
      />
      {label ? <span className="text-sm font-medium text-gray-600">{label}</span> : null}
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  );
}
