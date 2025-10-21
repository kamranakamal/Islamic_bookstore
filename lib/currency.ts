export type SupportedCurrency =
  | "INR"
  | "USD"
  | "PKR"
  | "NPR"
  | "BDT"
  | "AED"
  | "SAR"
  | "GBP"
  | "EUR"
  | "CAD"
  | "AUD"
  | "MYR"
  | "SGD";

export interface CurrencyInfo {
  code: SupportedCurrency;
  label: string;
  country: string;
  locale: string;
  /**
   * Conversion rate for 1 USD expressed in the target currency.
   * Example: if 1 USD = 83 INR, the rate is 83.
   */
  usdRate: number;
  /** Whether to prefer the local INR pricing column instead of converting from USD. */
  usesLocalPricing?: boolean;
}

export const CURRENCY_COOKIE_NAME = "mm_currency";
export const DEFAULT_CURRENCY: SupportedCurrency = "USD";

const CURRENCY_CONFIG: Record<SupportedCurrency, CurrencyInfo> = {
  INR: {
    code: "INR",
    label: "INR - India",
    country: "India",
    locale: "en-IN",
    usdRate: 83,
    usesLocalPricing: true
  },
  USD: {
    code: "USD",
    label: "USD - USA",
    country: "United States",
    locale: "en-US",
    usdRate: 1
  },
  PKR: {
    code: "PKR",
    label: "PKR - Pakistan",
    country: "Pakistan",
    locale: "en-PK",
    usdRate: 278
  },
  NPR: {
    code: "NPR",
    label: "NPR - Nepal",
    country: "Nepal",
    locale: "en-NP",
    usdRate: 134
  },
  BDT: {
    code: "BDT",
    label: "BDT - Bangladesh",
    country: "Bangladesh",
    locale: "en-BD",
    usdRate: 110
  },
  AED: {
    code: "AED",
    label: "AED - United Arab Emirates",
    country: "United Arab Emirates",
    locale: "en-AE",
    usdRate: 3.67
  },
  SAR: {
    code: "SAR",
    label: "SAR - Saudi Arabia",
    country: "Saudi Arabia",
    locale: "en-SA",
    usdRate: 3.75
  },
  GBP: {
    code: "GBP",
    label: "GBP - United Kingdom",
    country: "United Kingdom",
    locale: "en-GB",
    usdRate: 0.79
  },
  EUR: {
    code: "EUR",
    label: "EUR - Europe",
    country: "Eurozone",
    locale: "en-IE",
    usdRate: 0.93
  },
  CAD: {
    code: "CAD",
    label: "CAD - Canada",
    country: "Canada",
    locale: "en-CA",
    usdRate: 1.36
  },
  AUD: {
    code: "AUD",
    label: "AUD - Australia",
    country: "Australia",
    locale: "en-AU",
    usdRate: 1.55
  },
  MYR: {
    code: "MYR",
    label: "MYR - Malaysia",
    country: "Malaysia",
    locale: "en-MY",
    usdRate: 4.75
  },
  SGD: {
    code: "SGD",
    label: "SGD - Singapore",
    country: "Singapore",
    locale: "en-SG",
    usdRate: 1.36
  }
};

const COUNTRY_TO_CURRENCY = new Map<string, SupportedCurrency>([
  ["IN", "INR"],
  ["PK", "PKR"],
  ["NP", "NPR"],
  ["BD", "BDT"],
  ["AE", "AED"],
  ["SA", "SAR"],
  ["GB", "GBP"],
  ["IE", "EUR"],
  ["FR", "EUR"],
  ["ES", "EUR"],
  ["IT", "EUR"],
  ["DE", "EUR"],
  ["NL", "EUR"],
  ["BE", "EUR"],
  ["PT", "EUR"],
  ["AT", "EUR"],
  ["FI", "EUR"],
  ["GR", "EUR"],
  ["LU", "EUR"],
  ["US", "USD"],
  ["CA", "CAD"],
  ["AU", "AUD"],
  ["NZ", "AUD"],
  ["MY", "MYR"],
  ["SG", "SGD"],
  ["ZA", "USD"],
  ["QA", "AED"],
  ["KW", "AED"],
  ["BH", "AED"],
  ["OM", "AED"]
]);

const formatterCache = new Map<SupportedCurrency, Intl.NumberFormat>();

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  if (typeof value !== "string") {
    return false;
  }
  const code = value.toUpperCase() as SupportedCurrency;
  return Boolean((CURRENCY_CONFIG as Record<string, CurrencyInfo>)[code]);
}

export function getCurrencyInfo(code: SupportedCurrency): CurrencyInfo {
  return CURRENCY_CONFIG[code];
}

export function getCurrencyOptions(): Array<{ code: SupportedCurrency; label: string }> {
  return Object.values(CURRENCY_CONFIG).map((entry) => ({
    code: entry.code,
    label: entry.label
  }));
}

export function detectCurrencyFromHeaders(headersList: Headers): SupportedCurrency | null {
  const directCountry =
    headersList.get("x-vercel-ip-country") ||
    headersList.get("x-country-code") ||
    headersList.get("cloudfront-viewer-country") ||
    headersList.get("cf-ipcountry");

  const normalized = directCountry?.trim().toUpperCase();
  if (normalized && COUNTRY_TO_CURRENCY.has(normalized)) {
    return COUNTRY_TO_CURRENCY.get(normalized) ?? null;
  }

  const acceptLanguage = headersList.get("accept-language") ?? "";
  const inferred = Array.from(COUNTRY_TO_CURRENCY.entries()).find(([country]) =>
    acceptLanguage.toLowerCase().includes(`-${country.toLowerCase()}`)
  );

  if (inferred) {
    return inferred[1];
  }

  return null;
}

function getFormatter(currency: SupportedCurrency) {
  if (!formatterCache.has(currency)) {
    const info = getCurrencyInfo(currency);
    formatterCache.set(
      currency,
      new Intl.NumberFormat(info.locale, {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 2
      })
    );
  }
  return formatterCache.get(currency)!;
}

export function formatAmount(amount: number, currency: SupportedCurrency): string {
  return getFormatter(currency).format(amount);
}

function ensureUsdPrice(priceInternationalUsd: number, priceLocalInr: number): number {
  if (priceInternationalUsd > 0) {
    return priceInternationalUsd;
  }
  const inrInfo = getCurrencyInfo("INR");
  if (priceLocalInr > 0) {
    return priceLocalInr / inrInfo.usdRate;
  }
  return 0;
}

function ensureInrPrice(priceLocalInr: number, priceInternationalUsd: number): number {
  if (priceLocalInr > 0) {
    return priceLocalInr;
  }
  const inrInfo = getCurrencyInfo("INR");
  if (priceInternationalUsd > 0) {
    return priceInternationalUsd * inrInfo.usdRate;
  }
  return 0;
}

export interface BookPricingInput {
  priceLocalInr: number;
  priceInternationalUsd: number;
}

export interface ComputedPrice {
  amount: number;
  formatted: string;
  currencyCode: SupportedCurrency;
  baseUsdAmount: number;
  usedLocalPricing: boolean;
}

export function computeBookPrice(
  source: BookPricingInput,
  currency: SupportedCurrency,
  quantity = 1
): ComputedPrice {
  const usdBase = ensureUsdPrice(source.priceInternationalUsd, source.priceLocalInr);
  const usdTotal = usdBase * Math.max(1, quantity);

  if (currency === "INR") {
    const inrAmount = ensureInrPrice(source.priceLocalInr, source.priceInternationalUsd) * Math.max(1, quantity);
    return {
      amount: inrAmount,
      formatted: formatAmount(inrAmount, "INR"),
      currencyCode: "INR",
      baseUsdAmount: usdTotal,
      usedLocalPricing: source.priceLocalInr > 0
    };
  }

  const info = getCurrencyInfo(currency);
  const amount = usdTotal * info.usdRate;
  return {
    amount,
    formatted: formatAmount(amount, currency),
    currencyCode: currency,
    baseUsdAmount: usdTotal,
    usedLocalPricing: false
  };
}

export function convertFromUsd(amountUsd: number, currency: SupportedCurrency): number {
  const info = getCurrencyInfo(currency);
  return amountUsd * info.usdRate;
}

export function getCurrencyLabel(code: SupportedCurrency): string {
  return getCurrencyInfo(code).label;
}
