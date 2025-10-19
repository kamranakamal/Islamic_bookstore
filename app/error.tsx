"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/ErrorState";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global application error", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-4 py-16 sm:px-6">
      <ErrorState
        title="We're having trouble loading this page"
        message="Our team has been notified. Please try again or come back shortly."
        onRetry={reset}
        retryLabel="Reload page"
      />
    </div>
  );
}
