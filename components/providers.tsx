"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

import { SupabaseListener } from "@/components/SupabaseListener";
import type { SessionTokens } from "@/lib/types";

interface ProvidersProps {
  children: ReactNode;
  serverSession: SessionTokens | null;
}

export function Providers({ children, serverSession }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseListener serverSession={serverSession} />
      {children}
    </QueryClientProvider>
  );
}
