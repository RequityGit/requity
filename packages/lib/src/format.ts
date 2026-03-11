export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDetailed(
  amount: number | null | undefined
): string {
  if (amount == null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(2)}%`;
}

export function formatCompactCurrency(
  amount: number | null | undefined
): string {
  if (amount == null || amount === 0) return "TBD";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}k`;
  return `$${amount}`;
}

/**
 * Returns a relative time string for recent dates (< 7 days) or absolute date for older ones.
 * Use the returned `title` property as a hover tooltip to always show the absolute date.
 */
export function smartDate(date: string | null | undefined): { text: string; title: string } {
  if (!date) return { text: "—", title: "" };
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const absolute = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (diffMs < 0) return { text: absolute, title: absolute };
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / 60000);
      return { text: diffMins <= 1 ? "just now" : `${diffMins}m ago`, title: absolute };
    }
    return { text: `${diffHours}h ago`, title: absolute };
  }
  if (diffDays < 7) return { text: `${diffDays}d ago`, title: absolute };
  return { text: absolute, title: absolute };
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) return phone;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6)
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
