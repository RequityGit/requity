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

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return `${d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} at ${d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRatio(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Number(value).toFixed(2)}x`;
}

// ── Edit-mode helpers (used inside currency inputs) ──

/** Format a number with commas for display inside edit inputs. No currency symbol, empty string for null. */
export function formatEditNumber(val: unknown, maxDecimals = 2): string {
  if (val == null || val === "") return "";
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}

/** Parse a currency input string, stripping non-numeric chars. Returns null for empty/invalid. */
export function parseEditCurrency(raw: string): number | null {
  const stripped = raw.replace(/[^0-9.\-]/g, "");
  if (stripped === "" || stripped === "-") return null;
  const n = Number(stripped);
  return isNaN(n) ? null : n;
}

/** Format an ISO date string (YYYY-MM-DD) for inline display without timezone shift. */
export function formatDateInline(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
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

export interface AddressParts {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

/**
 * Formats address parts into a single string, deduplicating city/state/zip
 * if they already appear in the street field.
 *
 * Handles the common data issue where `street` contains a full address like
 * "123 Main St, Denver, CO 80202" and city/state/zip are also provided separately.
 */
export function formatAddress(parts: AddressParts): string {
  let street = parts.street?.trim() || "";
  const city = parts.city?.trim() || "";
  const state = parts.state?.trim() || "";
  const zip = parts.zip?.trim() || "";

  // If we have city or state, check if the street field already ends with them
  if (street && (city || state)) {
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let suffixPattern: RegExp | null = null;
    if (city && state && zip) {
      suffixPattern = new RegExp(
        `,?\\s*${esc(city)},?\\s*${esc(state)}\\s*${esc(zip)}\\s*$`,
        "i"
      );
    } else if (city && state) {
      suffixPattern = new RegExp(
        `,?\\s*${esc(city)},?\\s*${esc(state)}\\s*$`,
        "i"
      );
    } else if (state && zip) {
      suffixPattern = new RegExp(
        `,?\\s*${esc(state)}\\s*${esc(zip)}\\s*$`,
        "i"
      );
    } else if (state) {
      suffixPattern = new RegExp(`,?\\s*${esc(state)}\\s*$`, "i");
    }

    if (suffixPattern) {
      const stripped = street.replace(suffixPattern, "").trim();
      if (stripped.length > 0) {
        street = stripped;
      }
    }
  }

  const cityState = [city, state].filter(Boolean).join(", ");
  const line2 = [cityState, zip].filter(Boolean).join(" ");
  if (!street && !line2) return "";
  return [street, line2].filter(Boolean).join(", ");
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

    case "select": {
      const ACRONYMS: Record<string, boolean> = { sfr: true, mhc: true, rv: true };
      return String(value)
        .replace(/_/g, " ")
        .split(" ")
        .map((w) => (ACRONYMS[w] ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(" ");
    }

    default:
      return String(value);
  }
}
