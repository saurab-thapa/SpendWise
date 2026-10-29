// Convert To Minor Units
export function toMinor(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round(number * 100);
}

// Format Money
export function formatMoney(amountMinor, currency = "INR") {
  const locale = currency === "INR" ? "en-IN" : undefined;
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format((amountMinor || 0) / 100);
}
