"use client";

import { useState, useMemo } from "react";
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
import { FileUpload } from "@/components/shared/file-upload";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, Upload } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  parseSpreadsheet,
  parseNumber,
  fuzzyMatch,
  T12_ALIASES,
} from "@/lib/commercial-uw/parse-spreadsheet";
import type { ParsedSpreadsheet } from "@/lib/commercial-uw/parse-spreadsheet";
import type { T12Data } from "@/lib/commercial-uw/types";

export interface T12ImportMetadata {
  filename: string;
  fieldMapping: Record<string, string>;
  parsedData: T12Data;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: T12Data, metadata: T12ImportMetadata) => void;
}

type Step = "upload" | "map" | "preview";

const T12_FIELDS = [
  { key: "gpi", label: "Gross Potential Income" },
  { key: "vacancy_pct", label: "Vacancy %" },
  { key: "bad_debt_pct", label: "Bad Debt %" },
  { key: "mgmt_fee", label: "Management Fee" },
  { key: "taxes", label: "Real Estate Taxes" },
  { key: "insurance", label: "Insurance" },
  { key: "utilities", label: "Utilities" },
  { key: "repairs", label: "Repairs & Maintenance" },
  { key: "contract_services", label: "Contract Services" },
  { key: "payroll", label: "Payroll" },
  { key: "marketing", label: "Marketing" },
  { key: "ga", label: "General & Administrative" },
  { key: "replacement_reserve", label: "Replacement Reserve" },
];

const SKIP_VALUE = "__skip__";

export function UploadT12Dialog({ open, onOpenChange, onImport }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [filename, setFilename] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // T12 can be either row-based (category in col A, amount in col B)
  // or column-based (categories as headers). We detect both formats.
  const [rowLabels, setRowLabels] = useState<string[]>([]);
  const [isRowBased, setIsRowBased] = useState(false);

  const reset = () => {
    setStep("upload");
    setParsed(null);
    setFilename("");
    setMapping({});
    setError(null);
    setRowLabels([]);
    setIsRowBased(false);
  };

  const handleFileSelect = async (file: File) => {
    try {
      setError(null);
      const result = await parseSpreadsheet(file);
      setParsed(result);
      setFilename(file.name);

      // Detect format: if first column contains category-like labels, it's row-based
      const firstColHeader = result.headers[0];
      const firstColValues = result.rows.map((r) => r[firstColHeader] ?? "");
      const matchesExpenseLabels = firstColValues.filter((v) => {
        const lower = v.toLowerCase();
        return Object.values(T12_ALIASES).some((aliases) =>
          aliases.some((a) => lower.includes(a.toLowerCase()))
        );
      });

      if (matchesExpenseLabels.length >= 3) {
        // Row-based format
        setIsRowBased(true);
        setRowLabels(firstColValues.filter(Boolean));
        // Auto-map row labels to T12 fields
        const autoMap: Record<string, string> = {};
        for (const [field, aliases] of Object.entries(T12_ALIASES)) {
          for (const label of firstColValues) {
            if (label && fuzzyMatch(label, aliases)) {
              autoMap[field] = label;
              break;
            }
          }
        }
        setMapping(autoMap);
      } else {
        // Column-based: treat headers as fields
        setIsRowBased(false);
        setRowLabels([]);
        const autoMap: Record<string, string> = {};
        for (const [field, aliases] of Object.entries(T12_ALIASES)) {
          for (const header of result.headers) {
            if (fuzzyMatch(header, aliases)) {
              autoMap[field] = header;
              break;
            }
          }
        }
        setMapping(autoMap);
      }

      setStep("map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  const resolvedValues = useMemo(() => {
    if (!parsed) return {} as Record<string, number>;
    const values: Record<string, number> = {};

    for (const { key } of T12_FIELDS) {
      const mappedLabel = mapping[key];
      if (!mappedLabel || mappedLabel === SKIP_VALUE) {
        values[key] = 0;
        continue;
      }

      if (isRowBased) {
        // Find the row where first column matches the mapped label
        const firstColHeader = parsed.headers[0];
        const matchingRow = parsed.rows.find(
          (r) => r[firstColHeader] === mappedLabel
        );
        if (matchingRow) {
          // Get value from second column (or first numeric column)
          const valueHeaders = parsed.headers.slice(1);
          for (const vh of valueHeaders) {
            const val = parseNumber(matchingRow[vh] ?? "");
            if (val !== 0) {
              values[key] = val;
              break;
            }
          }
          if (values[key] === undefined) values[key] = 0;
        } else {
          values[key] = 0;
        }
      } else {
        // Column-based: sum or take the first row's value
        const val = parseNumber(parsed.rows[0]?.[mappedLabel] ?? "");
        values[key] = val;
      }
    }

    return values;
  }, [parsed, mapping, isRowBased]);

  const buildT12Data = (): T12Data => ({
    gpi: resolvedValues.gpi ?? 0,
    vacancy_pct: resolvedValues.vacancy_pct ?? 0,
    bad_debt_pct: resolvedValues.bad_debt_pct ?? 0,
    mgmt_fee: resolvedValues.mgmt_fee ?? 0,
    taxes: resolvedValues.taxes ?? 0,
    insurance: resolvedValues.insurance ?? 0,
    utilities: resolvedValues.utilities ?? 0,
    repairs: resolvedValues.repairs ?? 0,
    contract_services: resolvedValues.contract_services ?? 0,
    payroll: resolvedValues.payroll ?? 0,
    marketing: resolvedValues.marketing ?? 0,
    ga: resolvedValues.ga ?? 0,
    replacement_reserve: resolvedValues.replacement_reserve ?? 0,
  });

  const handleConfirm = () => {
    const data = buildT12Data();
    onImport(data, {
      filename,
      fieldMapping: mapping,
      parsedData: data,
    });
    reset();
    onOpenChange(false);
  };

  const mappedCount = Object.values(mapping).filter(
    (v) => v && v !== SKIP_VALUE
  ).length;

  const selectOptions = isRowBased ? rowLabels : (parsed?.headers ?? []);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload T12 Data
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV or Excel file containing your trailing 12-month operating data."}
            {step === "map" && `Map your spreadsheet ${isRowBased ? "rows" : "columns"} to T12 fields.`}
            {step === "preview" && "Review the mapped T12 values before importing."}
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
                {i + 1}. {s === "upload" ? "Upload" : s === "map" ? "Map Fields" : "Preview"}
              </Badge>
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="py-4">
            <FileUpload
              onFileSelect={handleFileSelect}
              accept=".csv,.xlsx,.xls"
              maxSize={20}
            />
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </div>
        )}

        {/* Step 2: Map Fields */}
        {step === "map" && parsed && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Detected {isRowBased ? "row-based" : "column-based"} format from <strong>{filename}</strong>
              </span>
              <Badge variant="outline">{mappedCount} / {T12_FIELDS.length} mapped</Badge>
            </div>

            <div className="space-y-2">
              {T12_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-xs font-medium w-44 flex-shrink-0">{label}</label>
                  <Select
                    value={mapping[key] ?? SKIP_VALUE}
                    onValueChange={(v) =>
                      setMapping({ ...mapping, [key]: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue placeholder="Skip" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SKIP_VALUE}>— Skip —</SelectItem>
                      {selectOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div className="space-y-3 py-2">
            <div className="border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="p-2 text-left font-medium">Field</th>
                    <th className="p-2 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {T12_FIELDS.map(({ key, label }) => {
                    const val = resolvedValues[key] ?? 0;
                    if (!mapping[key] || mapping[key] === SKIP_VALUE) return null;
                    const isPct = key.endsWith("_pct");
                    return (
                      <tr key={key} className="border-b">
                        <td className="p-2 text-sm">{label}</td>
                        <td className="p-2 text-right num text-sm">
                          {isPct ? `${val}%` : formatCurrency(val)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "map" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setStep("upload")}>
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
              <Button variant="outline" size="sm" onClick={() => setStep("map")}>
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
              <Button size="sm" onClick={handleConfirm}>
                <Check className="h-3 w-3 mr-1" />
                Import T12 Data
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
