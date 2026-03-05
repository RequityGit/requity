"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Check,
  History,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  T12_STANDARDIZED_INCOME_CATEGORIES,
  T12_STANDARDIZED_EXPENSE_CATEGORIES,
  T12_CATEGORY_LABELS,
  T12_CATEGORY_IS_INCOME,
  T12_TO_PROFORMA_MAP,
} from "@/lib/commercial-uw/types";
import type {
  T12Category,
  T12LineItem,
  T12FieldMapping,
  T12Upload,
  T12Version,
  T12Override,
  T12Data,
} from "@/lib/commercial-uw/types";
import { UploadT12HistoricalsDialog } from "./upload-t12-historicals-dialog";
import type { T12HistoricalsImportData } from "./upload-t12-historicals-dialog";

interface Props {
  loanId: string;
  totalUnits: number;
  upload: T12Upload | null;
  lineItems: T12LineItem[];
  mappings: T12FieldMapping[];
  versions: T12Version[];
  overrides: T12Override[];
  onUploadT12: (data: T12HistoricalsImportData) => void;
  onActivateVersion: (versionId: string) => void;
  onOverrideChange: (category: string, value: number | null) => void;
  previousMappings?: Record<
    string,
    { category: string; is_excluded: boolean; exclusion_reason: string | null }
  >;
}

interface AggregatedCategory {
  category: T12Category;
  label: string;
  amounts: number[];
  annualTotal: number;
  sourceRows: {
    lineItem: T12LineItem;
    mapping: T12FieldMapping;
  }[];
  override: number | null;
  isIncome: boolean;
}

function getMonthLabel(periodStart: string, monthIndex: number): string {
  if (!periodStart) return `M${monthIndex + 1}`;
  const date = new Date(periodStart);
  date.setMonth(date.getMonth() + monthIndex);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function getLineItemMonthAmount(
  item: T12LineItem,
  month: number
): number {
  const key = `amount_month_${month + 1}` as keyof T12LineItem;
  return (item[key] as number) ?? 0;
}

export function HistoricalsTab({
  loanId,
  totalUnits,
  upload,
  lineItems,
  mappings,
  versions,
  overrides,
  onUploadT12,
  onActivateVersion,
  onOverrideChange,
  previousMappings,
}: Props) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const activeVersion = versions.find((v) => v.is_active);

  const toggleExpand = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  // Build aggregated categories from line items + mappings
  const aggregatedData = useMemo(() => {
    const catMap = new Map<string, AggregatedCategory>();

    // Initialize all categories
    for (const cat of [
      ...T12_STANDARDIZED_INCOME_CATEGORIES,
      ...T12_STANDARDIZED_EXPENSE_CATEGORIES,
    ]) {
      catMap.set(cat, {
        category: cat,
        label: T12_CATEGORY_LABELS[cat],
        amounts: new Array(12).fill(0),
        annualTotal: 0,
        sourceRows: [],
        override: overrides.find((o) => o.category === cat)
          ?.override_annual_total ?? null,
        isIncome: T12_CATEGORY_IS_INCOME[cat],
      });
    }

    // Aggregate line items based on mappings
    for (const mapping of mappings) {
      if (mapping.is_excluded) continue;

      const lineItem = lineItems.find(
        (li) => li.id === mapping.t12_line_item_id
      );
      if (!lineItem) continue;

      const cat = catMap.get(mapping.mapped_category);
      if (!cat) continue;

      for (let m = 0; m < 12; m++) {
        cat.amounts[m] += getLineItemMonthAmount(lineItem, m);
      }
      cat.annualTotal += lineItem.annual_total ?? 0;
      cat.sourceRows.push({ lineItem, mapping });
    }

    return catMap;
  }, [lineItems, mappings, overrides]);

  // Compute summary rows
  const incomeCategories = useMemo(
    () =>
      T12_STANDARDIZED_INCOME_CATEGORIES.map(
        (cat) => aggregatedData.get(cat)!
      ).filter((c) => c.annualTotal !== 0 || c.sourceRows.length > 0),
    [aggregatedData]
  );

  const expenseCategories = useMemo(
    () =>
      T12_STANDARDIZED_EXPENSE_CATEGORIES.map(
        (cat) => aggregatedData.get(cat)!
      ),
    [aggregatedData]
  );

  // Compute EGI (Effective Gross Income)
  const gprCat = aggregatedData.get("gross_potential_rent");
  const vacancyCat = aggregatedData.get("vacancy_loss");
  const badDebtCat = aggregatedData.get("bad_debt");
  const concessionsCat = aggregatedData.get("concessions");
  const otherIncomeCat = aggregatedData.get("other_income");

  const egiAmounts = useMemo(() => {
    const amounts = new Array(12).fill(0);
    for (let m = 0; m < 12; m++) {
      amounts[m] =
        (gprCat?.amounts[m] ?? 0) -
        Math.abs(vacancyCat?.amounts[m] ?? 0) -
        Math.abs(badDebtCat?.amounts[m] ?? 0) -
        Math.abs(concessionsCat?.amounts[m] ?? 0) +
        (otherIncomeCat?.amounts[m] ?? 0);
    }
    return amounts;
  }, [gprCat, vacancyCat, badDebtCat, concessionsCat, otherIncomeCat]);

  const egiAnnual = egiAmounts.reduce((s, a) => s + a, 0);

  // Compute total expenses
  const totalExpenseAmounts = useMemo(() => {
    const amounts = new Array(12).fill(0);
    for (const cat of expenseCategories) {
      for (let m = 0; m < 12; m++) {
        amounts[m] += cat.amounts[m];
      }
    }
    return amounts;
  }, [expenseCategories]);

  const totalExpenseAnnual = useMemo(
    () =>
      expenseCategories.reduce(
        (sum, cat) => sum + (cat.override ?? cat.annualTotal),
        0
      ),
    [expenseCategories]
  );

  // NOI
  const noiAmounts = useMemo(() => {
    const amounts = new Array(12).fill(0);
    for (let m = 0; m < 12; m++) {
      amounts[m] = egiAmounts[m] - totalExpenseAmounts[m];
    }
    return amounts;
  }, [egiAmounts, totalExpenseAmounts]);

  const noiAnnual = egiAnnual - totalExpenseAnnual;

  // Month labels
  const monthLabels = useMemo(() => {
    if (!upload?.period_start) return Array.from({ length: 12 }, (_, i) => `M${i + 1}`);
    return Array.from({ length: 12 }, (_, i) =>
      getMonthLabel(upload.period_start, i)
    );
  }, [upload?.period_start]);

  const formatAccounting = (value: number) => {
    if (value < 0) return `(${formatCurrency(Math.abs(value))})`;
    return formatCurrency(value);
  };

  const formatPerUnit = (value: number) => {
    if (totalUnits <= 0) return "—";
    return `$${Math.round(value / totalUnits).toLocaleString()}`;
  };

  const formatPctEGI = (value: number) => {
    if (egiAnnual === 0) return "—";
    return `${((value / egiAnnual) * 100).toFixed(1)}%`;
  };

  const hasData = lineItems.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">
                Historical Operating Statement (T12)
              </CardTitle>
              {upload && (
                <Badge variant="outline" className="text-xs">
                  {upload.status === "mapped" ? (
                    <Check className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1 text-amber-600" />
                  )}
                  {upload.status === "mapped" ? "Mapped" : "Pending Mapping"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {versions.length > 0 && (
                <Select
                  value={activeVersion?.id ?? ""}
                  onValueChange={(vId) => onActivateVersion(vId)}
                >
                  <SelectTrigger className="h-8 text-xs w-auto min-w-[200px]">
                    <History className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.version_label ?? `Version ${v.version_number}`}
                        {v.is_active ? " (Active)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload New T12
              </Button>
            </div>
          </div>
          {upload && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span>
                Period:{" "}
                {new Date(upload.period_start).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}{" "}
                –{" "}
                {new Date(upload.period_end).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
              {upload.source_label && (
                <span>Source: {upload.source_label}</span>
              )}
              <span>File: {upload.file_name}</span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* No data state */}
      {!hasData && (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-medium mb-1">No T12 Data</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Upload a trailing 12-month income statement to populate the
              historicals view.
            </p>
            <Button
              size="sm"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload T12
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Historical Income Statement Grid */}
      {hasData && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-100 border-b">
                    <th className="text-left p-2 font-medium sticky left-0 bg-slate-100 min-w-[200px]">
                      Category
                    </th>
                    {monthLabels.map((label, i) => (
                      <th
                        key={i}
                        className="text-right p-2 font-medium min-w-[80px]"
                      >
                        {label}
                      </th>
                    ))}
                    <th className="text-right p-2 font-medium min-w-[100px] bg-slate-50">
                      Annual Total
                    </th>
                    <th className="text-right p-2 font-medium min-w-[80px] bg-slate-50">
                      $/Unit
                    </th>
                    <th className="text-right p-2 font-medium min-w-[70px] bg-slate-50">
                      % of EGI
                    </th>
                    <th className="text-right p-2 font-medium min-w-[100px] bg-amber-50">
                      Override
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* INCOME SECTION */}
                  <tr className="bg-green-50/50 border-b border-green-200">
                    <td
                      colSpan={17}
                      className="p-2 font-bold text-green-800 text-xs uppercase tracking-wide sticky left-0 bg-green-50/50"
                    >
                      Income
                    </td>
                  </tr>

                  {incomeCategories.map((cat) => (
                    <CategoryRow
                      key={cat.category}
                      data={cat}
                      isExpanded={expandedCategories.has(cat.category)}
                      onToggle={() => toggleExpand(cat.category)}
                      egiAnnual={egiAnnual}
                      totalUnits={totalUnits}
                      onOverrideChange={onOverrideChange}
                      isNegative={
                        cat.category === "vacancy_loss" ||
                        cat.category === "bad_debt" ||
                        cat.category === "concessions"
                      }
                    />
                  ))}

                  {/* EGI ROW */}
                  <tr className="border-y-2 border-slate-300 bg-slate-50 font-bold">
                    <td className="p-2 sticky left-0 bg-slate-50">
                      Effective Gross Income
                    </td>
                    {egiAmounts.map((amt, i) => (
                      <td key={i} className="p-2 text-right num">
                        {formatAccounting(amt)}
                      </td>
                    ))}
                    <td className="p-2 text-right num bg-slate-100">
                      {formatAccounting(egiAnnual)}
                    </td>
                    <td className="p-2 text-right num bg-slate-100">
                      {formatPerUnit(egiAnnual)}
                    </td>
                    <td className="p-2 text-right num bg-slate-100">
                      100.0%
                    </td>
                    <td className="p-2 bg-amber-50" />
                  </tr>

                  {/* EXPENSES SECTION */}
                  <tr className="bg-red-50/50 border-b border-red-200">
                    <td
                      colSpan={17}
                      className="p-2 font-bold text-red-800 text-xs uppercase tracking-wide sticky left-0 bg-red-50/50"
                    >
                      Operating Expenses
                    </td>
                  </tr>

                  {expenseCategories.map((cat) => (
                    <CategoryRow
                      key={cat.category}
                      data={cat}
                      isExpanded={expandedCategories.has(cat.category)}
                      onToggle={() => toggleExpand(cat.category)}
                      egiAnnual={egiAnnual}
                      totalUnits={totalUnits}
                      onOverrideChange={onOverrideChange}
                      isNegative={false}
                    />
                  ))}

                  {/* TOTAL EXPENSES ROW */}
                  <tr className="border-y-2 border-slate-300 bg-slate-50 font-bold">
                    <td className="p-2 sticky left-0 bg-slate-50">
                      Total Operating Expenses
                    </td>
                    {totalExpenseAmounts.map((amt, i) => (
                      <td key={i} className="p-2 text-right num text-red-700">
                        {formatAccounting(amt)}
                      </td>
                    ))}
                    <td className="p-2 text-right num text-red-700 bg-slate-100">
                      {formatAccounting(totalExpenseAnnual)}
                    </td>
                    <td className="p-2 text-right num bg-slate-100">
                      {formatPerUnit(totalExpenseAnnual)}
                    </td>
                    <td className="p-2 text-right num bg-slate-100">
                      {formatPctEGI(totalExpenseAnnual)}
                    </td>
                    <td className="p-2 bg-amber-50" />
                  </tr>

                  {/* NOI ROW */}
                  <tr className="bg-blue-50 font-bold text-blue-900 border-t-2">
                    <td className="p-2 sticky left-0 bg-blue-50">
                      Net Operating Income
                    </td>
                    {noiAmounts.map((amt, i) => (
                      <td key={i} className="p-2 text-right num">
                        {formatAccounting(amt)}
                      </td>
                    ))}
                    <td className="p-2 text-right num bg-blue-100">
                      {formatAccounting(noiAnnual)}
                    </td>
                    <td className="p-2 text-right num bg-blue-100">
                      {formatPerUnit(noiAnnual)}
                    </td>
                    <td className="p-2 text-right num bg-blue-100">
                      {formatPctEGI(noiAnnual)}
                    </td>
                    <td className="p-2 bg-amber-50" />
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <UploadT12HistoricalsDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onImport={onUploadT12}
        previousMappings={previousMappings}
      />
    </div>
  );
}

// Sub-component for each category row with expand/collapse
function CategoryRow({
  data,
  isExpanded,
  onToggle,
  egiAnnual,
  totalUnits,
  onOverrideChange,
  isNegative,
}: {
  data: AggregatedCategory;
  isExpanded: boolean;
  onToggle: () => void;
  egiAnnual: number;
  totalUnits: number;
  onOverrideChange: (category: string, value: number | null) => void;
  isNegative: boolean;
}) {
  const displayTotal = data.override ?? data.annualTotal;
  const hasMultipleSources = data.sourceRows.length > 1;
  const hasOverride = data.override !== null;

  const formatAccounting = (value: number) => {
    const absValue = isNegative ? Math.abs(value) : value;
    if (isNegative && absValue > 0) return `(${formatCurrency(absValue)})`;
    return formatCurrency(absValue);
  };

  const formatPerUnit = (value: number) => {
    if (totalUnits <= 0) return "—";
    const perUnit = Math.round(Math.abs(value) / totalUnits);
    if (isNegative && value > 0) return `($${perUnit.toLocaleString()})`;
    return `$${perUnit.toLocaleString()}`;
  };

  const formatPctEGI = (value: number) => {
    if (egiAnnual === 0) return "—";
    return `${((Math.abs(value) / egiAnnual) * 100).toFixed(1)}%`;
  };

  if (data.annualTotal === 0 && data.sourceRows.length === 0 && !data.isIncome) {
    // Show empty expense rows with just the override column
    return (
      <tr className="border-b hover:bg-muted/50">
        <td className="p-2 pl-4 text-muted-foreground sticky left-0 bg-card">
          {data.label}
        </td>
        {Array.from({ length: 12 }, (_, i) => (
          <td key={i} className="p-2 text-right num text-muted-foreground">
            —
          </td>
        ))}
        <td className="p-2 text-right num bg-slate-50 text-muted-foreground">—</td>
        <td className="p-2 text-right num bg-slate-50 text-muted-foreground">—</td>
        <td className="p-2 text-right num bg-slate-50 text-muted-foreground">—</td>
        <td className="p-2 bg-amber-50">
          <Input
            type="number"
            placeholder="—"
            className="h-6 text-xs w-20 text-right ml-auto bg-card"
            value={data.override ?? ""}
            onChange={(e) =>
              onOverrideChange(
                data.category,
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr
        className={`border-b hover:bg-muted/50 ${
          hasOverride ? "bg-amber-50/30" : ""
        } ${hasMultipleSources ? "cursor-pointer" : ""}`}
        onClick={hasMultipleSources ? onToggle : undefined}
      >
        <td className="p-2 pl-4 sticky left-0 bg-card">
          <span className="flex items-center gap-1">
            {hasMultipleSources && (
              <>
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </>
            )}
            <span className={hasOverride ? "text-amber-800" : ""}>
              {data.label}
            </span>
            {hasMultipleSources && (
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 ml-1"
              >
                {data.sourceRows.length}
              </Badge>
            )}
            {hasOverride && (
              <span
                className="text-[10px] text-amber-600 ml-1"
                title={`Override: ${formatCurrency(data.override!)} (T12 Actual: ${formatCurrency(data.annualTotal)})`}
              >
                *
              </span>
            )}
          </span>
        </td>
        {data.amounts.map((amt, i) => (
          <td
            key={i}
            className={`p-2 text-right num ${
              isNegative && amt > 0 ? "text-red-600" : ""
            }`}
          >
            {amt !== 0 ? formatAccounting(amt) : "—"}
          </td>
        ))}
        <td
          className={`p-2 text-right num font-medium bg-slate-50 ${
            hasOverride ? "line-through text-muted-foreground" : ""
          } ${isNegative && data.annualTotal > 0 ? "text-red-600" : ""}`}
        >
          {formatAccounting(data.annualTotal)}
        </td>
        <td className="p-2 text-right num bg-slate-50">
          {formatPerUnit(displayTotal)}
        </td>
        <td className="p-2 text-right num bg-slate-50">
          {!data.isIncome ? formatPctEGI(displayTotal) : ""}
        </td>
        <td className="p-2 bg-amber-50">
          {!data.isIncome && (
            <Input
              type="number"
              placeholder="—"
              className={`h-6 text-xs w-20 text-right ml-auto ${
                hasOverride
                  ? "bg-amber-100 border-amber-300"
                  : "bg-card"
              }`}
              value={data.override ?? ""}
              onChange={(e) => {
                e.stopPropagation();
                onOverrideChange(
                  data.category,
                  e.target.value === "" ? null : Number(e.target.value)
                );
              }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </td>
      </tr>

      {/* Expanded source rows */}
      {isExpanded &&
        data.sourceRows.map(({ lineItem }) => (
          <tr
            key={lineItem.id}
            className="border-b bg-slate-50/50 text-muted-foreground"
          >
            <td className="p-2 pl-10 text-xs italic sticky left-0 bg-slate-50/50">
              {lineItem.original_row_label}
            </td>
            {Array.from({ length: 12 }, (_, m) => (
              <td key={m} className="p-2 text-right num text-xs">
                {getLineItemMonthAmount(lineItem, m) !== 0
                  ? formatCurrency(
                      Math.abs(getLineItemMonthAmount(lineItem, m))
                    )
                  : "—"}
              </td>
            ))}
            <td className="p-2 text-right num text-xs bg-slate-100/50">
              {formatCurrency(Math.abs(lineItem.annual_total ?? 0))}
            </td>
            <td className="p-2 bg-slate-100/50" />
            <td className="p-2 bg-slate-100/50" />
            <td className="p-2 bg-amber-50/50" />
          </tr>
        ))}
    </>
  );
}
