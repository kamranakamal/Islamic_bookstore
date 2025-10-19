"use client";

import clsx from "clsx";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content right now. Please try again in a moment.",
  onRetry,
  retryLabel = "Try again",
  className
}: ErrorStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-4 rounded-3xl border border-red-200/80 bg-red-50/80 p-8 text-center shadow-sm backdrop-blur-sm",
        className
      )}
      role="alert"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
        <span aria-hidden="true" className="text-2xl font-semibold">
          !
        </span>
        <span className="sr-only">Error icon</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-red-700">{title}</h2>
        <p className="max-w-md text-sm text-red-600">{message}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
