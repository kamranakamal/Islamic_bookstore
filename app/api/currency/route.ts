import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  CURRENCY_COOKIE_NAME,
  DEFAULT_CURRENCY,
  detectCurrencyFromHeaders,
  isSupportedCurrency,
  type SupportedCurrency
} from "@/lib/currency";

const payloadSchema = z.object({
  currency: z.string().min(3).max(4)
});

export async function POST(request: Request) {
  const cookieStore = cookies();
  const headersList = request.headers;

  let selectedCurrency: SupportedCurrency | null = null;

  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);
    if (parsed.success && isSupportedCurrency(parsed.data.currency)) {
      selectedCurrency = parsed.data.currency.toUpperCase() as SupportedCurrency;
    }
  } catch {
    selectedCurrency = null;
  }

  if (!selectedCurrency) {
    selectedCurrency = detectCurrencyFromHeaders(headersList) ?? DEFAULT_CURRENCY;
  }

  cookieStore.set({
    name: CURRENCY_COOKIE_NAME,
    value: selectedCurrency,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax"
  });

  return NextResponse.json({ currency: selectedCurrency });
}
