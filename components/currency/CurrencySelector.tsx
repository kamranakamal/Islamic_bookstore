"use client";

import clsx from "clsx";

import { useCurrency } from "@/components/currency/CurrencyProvider";

interface CurrencySelectorProps {
  className?: string;
}

export function CurrencySelector({ className }: CurrencySelectorProps) {
  const { currency, options, setCurrency } = useCurrency();

  return (
    <div className={clsx("flex items-center gap-2 text-xs text-slate-300", className)}>
      <label htmlFor="footer-currency" className="font-semibold uppercase tracking-[0.28em] text-slate-400">
        Currency
      </label>
      <div className="relative">
        <select
          id="footer-currency"
          value={currency}
          onChange={(event) => {
            const value = event.target.value as typeof currency;
            void setCurrency(value);
          }}
          className="appearance-none rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-100 transition hover:border-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {options.map((option) => (
            <option key={option.code} value={option.code} className="bg-slate-900 text-slate-100">
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-slate-500">▾</span>
      </div>
    </div>
  );
}
