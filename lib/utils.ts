export const formatCurrency = (value: number, currency: string = "USD") => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  });
  return formatter.format(value / 100);
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US").format(value);
};

const longDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

export const formatDateLong = (value?: string | Date | null): string | null => {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return longDateFormatter.format(date);
};
