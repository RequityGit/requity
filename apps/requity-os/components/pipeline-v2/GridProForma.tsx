"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { evaluateGrid, gridCellKey, getEffectiveFormula } from "@/lib/formula-engine";
import { fmtCurrency, fmtPct, fmtMultiple, fmtNumber } from "@/components/commercial-uw/format-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  GridTemplateDef,
  GridOverrides,
  GridPeriod,
  GridRowDef,
  GridRowType,
} from "./pipeline-types";
import { GRID_PERIODS, GRID_PERIOD_LABELS } from "./pipeline-types";

// ---------------------------------------------------------------------------
// Formatting helpers per row type
// ---------------------------------------------------------------------------

function formatValue(value: number | null, type: GridRowType): string {
  if (value == null) return "--";
  switch (type) {
    case "currency":
      return fmtCurrency(value);
    case "percent":
      return fmtPct(value);
    case "ratio":
      return fmtMultiple(value);
    case "number":
      return fmtNumber(value);
    default:
      return String(value);
  }
}

// ---------------------------------------------------------------------------
// Cell Override Popover
// ---------------------------------------------------------------------------

function CellOverridePopover({
  rowKey,
  period,
  currentFormula,
  isOverride,
  overrides,
  onUpdateOverride,
  onClearOverride,
}: {
  rowKey: string;
  period: GridPeriod;
  currentFormula: string;
  isOverride: boolean;
  overrides: GridOverrides;
  onUpdateOverride: (key: string, override: { value?: number; formula?: string }) => void;
  onClearOverride: (key: string) => void;
}) {
  const cellKey = gridCellKey(rowKey, period);
  const override = overrides[cellKey];
  const [mode, setMode] = useState<"value" | "formula">(
    override?.formula ? "formula" : "value"
  );
  const [inputValue, setInputValue] = useState(
    override?.value != null ? String(override.value) : ""
  );
  const [inputFormula, setInputFormula] = useState(override?.formula ?? "");

  const handleApply = () => {
    if (mode === "value" && inputValue.trim()) {
      const num = parseFloat(inputValue.replace(/[$,%\s]/g, "").replace(/,/g, ""));
      if (!isNaN(num)) {
        onUpdateOverride(cellKey, { value: num });
      }
    } else if (mode === "formula" && inputFormula.trim()) {
      onUpdateOverride(cellKey, { formula: inputFormula });
    }
  };

  return (
    <div className="space-y-3 w-[280px]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Override Cell
        </p>
        {isOverride && (
          <button
            onClick={() => onClearOverride(cellKey)}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Base: <code className="bg-muted px-1 rounded font-mono">{currentFormula}</code>
      </p>

      <div className="flex gap-1">
        <button
          onClick={() => setMode("value")}
          className={cn(
            "text-[10px] px-2 py-1 rounded border",
            mode === "value"
              ? "bg-foreground text-background border-foreground"
              : "border-border hover:bg-accent"
          )}
        >
          Value
        </button>
        <button
          onClick={() => setMode("formula")}
          className={cn(
            "text-[10px] px-2 py-1 rounded border",
            mode === "formula"
              ? "bg-foreground text-background border-foreground"
              : "border-border hover:bg-accent"
          )}
        >
          Formula
        </button>
      </div>

      {mode === "value" ? (
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter value..."
          className="text-xs font-mono"
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
      ) : (
        <Input
          value={inputFormula}
          onChange={(e) => setInputFormula(e.target.value)}
          placeholder="Custom formula..."
          className="text-xs font-mono"
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
      )}

      <Button size="sm" className="w-full text-xs" onClick={handleApply}>
        Apply Override
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GridProForma Component
// ---------------------------------------------------------------------------

export function GridProForma({
  template,
  uwData,
  overrides: initialOverrides,
  onOverridesChange,
  readOnly = false,
}: {
  template: GridTemplateDef;
  uwData: Record<string, unknown>;
  overrides: GridOverrides;
  onOverridesChange?: (overrides: GridOverrides) => void;
  readOnly?: boolean;
}) {
  const [localOverrides, setLocalOverrides] = useState<GridOverrides>(initialOverrides);

  const overrides = onOverridesChange ? localOverrides : initialOverrides;

  const handleUpdateOverride = useCallback(
    (cellKey: string, override: { value?: number; formula?: string }) => {
      const next = { ...localOverrides, [cellKey]: override };
      setLocalOverrides(next);
      onOverridesChange?.(next);
    },
    [localOverrides, onOverridesChange]
  );

  const handleClearOverride = useCallback(
    (cellKey: string) => {
      const next = { ...localOverrides };
      delete next[cellKey];
      setLocalOverrides(next);
      onOverridesChange?.(next);
    },
    [localOverrides, onOverridesChange]
  );

  // Evaluate the grid
  const result = useMemo(
    () => evaluateGrid(template, uwData, overrides),
    [template, uwData, overrides]
  );

  // Group rows by section for display
  const sections = useMemo(() => {
    const sorted = [...template.rows].sort((a, b) => a.sort_order - b.sort_order);
    const grouped: { section: string; rows: GridRowDef[] }[] = [];
    let currentSection = "";
    for (const row of sorted) {
      if (row.section && row.section !== currentSection) {
        currentSection = row.section;
        grouped.push({ section: currentSection, rows: [] });
      } else if (!grouped.length) {
        grouped.push({ section: "", rows: [] });
      }
      grouped[grouped.length - 1].rows.push(row);
    }
    return grouped;
  }, [template.rows]);

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-accent/50">
            <th className="text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] pl-[22px] border-b-2 w-[20%]" />
            {GRID_PERIODS.map((p) => (
              <th
                key={p}
                className={cn(
                  "text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b-2",
                  p === "t12" && "border-r"
                )}
              >
                {GRID_PERIOD_LABELS[p]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map((sec, si) => (
            <>
              {sec.section && (
                <tr key={`sec-${si}`}>
                  <td
                    colSpan={GRID_PERIODS.length + 1}
                    className="px-[22px] pt-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground border-b bg-foreground/[0.01]"
                  >
                    {sec.section}
                  </td>
                </tr>
              )}
              {sec.rows.map((row) => {
                const rowResult = result[row.key] ?? {};
                return (
                  <tr
                    key={row.key}
                    className="hover:bg-foreground/[0.02] transition-colors"
                  >
                    <td
                      className={cn(
                        "px-[14px] h-[42px] text-foreground border-b tabular-nums",
                        row.bold ? "pl-[22px] font-bold text-[13px]" : "pl-[30px] text-xs font-normal"
                      )}
                    >
                      {row.label}
                    </td>
                    {GRID_PERIODS.map((period) => {
                      const value = rowResult[period] ?? null;
                      const effectiveFormula = getEffectiveFormula(
                        template,
                        overrides,
                        row.key,
                        period
                      );
                      const isOverride = effectiveFormula?.isOverride ?? false;

                      const cell = (
                        <td
                          key={period}
                          className={cn(
                            "px-[14px] h-[42px] text-right border-b tabular-nums text-[13px] relative",
                            row.bold ? "font-bold" : "font-normal",
                            period === "t12" && "border-r",
                            isOverride && "bg-blue-500/5",
                            !readOnly && "cursor-pointer hover:bg-accent/50"
                          )}
                        >
                          <span className="num">{formatValue(value, row.type)}</span>
                          {isOverride && (
                            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                          )}
                        </td>
                      );

                      if (readOnly) return cell;

                      return (
                        <Popover key={period}>
                          <PopoverTrigger asChild>{cell}</PopoverTrigger>
                          <PopoverContent
                            side="bottom"
                            align="end"
                            className="p-3"
                          >
                            <CellOverridePopover
                              rowKey={row.key}
                              period={period}
                              currentFormula={
                                effectiveFormula?.formula ?? row.formula
                              }
                              isOverride={isOverride}
                              overrides={overrides}
                              onUpdateOverride={handleUpdateOverride}
                              onClearOverride={handleClearOverride}
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </tr>
                );
              })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
