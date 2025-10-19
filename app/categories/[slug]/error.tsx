"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/ErrorState";

interface CategoryErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CategoryError({ error, reset }: CategoryErrorProps) {
  useEffect(() => {
    console.error("Category page error", error);
  }, [error]);

  return (
    <ErrorState
      title="Category not available"
      message="We're unable to show books in this category right now. Please reload or pick another category."
      onRetry={reset}
      retryLabel="Reload"
      className="mx-auto mt-16 max-w-xl"
    />
  );
}
