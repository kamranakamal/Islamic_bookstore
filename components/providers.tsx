"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { ReactNode, useState } from "react";

import { SupabaseListener } from "@/components/SupabaseListener";

interface ProvidersProps {
  children: ReactNode;
  serverSession: Session | null;
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
