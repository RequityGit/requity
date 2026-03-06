"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/shared/file-upload";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  AlertCircle,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { parseSpreadsheet, parseNumber } from "@/lib/commercial-uw/parse-spreadsheet";
import type { ParsedSpreadsheet } from "@/lib/commercial-uw/parse-spreadsheet";
import {
  T12_ALL_CATEGORIES,
  T12_CATEGORY_LABELS,
  T12_AUTO_MAP_RULES,
  T12_CATEGORY_IS_INCOME,
  T12_STANDARDIZED_INCOME_CATEGORIES,
  T12_STANDARDIZED_EXPENSE_CATEGORIES,
} from "@/lib/commercial-uw/types";
import type { T12Category, T12LineItem } from "@/lib/commercial-uw/types";

export interface T12HistoricalsImportData {
  lineItems: {
    original_row_label: string;
    original_category: string | null;
    amounts: (number | null)[];
    annual_total: number | null;
    is_income: boolean;
    sort_order: number;
  }[];
  mappings: {
    lineItemIndex: number;
    mapped_category: T12Category;
    is_excluded: boolean;
    exclusion_reason: string | null;
  }[];
  periodStart: string;
  periodEnd: string;
  sourceLabel: string;
  fileName: string;
  monthLabels: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: T12HistoricalsImportData) => void;
  previousMappings?: Record<
    string,
    { category: string; is_excluded: boolean; exclusion_reason: string | null }
  >;
}

type Step = "upload" | "map" | "preview";

interface ParsedRow {
  label: string;
  category: string | null;
  amounts: number[];
  total: number;
}

interface RowMapping {
  category: T12Category | "__exclude__" | "";
  exclusionReason: string;
}

const EXCLUDE_VALUE = "__exclude__";
const SKIP_VALUE = "__skip__";

function autoMapLabel(
  label: string,
  previousMappings?: Record<string, { category: string; is_excluded: boolean; exclusion_reason: string | null }>
): T12Category | "__exclude__" | "" {
  const lower = label.toLowerCase().trim();

  // Check previous mappings first
  if (previousMappings?.[lower]) {
    if (previousMappings[lower].is_excluded) return EXCLUDE_VALUE;
    return previousMappings[lower].category as T12Category;
  }

  // Auto-map based on rules
  for (const rule of T12_AUTO_MAP_RULES) {
    for (const pattern of rule.patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        return rule.category;
      }
    }
  }

  return "";
}

function detectMonthLabels(headers: string[]): string[] {
  const monthPatterns = [
    /jan/i, /feb/i, /mar/i, /apr/i, /may/i, /jun/i,
    /jul/i, /aug/i, /sep/i, /oct/i, /nov/i, /dec/i,
  ];
  const months: string[] = [];
  for (const h of headers) {
    if (monthPatterns.some((p) => p.test(h))) {
      months.push(h);
    }
  }
  // Also detect numeric patterns like "1", "2", "2025-01"
  if (months.length < 6) {
    for (const h of headers) {
      if (/^\d{4}[-/]\d{2}/.test(h) || /^\d{1,2}\/\d{4}/.test(h)) {
        if (!months.includes(h)) months.push(h);
      }
    }
  }
  return months.length >= 6 ? months.slice(0, 12) : [];
}

function detectPeriodFromHeaders(monthLabels: string[]): { start: string; end: string } {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (monthLabels.length === 0) {
    const start = new Date(currentYear - 1, now.getMonth(), 1);
    const end = new Date(currentYear, now.getMonth() - 1, 1);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }

  // Try to parse first and last month labels
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const firstLabel = monthLabels[0].toLowerCase();
  const lastLabel = monthLabels[monthLabels.length - 1].toLowerCase();

  let startMonth = -1;
  let endMonth = -1;
  for (let i = 0; i < monthNames.length; i++) {
    if (firstLabel.includes(monthNames[i])) startMonth = i;
    if (lastLabel.includes(monthNames[i])) endMonth = i;
  }

  // Try to extract year from labels
  const yearMatch = firstLabel.match(/(\d{4})/);
  const yearMatch2 = lastLabel.match(/(\d{4})/);
  const startYear = yearMatch ? parseInt(yearMatch[1]) : currentYear - 1;
  const endYear = yearMatch2 ? parseInt(yearMatch2[1]) : (startMonth > endMonth ? currentYear : startYear);

  if (startMonth >= 0 && endMonth >= 0) {
    const start = new Date(startYear, startMonth, 1);
    const end = new Date(endYear, endMonth + 1, 0);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }

  return {
    start: `${currentYear - 1}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
    end: `${currentYear}-${String(now.getMonth()).padStart(2, "0")}-28`,
  };
}

export function UploadT12HistoricalsDialog({
  open,
  onOpenChange,
  onImport,
  previousMappings,
}: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [rowMappings, setRowMappings] = useState<RowMapping[]>([]);
  const [monthLabels, setMonthLabels] = useState<string[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");

  const reset = () => {
    setStep("upload");
    setParsed(null);
    setFilename("");
    setError(null);
    setParsedRows([]);
    setRowMappings([]);
    setMonthLabels([]);
    setPeriodStart("");
    setPeriodEnd("");
    setSourceLabel("");
  };

  const handleFileSelect = async (file: File) => {
    try {
      setError(null);
      const result = await parseSpreadsheet(file);
      setParsed(result);
      setFilename(file.name);

      // Detect month columns
      const months = detectMonthLabels(result.headers);
      setMonthLabels(months);

      // Detect period
      const period = detectPeriodFromHeaders(months);
      setPeriodStart(period.start);
      setPeriodEnd(period.end);

      // Parse rows - first column is the label, month columns are amounts
      const firstColHeader = result.headers[0];
      const rows: ParsedRow[] = [];

      // Check if data is row-based (labels in first column)
      const numericHeaders = months.length > 0 ? months : result.headers.slice(1);

      for (const row of result.rows) {
        const label = row[firstColHeader]?.trim();
        if (!label) continue;

        // Skip header-like rows, total rows (we'll compute our own)
        const lowerLabel = label.toLowerCase();
        if (
          lowerLabel === "total" ||
          lowerLabel === "total expenses" ||
          lowerLabel === "total income" ||
          lowerLabel === "net operating income" ||
          lowerLabel === "noi" ||
          lowerLabel === "effective gross income" ||
          lowerLabel === "egi"
        ) {
          continue;
        }

        const amounts: number[] = [];
        let total = 0;

        for (const h of numericHeaders) {
          const val = parseNumber(row[h] ?? "");
          amounts.push(val);
          total += val;
        }

        // Pad to 12 months if needed
        while (amounts.length < 12) amounts.push(0);

        // If there's a "Total" or "Annual" column, use that instead
        const totalHeader = result.headers.find((h) =>
          /total|annual|ytd|12.?month/i.test(h)
        );
        if (totalHeader) {
          const parsedTotal = parseNumber(row[totalHeader] ?? "");
          if (parsedTotal !== 0) total = parsedTotal;
        }

        rows.push({
          label,
          category: null,
          amounts: amounts.slice(0, 12),
          total: total || amounts.slice(0, 12).reduce((s, a) => s + a, 0),
        });
      }

      setParsedRows(rows);

      // Auto-map each row
      const autoMappings: RowMapping[] = rows.map((row) => ({
        category: autoMapLabel(row.label, previousMappings),
        exclusionReason: "",
      }));

      // Fill exclusion reasons from previous mappings
      for (let i = 0; i < rows.length; i++) {
        const lower = rows[i].label.toLowerCase().trim();
        if (previousMappings?.[lower]?.is_excluded) {
          autoMappings[i].exclusionReason =
            previousMappings[lower].exclusion_reason ?? "";
        }
      }

      setRowMappings(autoMappings);
      setStep("map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  const updateRowMapping = useCallback(
    (index: number, category: T12Category | "__exclude__" | "") => {
      setRowMappings((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], category };
        return next;
      });
    },
    []
  );

  const updateExclusionReason = useCallback((index: number, reason: string) => {
    setRowMappings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], exclusionReason: reason };
      return next;
    });
  }, []);

  const mappedCount = useMemo(
    () => rowMappings.filter((m) => m.category !== "").length,
    [rowMappings]
  );

  const autoMappedFromPrevious = useMemo(() => {
    if (!previousMappings) return 0;
    return rowMappings.filter((m, i) => {
      const lower = parsedRows[i]?.label.toLowerCase().trim();
      return lower && previousMappings[lower] && m.category !== "";
    }).length;
  }, [rowMappings, parsedRows, previousMappings]);

  // Build category summary for preview
  const categorySummary = useMemo(() => {
    const summary: Record<
      string,
      { label: string; total: number; sourceRows: { label: string; total: number }[] }
    > = {};

    for (let i = 0; i < parsedRows.length; i++) {
      const mapping = rowMappings[i];
      if (!mapping || mapping.category === "" || mapping.category === EXCLUDE_VALUE)
        continue;

      const cat = mapping.category as T12Category;
      if (!summary[cat]) {
        summary[cat] = {
          label: T12_CATEGORY_LABELS[cat] ?? cat,
          total: 0,
          sourceRows: [],
        };
      }
      summary[cat].total += parsedRows[i].total;
      summary[cat].sourceRows.push({
        label: parsedRows[i].label,
        total: parsedRows[i].total,
      });
    }

    return summary;
  }, [parsedRows, rowMappings]);

  const handleConfirm = () => {
    const lineItems = parsedRows.map((row, i) => ({
      original_row_label: row.label,
      original_category: row.category,
      amounts: row.amounts as (number | null)[],
      annual_total: row.total,
      is_income: rowMappings[i]?.category
        ? T12_CATEGORY_IS_INCOME[rowMappings[i].category as T12Category] ?? false
        : false,
      sort_order: i,
    }));

    const mappings = rowMappings
      .map((m, i) => ({
        lineItemIndex: i,
        mapped_category:
          m.category === EXCLUDE_VALUE
            ? ("other_misc" as T12Category)
            : (m.category as T12Category),
        is_excluded: m.category === EXCLUDE_VALUE,
        exclusion_reason:
          m.category === EXCLUDE_VALUE ? m.exclusionReason || null : null,
      }))
      .filter((m) => m.mapped_category !== ("" as T12Category));

    onImport({
      lineItems,
      mappings,
      periodStart,
      periodEnd,
      sourceLabel,
      fileName: filename,
      monthLabels,
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload T12 — Historicals
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              "Upload a CSV or Excel file containing your trailing 12-month income statement."}
            {step === "map" &&
              "Map each row from your T12 to our standardized categories."}
            {step === "preview" &&
              "Review the mapped historical income statement before saving."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 text-xs">
          {(["upload", "map", "preview"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <div className="w-8 h-px bg-slate-300" />}
              <Badge
                variant={step === s ? "default" : "outline"}
                className="text-xs"
              >
                {i + 1}.{" "}
                {s === "upload"
                  ? "Upload"
                  : s === "map"
                    ? "Map Fields"
                    : "Preview"}
              </Badge>
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4 py-4">
            <FileUpload
              onFileSelect={handleFileSelect}
              accept=".csv,.xlsx,.xls"
              maxSize={20}
            />
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Source Label</Label>
                <Input
                  value={sourceLabel}
                  onChange={(e) => setSourceLabel(e.target.value)}
                  placeholder='e.g., "Borrower Provided", "AppFolio Export"'
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Map Fields */}
        {step === "map" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">
                  {parsedRows.length} rows from{" "}
                  <strong>{filename}</strong>
                </span>
                {autoMappedFromPrevious > 0 && (
                  <span className="ml-2 text-green-600 text-xs">
                    ({autoMappedFromPrevious} auto-mapped from previous upload)
                  </span>
                )}
              </div>
              <Badge variant="outline">
                {mappedCount} / {parsedRows.length} mapped
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <Label className="text-xs">Period Start</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Period End</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="border rounded max-h-[50vh] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium w-[40%]">
                      Source Row
                    </th>
                    <th className="text-right p-2 font-medium w-[15%]">
                      Annual Total
                    </th>
                    <th className="text-left p-2 font-medium w-[35%]">
                      Map To
                    </th>
                    <th className="text-center p-2 font-medium w-[10%]">
                      Exclude
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b ${
                        rowMappings[i]?.category === EXCLUDE_VALUE
                          ? "bg-red-50 opacity-60"
                          : rowMappings[i]?.category
                            ? "bg-green-50/50"
                            : ""
                      }`}
                    >
                      <td className="p-2 text-sm truncate max-w-[250px]" title={row.label}>
                        {row.label}
                      </td>
                      <td className="p-2 text-right num text-sm">
                        {formatCurrency(row.total)}
                      </td>
                      <td className="p-2">
                        {rowMappings[i]?.category !== EXCLUDE_VALUE && (
                          <Select
                            value={rowMappings[i]?.category || ""}
                            onValueChange={(v) =>
                              updateRowMapping(
                                i,
                                v === SKIP_VALUE
                                  ? ""
                                  : (v as T12Category | "")
                              )
                            }
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="— Select —" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={SKIP_VALUE}>— Skip —</SelectItem>
                              <SelectItem
                                disabled
                                value="__income_header__"
                                className="font-bold text-green-700"
                              >
                                INCOME
                              </SelectItem>
                              {T12_STANDARDIZED_INCOME_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {T12_CATEGORY_LABELS[cat]}
                                </SelectItem>
                              ))}
                              <SelectItem
                                disabled
                                value="__expense_header__"
                                className="font-bold text-red-700"
                              >
                                EXPENSES
                              </SelectItem>
                              {T12_STANDARDIZED_EXPENSE_CATEGORIES.map(
                                (cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {T12_CATEGORY_LABELS[cat]}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        )}
                        {rowMappings[i]?.category === EXCLUDE_VALUE && (
                          <Input
                            value={rowMappings[i]?.exclusionReason ?? ""}
                            onChange={(e) =>
                              updateExclusionReason(i, e.target.value)
                            }
                            placeholder="Reason (e.g., CapEx, one-time)"
                            className="h-7 text-xs"
                          />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            updateRowMapping(
                              i,
                              rowMappings[i]?.category === EXCLUDE_VALUE
                                ? ""
                                : EXCLUDE_VALUE
                            )
                          }
                          className={`w-4 h-4 rounded border ${
                            rowMappings[i]?.category === EXCLUDE_VALUE
                              ? "bg-red-500 border-red-500 text-white"
                              : "border-slate-300"
                          } flex items-center justify-center text-xs mx-auto`}
                        >
                          {rowMappings[i]?.category === EXCLUDE_VALUE && (
                            <X className="h-3 w-3" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div className="space-y-4 py-2">
            <h3 className="text-sm font-semibold">Mapping Summary</h3>

            {/* Income categories */}
            <div>
              <h4 className="text-xs font-medium text-green-700 mb-1">
                INCOME
              </h4>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-green-50 border-b">
                      <th className="text-left p-2 font-medium">Category</th>
                      <th className="text-right p-2 font-medium">
                        Annual Total
                      </th>
                      <th className="text-left p-2 font-medium">
                        Source Rows
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {T12_STANDARDIZED_INCOME_CATEGORIES.map((cat) => {
                      const data = categorySummary[cat];
                      if (!data) return null;
                      return (
                        <tr key={cat} className="border-b">
                          <td className="p-2 font-medium">
                            {T12_CATEGORY_LABELS[cat]}
                          </td>
                          <td className="p-2 text-right num">
                            {formatCurrency(data.total)}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {data.sourceRows
                              .map((r) => r.label)
                              .join(", ")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expense categories */}
            <div>
              <h4 className="text-xs font-medium text-red-700 mb-1">
                EXPENSES
              </h4>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-red-50 border-b">
                      <th className="text-left p-2 font-medium">Category</th>
                      <th className="text-right p-2 font-medium">
                        Annual Total
                      </th>
                      <th className="text-left p-2 font-medium">
                        Source Rows
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {T12_STANDARDIZED_EXPENSE_CATEGORIES.map((cat) => {
                      const data = categorySummary[cat];
                      if (!data) return null;
                      return (
                        <tr key={cat} className="border-b">
                          <td className="p-2 font-medium">
                            {T12_CATEGORY_LABELS[cat]}
                          </td>
                          <td className="p-2 text-right num">
                            {formatCurrency(data.total)}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {data.sourceRows
                              .map((r) => r.label)
                              .join(", ")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Excluded rows */}
            {rowMappings.some((m) => m.category === EXCLUDE_VALUE) && (
              <div>
                <h4 className="text-xs font-medium text-orange-700 mb-1">
                  EXCLUDED ROWS
                </h4>
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-orange-50 border-b">
                        <th className="text-left p-2 font-medium">Row</th>
                        <th className="text-right p-2 font-medium">Amount</th>
                        <th className="text-left p-2 font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows
                        .map((row, i) => ({ row, mapping: rowMappings[i], i }))
                        .filter((x) => x.mapping?.category === EXCLUDE_VALUE)
                        .map(({ row, mapping }) => (
                          <tr key={row.label} className="border-b">
                            <td className="p-2">{row.label}</td>
                            <td className="p-2 text-right num">
                              {formatCurrency(row.total)}
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {mapping.exclusionReason || "No reason provided"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "map" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("upload")}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                onClick={() => setStep("preview")}
                disabled={mappedCount === 0}
              >
                Preview
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("map")}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
              <Button size="sm" onClick={handleConfirm}>
                <Check className="h-3 w-3 mr-1" />
                Save & Import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
