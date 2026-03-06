export function fmtCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n < 0) return `(${fmtCurrency(Math.abs(n))})`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtCurrencyDetail(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n < 0) return `(${fmtCurrencyDetail(Math.abs(n))})`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function fmtPct(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "—";
  return `${n.toFixed(decimals)}%`;
}

export function fmtMultiple(n: number | null | undefined): string {
  if (n == null || n === 0) return "—";
  return `${n.toFixed(2)}x`;
}

export function fmtNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

export function parseNumericInput(value: string): number {
  const cleaned = value.replace(/[$,%\s]/g, "").replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
