export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
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
  if (amount == null) return "—";
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

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short" });
}

// ── Field value formatting for read-mode display ──

export function isFieldEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    value === 0 ||
    value === "0" ||
    value === 0.0
  );
}

const FINANCIAL_FIELD_TYPES = new Set(["currency", "percent", "percentage", "number"]);

export function isFinancialFieldType(fieldType: string): boolean {
  return FINANCIAL_FIELD_TYPES.has(fieldType);
}

export function formatFieldValue(value: unknown, fieldType: string): string {
  if (isFieldEmpty(value)) return "";

  switch (fieldType) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(Number(value));

    case "percent":
    case "percentage":
      return `${Number(value).toFixed(2)}%`;

    case "number":
      return new Intl.NumberFormat("en-US").format(Number(value));

    case "date": {
      const d = new Date(String(value));
      if (isNaN(d.getTime())) return String(value);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(d);
    }

    case "phone": {
      const digits = String(value).replace(/\D/g, "");
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      return String(value);
    }

    case "boolean":
      return value ? "Yes" : "No";

    case "select":
      return String(value).replace(/_/g, " ");

    default:
      return String(value);
  }
}
