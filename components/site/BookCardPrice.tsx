"use client";

import { useMemo } from "react";

import { useCurrency } from "@/components/currency/CurrencyProvider";

interface BookCardPriceProps {
  priceLocalInr: number;
  priceInternationalUsd: number;
}

export function BookCardPrice({ priceLocalInr, priceInternationalUsd }: BookCardPriceProps) {
  const { getBookPrice } = useCurrency();
  const price = useMemo(() => getBookPrice({ priceLocalInr, priceInternationalUsd }), [getBookPrice, priceInternationalUsd, priceLocalInr]);

  return <p className="text-sm font-semibold text-primary sm:text-base">{price.formatted}</p>;
}
