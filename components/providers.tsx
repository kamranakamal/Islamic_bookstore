"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

import { CurrencyProvider } from "@/components/currency/CurrencyProvider";
import { SupabaseListener } from "@/components/SupabaseListener";
import type { SupportedCurrency } from "@/lib/currency";
import type { SessionTokens } from "@/lib/types";

interface ProvidersProps {
  children: ReactNode;
  serverSession: SessionTokens | null;
  initialCurrency: SupportedCurrency;
}

export function Providers({ children, serverSession, initialCurrency }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <CurrencyProvider initialCurrency={initialCurrency}>
      <QueryClientProvider client={queryClient}>
        <SupabaseListener serverSession={serverSession} />
        {children}
      </QueryClientProvider>
    </CurrencyProvider>
  );
}
