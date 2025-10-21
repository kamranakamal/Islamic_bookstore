"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  CURRENCY_COOKIE_NAME,
  computeBookPrice,
  formatAmount as formatCurrencyAmount,
  getCurrencyLabel,
  getCurrencyOptions,
  type BookPricingInput,
  type ComputedPrice,
  type SupportedCurrency
} from "@/lib/currency";

interface CurrencyContextValue {
  currency: SupportedCurrency;
  options: Array<{ code: SupportedCurrency; label: string }>;
  setCurrency: (currency: SupportedCurrency) => Promise<void>;
  getBookPrice: (source: BookPricingInput, quantity?: number) => ComputedPrice;
  formatAmount: (amount: number, currency?: SupportedCurrency) => string;
  getCurrencyLabel: (currency: SupportedCurrency) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

interface CurrencyProviderProps {
  initialCurrency: SupportedCurrency;
  children: ReactNode;
}

export function CurrencyProvider({ initialCurrency, children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(initialCurrency);
  const options = useMemo(() => getCurrencyOptions(), []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const cookiePrefix = `${CURRENCY_COOKIE_NAME}=`;
    const existing = document.cookie.split("; ").find((entry) => entry.startsWith(cookiePrefix));
    const currentValue = existing ? decodeURIComponent(existing.slice(cookiePrefix.length)) : null;
    if (currentValue && currentValue.toUpperCase() === initialCurrency) {
      return;
    }

    const controller = new AbortController();

    const persistInitialCurrency = async () => {
      try {
        await fetch("/api/currency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currency: initialCurrency }),
          signal: controller.signal
        });
      } catch (error) {
        if ((error as DOMException | undefined)?.name !== "AbortError") {
          console.warn("Failed to persist initial currency preference", error);
        }
      }
    };

    void persistInitialCurrency();

    return () => controller.abort();
  }, [initialCurrency]);

  const setCurrency = useCallback(async (next: SupportedCurrency) => {
    if (currency === next) {
      return;
    }
    setCurrencyState(next);
    try {
      await fetch("/api/currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: next })
      });
    } catch (error) {
      console.warn("Failed to persist currency preference", error);
    }
  }, [currency]);

  const value = useMemo<CurrencyContextValue>(() => {
    return {
      currency,
      options,
      setCurrency,
      getBookPrice: (source: BookPricingInput, quantity = 1) => computeBookPrice(source, currency, quantity),
      formatAmount: (amount: number, override?: SupportedCurrency) =>
        formatCurrencyAmount(amount, override ?? currency),
      getCurrencyLabel
    };
  }, [currency, options, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
