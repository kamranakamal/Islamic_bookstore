"use client";

import clsx from "clsx";

import { useCurrency } from "@/components/currency/CurrencyProvider";
import type { BookDetail } from "@/lib/types";

interface BookPricingSummaryProps {
  book: Pick<
    BookDetail,
    "priceLocalInr" | "priceInternationalUsd" | "priceFormattedLocal" | "priceFormattedInternational"
  >;
  isInStock: boolean;
}

export function BookPricingSummary({ book, isInStock }: BookPricingSummaryProps) {
  const { currency, getBookPrice, formatAmount } = useCurrency();
  const price = getBookPrice(book);
  const localInr = formatAmount(book.priceLocalInr, "INR");
  const usdAmount = formatAmount(book.priceInternationalUsd, "USD");

  const statusClasses = clsx(
    "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
    isInStock ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
  );

  const contextLine = currency === "INR"
    ? (
        <>
          International customers:
          <span className="ml-1 font-medium text-gray-600">{usdAmount}</span>
        </>
      )
    : (
        <>
          Local price (INR):
          <span className="ml-1 font-medium text-gray-600">{localInr}</span>
        </>
      );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-[13px] font-medium uppercase tracking-wide text-gray-500">Pricing ({currency})</p>
        <span className={statusClasses}>{isInStock ? "Available" : "Waitlist"}</span>
      </div>
      <p className="text-2xl font-semibold text-primary sm:text-3xl">{price.formatted}</p>
      <p className="text-xs text-gray-500">{contextLine}</p>
    </div>
  );
}
