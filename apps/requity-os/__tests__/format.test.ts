import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  formatPercent,
  formatCompactCurrency,
} from "@/lib/format";

describe("formatCurrency", () => {
  it("formats positive amounts without decimals", () => {
    expect(formatCurrency(1234567)).toBe("$1,234,567");
  });

  it("returns $0.00 for null", () => {
    expect(formatCurrency(null)).toBe("$0.00");
  });

  it("returns $0.00 for undefined", () => {
    expect(formatCurrency(undefined)).toBe("$0.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });
});

describe("formatCurrencyDetailed", () => {
  it("includes two decimal places", () => {
    expect(formatCurrencyDetailed(1234.5)).toBe("$1,234.50");
  });

  it("returns $0.00 for null", () => {
    expect(formatCurrencyDetailed(null)).toBe("$0.00");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2024-01-15T00:00:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("returns em dash for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns em dash for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("returns em dash for empty string", () => {
    expect(formatDate("")).toBe("—");
  });
});

describe("formatPercent", () => {
  it("formats with two decimal places and % sign", () => {
    expect(formatPercent(8.5)).toBe("8.50%");
  });

  it("returns em dash for null", () => {
    expect(formatPercent(null)).toBe("—");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });
});

describe("formatCompactCurrency", () => {
  it("formats millions with M suffix", () => {
    expect(formatCompactCurrency(2_500_000)).toBe("$2.5M");
  });

  it("formats thousands with k suffix", () => {
    expect(formatCompactCurrency(750_000)).toBe("$750k");
  });

  it("returns TBD for null", () => {
    expect(formatCompactCurrency(null)).toBe("TBD");
  });

  it("returns TBD for zero", () => {
    expect(formatCompactCurrency(0)).toBe("TBD");
  });

  it("formats small amounts as plain dollars", () => {
    expect(formatCompactCurrency(500)).toBe("$500");
  });
});
