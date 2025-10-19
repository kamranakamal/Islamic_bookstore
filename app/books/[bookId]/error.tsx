"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/ErrorState";

interface BookErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BookError({ error, reset }: BookErrorProps) {
  useEffect(() => {
    console.error("Book details error", error);
  }, [error]);

  return (
    <ErrorState
      title="We couldn't load that book"
      message="Please refresh the page or return later while we restore the book details."
      onRetry={reset}
      retryLabel="Try again"
      className="mx-auto mt-16 max-w-xl"
    />
  );
}
