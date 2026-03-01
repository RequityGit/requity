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
  autoMapColumns,
  RENT_ROLL_ALIASES,
} from "@/lib/commercial-uw/parse-spreadsheet";
import type { ParsedSpreadsheet } from "@/lib/commercial-uw/parse-spreadsheet";
import type { RentRollRow, LeaseType } from "@/lib/commercial-uw/types";
import { LEASE_TYPES } from "@/lib/commercial-uw/types";

export interface RentRollImportMetadata {
  filename: string;
  columnMapping: Record<string, string>;
  rowCount: number;
  parsedData: Record<string, unknown>[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: RentRollRow[], metadata: RentRollImportMetadata) => void;
}

type Step = "upload" | "map" | "preview";

const MAPPABLE_FIELDS = [
  { key: "unit_number", label: "Unit #" },
  { key: "tenant_name", label: "Tenant Name" },
  { key: "sf", label: "Square Feet" },
  { key: "beds_type", label: "Beds/Type" },
  { key: "lease_type", label: "Lease Type" },
  { key: "current_monthly_rent", label: "Monthly Rent" },
  { key: "cam_nnn", label: "CAM/NNN" },
  { key: "other_income", label: "Other Income" },
  { key: "is_vacant", label: "Vacant" },
  { key: "market_rent", label: "Market Rent" },
  { key: "lease_start", label: "Lease Start" },
  { key: "lease_end", label: "Lease End" },
];

const SKIP_VALUE = "__skip__";

export function UploadRentRollDialog({ open, onOpenChange, onImport }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [filename, setFilename] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep("upload");
    setParsed(null);
    setFilename("");
    setMapping({});
    setError(null);
  };

  const handleFileSelect = async (file: File) => {
    try {
      setError(null);
      console.log("[RentRoll] Parsing file:", file.name, file.size, "bytes");
      const result = await parseSpreadsheet(file);
      console.log("[RentRoll] Parsed:", result.headers.length, "headers,", result.rows.length, "rows (header detected at row", result.headerRowIndex + 1, ")");
      console.log("[RentRoll] Headers:", result.headers);
      setParsed(result);
      setFilename(file.name);
      // Auto-map columns
      const autoMapped = autoMapColumns(result.headers, RENT_ROLL_ALIASES);
      setMapping(autoMapped);
      setStep("map");
    } catch (err) {
      console.error("[RentRoll] Parse error:", err);
      setError(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  const previewRows = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.slice(0, 5).map((row) => {
      const mapped: Record<string, string> = {};
      for (const [field, header] of Object.entries(mapping)) {
        if (header && header !== SKIP_VALUE) {
          mapped[field] = row[header] ?? "";
        }
      }
      return mapped;
    });
  }, [parsed, mapping]);

  const convertToRentRollRows = (): RentRollRow[] => {
    if (!parsed) return [];
    return parsed.rows.map((row, idx) => {
      const get = (field: string) => {
        const header = mapping[field];
        if (!header || header === SKIP_VALUE) return "";
        return row[header] ?? "";
      };

      const vacantRaw = get("is_vacant").toLowerCase();
      const isVacant =
        vacantRaw === "true" ||
        vacantRaw === "yes" ||
        vacantRaw === "1" ||
        vacantRaw === "y" ||
        vacantRaw.startsWith("vacant");

      const leaseTypeRaw = get("lease_type");
      const leaseType: LeaseType =
        LEASE_TYPES.find(
          (lt) => lt.toLowerCase() === leaseTypeRaw.toLowerCase()
        ) ?? "Gross";

      return {
        sort_order: idx,
        unit_number: get("unit_number"),
        tenant_name: get("tenant_name"),
        sf: parseNumber(get("sf")),
        beds_type: get("beds_type"),
        baths: 0,
        lease_start: get("lease_start"),
        lease_end: get("lease_end"),
        lease_type: leaseType,
        current_monthly_rent: parseNumber(get("current_monthly_rent")),
        cam_nnn: parseNumber(get("cam_nnn")),
        other_income: parseNumber(get("other_income")),
        poh_income: 0,
        is_vacant: isVacant,
        market_rent: parseNumber(get("market_rent")),
        market_cam_nnn: 0,
        market_other: 0,
      };
    });
  };

  const handleConfirm = () => {
    try {
      const rows = convertToRentRollRows();
      onImport(rows, {
        filename,
        columnMapping: mapping,
        rowCount: rows.length,
        parsedData: rows as unknown as Record<string, unknown>[],
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("[RentRoll] Import error:", err);
      setError(err instanceof Error ? err.message : "Failed to import rent roll data");
      setStep("upload");
    }
  };

  const mappedCount = Object.values(mapping).filter(
    (v) => v && v !== SKIP_VALUE
  ).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Rent Roll
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV or Excel file containing your rent roll data."}
            {step === "map" && "Map your spreadsheet columns to rent roll fields."}
            {step === "preview" && "Review the mapped data before importing."}
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
                {i + 1}. {s === "upload" ? "Upload" : s === "map" ? "Map Columns" : "Preview"}
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

        {/* Step 2: Map Columns */}
        {step === "map" && parsed && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Found {parsed.headers.length} columns, {parsed.rows.length} rows in <strong>{filename}</strong>
              </span>
              <Badge variant="outline">{mappedCount} / {MAPPABLE_FIELDS.length} mapped</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {MAPPABLE_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <label className="text-xs font-medium w-28 flex-shrink-0">{label}</label>
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
                      {parsed.headers
                        .filter((h) => h && h.trim() !== "")
                        .map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && parsed && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Showing first {Math.min(5, parsed.rows.length)} of{" "}
              <strong>{parsed.rows.length}</strong> rows
            </p>

            <div className="overflow-x-auto border rounded">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-slate-50">
                    {MAPPABLE_FIELDS.filter(
                      ({ key }) => mapping[key] && mapping[key] !== SKIP_VALUE
                    ).map(({ key, label }) => (
                      <th key={key} className="p-2 text-left font-medium whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      {MAPPABLE_FIELDS.filter(
                        ({ key }) => mapping[key] && mapping[key] !== SKIP_VALUE
                      ).map(({ key }) => (
                        <td key={key} className="p-2 whitespace-nowrap">
                          {key === "current_monthly_rent" || key === "market_rent" || key === "cam_nnn" || key === "other_income"
                            ? formatCurrency(parseNumber(row[key] ?? ""))
                            : (row[key] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
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
                Import {parsed?.rows.length ?? 0} Units
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
