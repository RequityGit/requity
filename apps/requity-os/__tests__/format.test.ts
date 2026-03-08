import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  formatPercent,
  formatCompactCurrency,
  formatPhoneNumber,
  formatPhoneInput,
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

// ─── Phone Number Formatting ───

describe("formatPhoneNumber", () => {
  it("formats 10-digit phone number", () => {
    expect(formatPhoneNumber("5551234567")).toBe("(555) 123-4567");
  });

  it("formats phone with existing formatting", () => {
    expect(formatPhoneNumber("555-123-4567")).toBe("(555) 123-4567");
  });

  it("returns em dash for null", () => {
    expect(formatPhoneNumber(null)).toBe("—");
  });

  it("returns em dash for undefined", () => {
    expect(formatPhoneNumber(undefined)).toBe("—");
  });

  it("returns raw value for non-10-digit numbers", () => {
    expect(formatPhoneNumber("12345")).toBe("12345");
  });

  it("handles phone with country code prefix", () => {
    // 11 digits — not reformatted
    expect(formatPhoneNumber("+15551234567")).toBe("+15551234567");
  });
});

describe("formatPhoneInput", () => {
  it("formats partial input — 3 digits", () => {
    expect(formatPhoneInput("555")).toBe("(555");
  });

  it("formats partial input — 6 digits", () => {
    expect(formatPhoneInput("555123")).toBe("(555) 123");
  });

  it("formats full 10 digits", () => {
    expect(formatPhoneInput("5551234567")).toBe("(555) 123-4567");
  });

  it("strips non-digit characters", () => {
    expect(formatPhoneInput("(555) 123-4567")).toBe("(555) 123-4567");
  });

  it("returns empty for empty input", () => {
    expect(formatPhoneInput("")).toBe("");
  });

  it("truncates at 10 digits", () => {
    expect(formatPhoneInput("55512345678")).toBe("(555) 123-4567");
  });

  it("handles single digit", () => {
    expect(formatPhoneInput("5")).toBe("(5");
  });
});
