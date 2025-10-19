"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/ErrorState";

interface SearchErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SearchError({ error, reset }: SearchErrorProps) {
  useEffect(() => {
    console.error("Search page error", error);
  }, [error]);

  return (
    <ErrorState
      title="Search temporarily unavailable"
      message="We couldn't retrieve results right now. Please refresh or adjust your query in a moment."
      onRetry={reset}
      retryLabel="Retry search"
      className="mx-auto mt-16 max-w-xl"
    />
  );
}
