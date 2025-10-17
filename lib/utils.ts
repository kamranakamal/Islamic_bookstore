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
