import { describe, it, expect } from "vitest";
import {
  sanitizeStorageName,
  buildStoragePath,
  formatFileSize,
  validateFile,
  isReviewInFlight,
  hasInFlightDocuments,
  MAX_FILE_SIZES,
  ACCEPTED_DOCUMENT_EXTENSIONS,
} from "@/lib/document-upload-utils";

// ─── sanitizeStorageName ───

describe("sanitizeStorageName", () => {
  it("preserves safe characters", () => {
    expect(sanitizeStorageName("report-2024.pdf")).toBe("report-2024.pdf");
  });

  it("replaces spaces with underscores", () => {
    expect(sanitizeStorageName("my report.pdf")).toBe("my_report.pdf");
  });

  it("replaces special characters", () => {
    expect(sanitizeStorageName("file (1) [copy].pdf")).toBe(
      "file__1___copy_.pdf"
    );
  });

  it("handles unicode characters", () => {
    expect(sanitizeStorageName("résumé.pdf")).toBe("r_sum_.pdf");
  });

  it("handles empty string", () => {
    expect(sanitizeStorageName("")).toBe("");
  });
});

// ─── buildStoragePath ───

describe("buildStoragePath", () => {
  it("builds path without condition", () => {
    expect(buildStoragePath("deal-123", "report.pdf")).toBe(
      "deals/deal-123/report.pdf"
    );
  });

  it("builds path with condition", () => {
    expect(
      buildStoragePath("deal-123", "report.pdf", "cond-456")
    ).toBe("deals/deal-123/conditions/cond-456/report.pdf");
  });

  it("sanitizes the filename", () => {
    expect(buildStoragePath("deal-123", "my report (1).pdf")).toBe(
      "deals/deal-123/my_report__1_.pdf"
    );
  });

  it("does not sanitize dealId or conditionId", () => {
    const result = buildStoragePath("deal-123", "file.pdf", "cond-456");
    expect(result).toContain("deal-123");
    expect(result).toContain("cond-456");
  });
});

// ─── formatFileSize ───

describe("formatFileSize", () => {
  it("returns em dash for null", () => {
    expect(formatFileSize(null)).toBe("\u2014");
  });

  it("returns em dash for undefined", () => {
    expect(formatFileSize(undefined)).toBe("\u2014");
  });

  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats zero bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(512000)).toBe("500 KB");
  });

  it("formats megabytes with one decimal", () => {
    expect(formatFileSize(1048576)).toBe("1.0 MB");
    expect(formatFileSize(5242880)).toBe("5.0 MB");
    expect(formatFileSize(1572864)).toBe("1.5 MB");
  });

  it("handles large files", () => {
    expect(formatFileSize(26214400)).toBe("25.0 MB");
  });
});

// ─── validateFile ───

describe("validateFile", () => {
  const makeFile = (
    name: string,
    size: number,
    type = "application/pdf"
  ) => ({ name, size, type });

  it("returns null for a valid PDF", () => {
    expect(validateFile(makeFile("report.pdf", 1024))).toBeNull();
  });

  it("returns null for a valid DOCX", () => {
    expect(validateFile(makeFile("doc.docx", 1024))).toBeNull();
  });

  it("returns null for a valid XLSX", () => {
    expect(validateFile(makeFile("data.xlsx", 1024))).toBeNull();
  });

  it("returns null for a valid image", () => {
    expect(
      validateFile(makeFile("photo.jpg", 1024, "image/jpeg"))
    ).toBeNull();
  });

  it("rejects files over the size limit", () => {
    const result = validateFile(makeFile("big.pdf", 30 * 1024 * 1024));
    expect(result).toBe("File size must be less than 25MB");
  });

  it("rejects empty files", () => {
    const result = validateFile(makeFile("empty.pdf", 0));
    expect(result).toBe("File is empty");
  });

  it("rejects unsupported file types", () => {
    const result = validateFile(makeFile("script.exe", 1024));
    expect(result).toBe("File type .exe is not accepted");
  });

  it("accepts custom max size", () => {
    const result = validateFile(makeFile("big.pdf", 15 * 1024 * 1024), {
      maxSizeBytes: 10 * 1024 * 1024,
    });
    expect(result).toBe("File size must be less than 10MB");
  });

  it("accepts custom extensions", () => {
    const result = validateFile(makeFile("data.json", 1024), {
      acceptedExtensions: [".json", ".xml"],
    });
    expect(result).toBeNull();
  });

  it("rejects based on custom extensions", () => {
    const result = validateFile(makeFile("data.csv", 1024), {
      acceptedExtensions: [".json"],
    });
    expect(result).toBe("File type .csv is not accepted");
  });

  it("handles files without extensions", () => {
    const result = validateFile(makeFile("README", 1024));
    expect(result).toBeNull(); // no extension means we can't check — allow it
  });

  it("is case-insensitive on extensions", () => {
    expect(validateFile(makeFile("REPORT.PDF", 1024))).toBeNull();
  });
});

// ─── Constants ───

describe("MAX_FILE_SIZES", () => {
  it("defines document max size as 25MB", () => {
    expect(MAX_FILE_SIZES.document).toBe(25 * 1024 * 1024);
  });

  it("defines profile photo max size as 10MB", () => {
    expect(MAX_FILE_SIZES.profilePhoto).toBe(10 * 1024 * 1024);
  });
});

describe("ACCEPTED_DOCUMENT_EXTENSIONS", () => {
  it("includes common document types", () => {
    expect(ACCEPTED_DOCUMENT_EXTENSIONS).toContain(".pdf");
    expect(ACCEPTED_DOCUMENT_EXTENSIONS).toContain(".docx");
    expect(ACCEPTED_DOCUMENT_EXTENSIONS).toContain(".xlsx");
    expect(ACCEPTED_DOCUMENT_EXTENSIONS).toContain(".csv");
  });

  it("includes common image types", () => {
    expect(ACCEPTED_DOCUMENT_EXTENSIONS).toContain(".png");
    expect(ACCEPTED_DOCUMENT_EXTENSIONS).toContain(".jpg");
    expect(ACCEPTED_DOCUMENT_EXTENSIONS).toContain(".jpeg");
  });
});

// ─── Review Status Helpers ───

describe("isReviewInFlight", () => {
  it("returns true for pending", () => {
    expect(isReviewInFlight("pending")).toBe(true);
  });

  it("returns true for processing", () => {
    expect(isReviewInFlight("processing")).toBe(true);
  });

  it("returns false for ready", () => {
    expect(isReviewInFlight("ready")).toBe(false);
  });

  it("returns false for error", () => {
    expect(isReviewInFlight("error")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isReviewInFlight(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isReviewInFlight(undefined)).toBe(false);
  });
});

describe("hasInFlightDocuments", () => {
  it("returns true when any status is pending", () => {
    expect(hasInFlightDocuments(["ready", "pending", "ready"])).toBe(true);
  });

  it("returns true when any status is processing", () => {
    expect(hasInFlightDocuments(["ready", "processing"])).toBe(true);
  });

  it("returns false when all statuses are terminal", () => {
    expect(hasInFlightDocuments(["ready", "error", "applied"])).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(hasInFlightDocuments([])).toBe(false);
  });

  it("handles null values in array", () => {
    expect(hasInFlightDocuments([null, "ready"])).toBe(false);
  });
});
