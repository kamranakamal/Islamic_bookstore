"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/ErrorState";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminPagesError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error("Admin dashboard error", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-4 py-12">
      <ErrorState
        title="Dashboard temporarily unavailable"
        message="Something went wrong while loading admin data. Please retry in a moment."
        onRetry={reset}
        retryLabel="Reload dashboard"
      />
    </div>
  );
}
