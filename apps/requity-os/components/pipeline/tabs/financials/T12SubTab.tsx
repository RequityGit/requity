"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Pencil,
  Plus,
  Loader2,
  TrendingUp,
  DollarSign,
  FileUp,
  Zap,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  upsertIncomeRows,
  upsertExpenseRows,
  updateExpenseNotes,
  updateIncomeNotes,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions";
import { UploadT12Dialog } from "@/components/admin/commercial-uw/upload-t12-dialog";
import type { T12Data } from "@/lib/commercial-uw/types";
import {
  computeT12NetRevenue,
  computeT12TotalExpenses,
} from "@/lib/commercial-uw/deal-computations";
import type {
  DealIncomeRow,
  DealExpenseRow,
} from "@/lib/commercial-uw/deal-computations";
import {
  calcBenchmarkExpenses,
  calcVariance,
  getBenchmarksForType,
  EXPENSE_BENCHMARK_LABELS,
  EXPENSE_BENCHMARK_CATEGORIES,
  type ExpenseBenchmarkCategory,
} from "@/lib/commercial-uw/expense-benchmarks";
import { getUnitLabel } from "@/lib/commercial-uw/asset-type-config";
import { showOccupancySection } from "@/lib/commercial-uw/asset-type-config";
import { OccupancyIncomeSection } from "./OccupancyIncomeSection";
import { AncillaryIncomeSection } from "./AncillaryIncomeSection";
import { PillNav, MetricBar, SectionCard, n, fmtCurrency } from "./shared";

// ── Extended row types with new DB columns ──

interface ExtendedExpenseRow extends DealExpenseRow {
  source?: string;
  notes?: string | null;
}

interface ExtendedIncomeRow extends DealIncomeRow {
  section?: string;
  notes?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
}

interface T12SubTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  income: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses: any[];
  uwId: string | null;
  purchasePrice?: number;
  numUnits?: number;
  propertyType?: string;
  totalSf?: number;
}

type Mode = "manual" | "upload";

// ── Category mapping from DB category names to benchmark keys ──

const CATEGORY_TO_BENCHMARK: Record<string, ExpenseBenchmarkCategory> = {
  "Real Estate Taxes": "taxes",
  "Property Taxes": "taxes",
  "RE Taxes": "taxes",
  "Insurance": "insurance",
  "Utilities": "utilities",
  "Repairs & Maintenance": "repairs",
  "R&M": "repairs",
  "Contract Services": "contract_services",
  "Payroll": "payroll",
  "On-Site Payroll": "payroll",
  "Marketing": "marketing",
  "General & Administrative": "ga",
  "G&A / Other": "ga",
  "G&A": "ga",
  "Replacement Reserve": "reserve",
  "Reserves": "reserve",
};

function matchBenchmarkCategory(category: string): ExpenseBenchmarkCategory | null {
  // Direct match
  if (CATEGORY_TO_BENCHMARK[category]) return CATEGORY_TO_BENCHMARK[category];
  // Case-insensitive partial match
  const lower = category.toLowerCase();
  if (lower.includes("tax")) return "taxes";
  if (lower.includes("insurance")) return "insurance";
  if (lower.includes("utilit")) return "utilities";
  if (lower.includes("repair") || lower.includes("maintenance") || lower.includes("r&m")) return "repairs";
  if (lower.includes("contract")) return "contract_services";
  if (lower.includes("payroll") || lower.includes("salary") || lower.includes("on-site")) return "payroll";
  if (lower.includes("market") || lower.includes("advertis")) return "marketing";
  if (lower.includes("g&a") || lower.includes("general") || lower.includes("admin")) return "ga";
  if (lower.includes("reserve") || lower.includes("capex") || lower.includes("replacement")) return "reserve";
  return null;
}

// ── Main Component ──

export function T12SubTab({
  income,
  expenses,
  uwId,
  purchasePrice = 0,
  numUnits = 0,
  propertyType = "",
  totalSf = 0,
}: T12SubTabProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editIncomeOpen, setEditIncomeOpen] = useState(false);
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("manual");
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const router = useRouter();

  // Parse all income rows
  const allIncomeRows: ExtendedIncomeRow[] = useMemo(
    () =>
      income.map((r: ExtendedIncomeRow) => ({
        ...r,
        t12_amount: n(r.t12_amount),
        year_1_amount: n(r.year_1_amount),
        growth_rate: n(r.growth_rate),
      })),
    [income]
  );

  // Split by section
  const incomeRows = useMemo(
    () => allIncomeRows.filter((r) => !r.section || r.section === "lease"),
    [allIncomeRows]
  );
  const occupancyRows = useMemo(
    () => allIncomeRows.filter((r) => r.section === "occupancy"),
    [allIncomeRows]
  );
  const ancillaryRows = useMemo(
    () => allIncomeRows.filter((r) => r.section === "ancillary"),
    [allIncomeRows]
  );

  const expenseRows: ExtendedExpenseRow[] = useMemo(
    () =>
      expenses.map((r: ExtendedExpenseRow) => ({
        ...r,
        t12_amount: n(r.t12_amount),
        year_1_amount: n(r.year_1_amount),
        growth_rate: n(r.growth_rate),
      })),
    [expenses]
  );

  // Should show occupancy section based on property type
  const showOccupancy = useMemo(() => showOccupancySection(propertyType), [propertyType]);

  // Benchmark calculations
  const benchmarks = useMemo(
    () => calcBenchmarkExpenses(propertyType, numUnits, totalSf),
    [propertyType, numUnits, totalSf]
  );

  const benchmarkInfo = useMemo(
    () => getBenchmarksForType(propertyType),
    [propertyType]
  );

  const unitLabel = useMemo(
    () => getUnitLabel(propertyType, "perLabel"),
    [propertyType]
  );

  // Lease-based net revenue (GPR - vacancy - concessions)
  const leaseNetRevenue = useMemo(() => computeT12NetRevenue(incomeRows), [incomeRows]);

  // Occupancy-based revenue
  const occupancyRevenue = useMemo(
    () => occupancyRows.reduce((sum, r) => sum + r.t12_amount, 0),
    [occupancyRows]
  );

  // Ancillary revenue
  const ancillaryRevenue = useMemo(
    () => ancillaryRows.reduce((sum, r) => sum + r.t12_amount, 0),
    [ancillaryRows]
  );

  // GPI = MAX(lease, occupancy) + ancillary
  const netRevenue = useMemo(() => {
    const primaryIncome = showOccupancy
      ? Math.max(leaseNetRevenue, occupancyRevenue)
      : leaseNetRevenue;
    return primaryIncome + ancillaryRevenue;
  }, [showOccupancy, leaseNetRevenue, occupancyRevenue, ancillaryRevenue]);

  const totalExpenses = useMemo(() => computeT12TotalExpenses(expenseRows), [expenseRows]);
  const noi = netRevenue - totalExpenses;
  const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
  const expenseRatio = netRevenue > 0 ? (totalExpenses / netRevenue) * 100 : 0;
  const basisCount = numUnits > 0 ? numUnits : totalSf;
  const noiPerUnit = basisCount > 0 ? Math.round(noi / basisCount) : 0;

  // Total benchmark for comparison
  const totalBenchmark = useMemo(() => {
    if (!benchmarks) return 0;
    return Object.values(benchmarks).reduce((a, b) => a + b, 0);
  }, [benchmarks]);

  const handleT12Import = useCallback(
    async (data: T12Data) => {
      if (!uwId) return;

      const newIncome = [
        { line_item: "Gross Potential Rent", t12_amount: data.gpi, year_1_amount: data.gpi, growth_rate: 0, is_deduction: false, sort_order: 0 },
        { line_item: "Vacancy Loss", t12_amount: data.gpi * (data.vacancy_pct / 100), year_1_amount: data.gpi * (data.vacancy_pct / 100), growth_rate: 0, is_deduction: true, sort_order: 1 },
        { line_item: "Bad Debt", t12_amount: data.gpi * (data.bad_debt_pct / 100), year_1_amount: data.gpi * (data.bad_debt_pct / 100), growth_rate: 0, is_deduction: true, sort_order: 2 },
      ];

      const newExpenses = [
        { category: "Management Fee", t12_amount: data.mgmt_fee, year_1_amount: data.mgmt_fee, growth_rate: 0, is_percentage: false, sort_order: 0, source: "imported" as const },
        { category: "Real Estate Taxes", t12_amount: data.taxes, year_1_amount: data.taxes, growth_rate: 0, is_percentage: false, sort_order: 1, source: "imported" as const },
        { category: "Insurance", t12_amount: data.insurance, year_1_amount: data.insurance, growth_rate: 0, is_percentage: false, sort_order: 2, source: "imported" as const },
        { category: "Utilities", t12_amount: data.utilities, year_1_amount: data.utilities, growth_rate: 0, is_percentage: false, sort_order: 3, source: "imported" as const },
        { category: "Repairs & Maintenance", t12_amount: data.repairs, year_1_amount: data.repairs, growth_rate: 0, is_percentage: false, sort_order: 4, source: "imported" as const },
        { category: "Contract Services", t12_amount: data.contract_services, year_1_amount: data.contract_services, growth_rate: 0, is_percentage: false, sort_order: 5, source: "imported" as const },
        { category: "Payroll", t12_amount: data.payroll, year_1_amount: data.payroll, growth_rate: 0, is_percentage: false, sort_order: 6, source: "imported" as const },
        { category: "Marketing", t12_amount: data.marketing, year_1_amount: data.marketing, growth_rate: 0, is_percentage: false, sort_order: 7, source: "imported" as const },
        { category: "General & Administrative", t12_amount: data.ga, year_1_amount: data.ga, growth_rate: 0, is_percentage: false, sort_order: 8, source: "imported" as const },
        { category: "Replacement Reserve", t12_amount: data.replacement_reserve, year_1_amount: data.replacement_reserve, growth_rate: 0, is_percentage: false, sort_order: 9, source: "imported" as const },
      ];

      const [incRes, expRes] = await Promise.all([
        upsertIncomeRows(uwId, newIncome),
        upsertExpenseRows(uwId, newExpenses),
      ]);

      if (incRes.error || expRes.error) {
        toast.error(`Failed to import T12: ${incRes.error || expRes.error}`);
      } else {
        toast.success("T12 data imported successfully");
        setMode("manual");
        router.refresh();
      }
    },
    [uwId, router]
  );

  // Apply benchmark guidance to all expenses
  const handleApplyGuidance = useCallback(async () => {
    if (!uwId || !benchmarks || !benchmarkInfo) return;

    const guidanceRows = EXPENSE_BENCHMARK_CATEGORIES.map((cat, i) => ({
      category: EXPENSE_BENCHMARK_LABELS[cat],
      t12_amount: 0,
      year_1_amount: benchmarks[cat],
      growth_rate: 0,
      is_percentage: false,
      sort_order: i + 1,
      source: "guidance",
    }));

    // Add management fee as first row (percentage-based)
    const mgmtFeeRow = {
      category: "Management Fee",
      t12_amount: 0,
      year_1_amount: netRevenue > 0 ? Math.round(netRevenue * (benchmarkInfo.mgmtFeePct / 100)) : 0,
      growth_rate: 0,
      is_percentage: true,
      sort_order: 0,
      source: "guidance",
    };

    const result = await upsertExpenseRows(uwId, [mgmtFeeRow, ...guidanceRows]);
    if (result.error) {
      toast.error(`Failed to apply guidance: ${result.error}`);
    } else {
      toast.success("Expense guidance applied");
      router.refresh();
    }
  }, [uwId, benchmarks, benchmarkInfo, netRevenue, router]);

  // Save inline note
  const handleSaveNote = useCallback(
    async (rowId: string, notes: string, type: "expense" | "income") => {
      const fn = type === "expense" ? updateExpenseNotes : updateIncomeNotes;
      const result = await fn(rowId, notes || null);
      if (result.error) {
        toast.error("Failed to save note");
      } else {
        router.refresh();
      }
    },
    [router]
  );

  const hasData = incomeRows.length > 0 || expenseRows.length > 0 || occupancyRows.length > 0 || ancillaryRows.length > 0;

  const MODE_TABS = [
    { key: "manual" as const, label: "Manual Entry", icon: Pencil },
    { key: "upload" as const, label: "Upload & Map", icon: FileUp },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PillNav tabs={MODE_TABS} active={mode} onChange={setMode} />

      {mode === "manual" ? (
        !hasData ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No T12 data yet. Upload an operating statement or enter data manually.
            </p>
            <div className="flex items-center gap-2 justify-center flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setMode("upload")}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload T12
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditIncomeOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Enter Manually
              </Button>
              {benchmarks && (
                <Button variant="outline" size="sm" onClick={handleApplyGuidance}>
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Apply Expense Guidance
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Two-column layout: Income + Expenses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Lease-Based Income Card */}
              <IncomeCard
                incomeRows={incomeRows}
                netRevenue={leaseNetRevenue}
                expandedNoteId={expandedNoteId}
                onToggleNote={setExpandedNoteId}
                onSaveNote={handleSaveNote}
                onEdit={() => setEditIncomeOpen(true)}
                title={showOccupancy ? "Lease-Based Income" : "Income"}
              />

              {/* Expenses Card with Guidance */}
              <ExpensesCard
                expenseRows={expenseRows}
                netRevenue={netRevenue}
                totalExpenses={totalExpenses}
                benchmarks={benchmarks}
                benchmarkInfo={benchmarkInfo}
                unitLabel={unitLabel}
                expandedNoteId={expandedNoteId}
                onToggleNote={setExpandedNoteId}
                onSaveNote={handleSaveNote}
                onEdit={() => setEditExpenseOpen(true)}
                onApplyGuidance={benchmarks ? handleApplyGuidance : undefined}
                totalBenchmark={totalBenchmark}
              />
            </div>

            {/* Occupancy-Based Income (shown for transient asset types) */}
            {showOccupancy && (
              <OccupancyIncomeSection
                rows={allIncomeRows}
                uwId={uwId}
                propertyType={propertyType}
                numUnits={numUnits}
              />
            )}

            {/* Ancillary / Other Income */}
            <AncillaryIncomeSection
              rows={allIncomeRows}
              uwId={uwId}
              propertyType={propertyType}
            />

            {/* GPI Summary (when multiple income sections exist) */}
            {(showOccupancy || ancillaryRevenue > 0) && (
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="px-5 py-3.5 border-b">
                  <span className="rq-section-title">Gross Potential Income Summary</span>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Lease-Based Net Revenue</span>
                    <span className="num font-medium">{fmtCurrency(leaseNetRevenue)}</span>
                  </div>
                  {showOccupancy && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">Occupancy-Based Revenue</span>
                      <span className="num font-medium">{fmtCurrency(occupancyRevenue)}</span>
                    </div>
                  )}
                  {showOccupancy && (
                    <div className="flex justify-between text-[13px] border-t pt-2">
                      <span className="text-muted-foreground">
                        Primary Income (MAX)
                      </span>
                      <span className="num font-semibold">
                        {fmtCurrency(Math.max(leaseNetRevenue, occupancyRevenue))}
                        {occupancyRevenue > leaseNetRevenue && leaseNetRevenue > 0 && (
                          <span className="ml-1.5 text-[10px] text-blue-500 uppercase tracking-wider">Occ wins</span>
                        )}
                        {leaseNetRevenue > occupancyRevenue && occupancyRevenue > 0 && (
                          <span className="ml-1.5 text-[10px] text-blue-500 uppercase tracking-wider">Lease wins</span>
                        )}
                      </span>
                    </div>
                  )}
                  {ancillaryRevenue > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">+ Ancillary Income</span>
                      <span className="num font-medium">{fmtCurrency(ancillaryRevenue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t-2 pt-3 mt-2">
                    <span>Effective Gross Income</span>
                    <span className="num">{fmtCurrency(netRevenue)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom metrics */}
            <MetricBar
              items={[
                { label: "Net Operating Income", value: fmtCurrency(noi), accent: noi > 0 ? "text-green-500" : "text-red-500" },
                { label: `NOI / ${getUnitLabel(propertyType)}`, value: noiPerUnit > 0 ? fmtCurrency(noiPerUnit) : "\u2014", sub: "/year" },
                { label: "Cap Rate", value: capRate > 0 ? `${capRate.toFixed(1)}%` : "\u2014", sub: purchasePrice > 0 ? `@ ${fmtCurrency(purchasePrice)} PP` : undefined },
                { label: "Expense Ratio", value: expenseRatio > 0 ? `${expenseRatio.toFixed(1)}%` : "\u2014" },
              ]}
            />
          </>
        )
      ) : (
        /* Upload mode */
        <SectionCard title="Upload T12 / P&L" icon={Upload}>
          <div
            onClick={() => setUploadOpen(true)}
            className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-3 cursor-pointer hover:border-foreground/20 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-purple-400" strokeWidth={1.5} />
            </div>
            <div className="text-sm font-semibold">Upload borrower P&L for categorization</div>
            <div className="text-xs text-muted-foreground">Handles any format: QuickBooks, Rent Manager, custom spreadsheets</div>
          </div>
        </SectionCard>
      )}

      {/* Upload Dialog */}
      <UploadT12Dialog open={uploadOpen} onOpenChange={setUploadOpen} onImport={handleT12Import} />

      {/* Edit Income Dialog */}
      <EditIncomeDialog open={editIncomeOpen} onOpenChange={setEditIncomeOpen} incomeRows={incomeRows} uwId={uwId} />

      {/* Edit Expense Dialog */}
      <EditExpenseDialog open={editExpenseOpen} onOpenChange={setEditExpenseOpen} expenseRows={expenseRows} uwId={uwId} />
    </div>
  );
}

// ── Income Card ──

function IncomeCard({
  incomeRows,
  netRevenue,
  expandedNoteId,
  onToggleNote,
  onSaveNote,
  onEdit,
  title = "Income",
}: {
  incomeRows: ExtendedIncomeRow[];
  netRevenue: number;
  expandedNoteId: string | null;
  onToggleNote: (id: string | null) => void;
  onSaveNote: (id: string, notes: string, type: "expense" | "income") => void;
  onEdit: () => void;
  title?: string;
}) {
  return (
    <SectionCard
      title={title}
      icon={TrendingUp}
      actions={
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px] text-muted-foreground" onClick={onEdit}>
          <Pencil className="h-2.5 w-2.5" /> Edit
        </Button>
      }
    >
      {incomeRows.map((row, i) => (
        <div key={row.id || i}>
          <div className={cn("flex justify-between items-center py-2.5 group", i < incomeRows.length - 1 && "border-b")}>
            <div className="flex items-center gap-1.5">
              <span className={cn("text-[13px]", row.is_deduction ? "text-muted-foreground" : "")}>
                {row.is_deduction ? "Less: " : ""}{row.line_item}
              </span>
              {/* Note indicator / toggle */}
              {row.id && (
                <NoteToggle
                  rowId={row.id}
                  hasNote={!!row.notes}
                  isExpanded={expandedNoteId === row.id}
                  onToggle={() => onToggleNote(expandedNoteId === row.id ? null : row.id!)}
                />
              )}
            </div>
            <span className={cn("text-[13px] font-medium num min-w-[80px] text-right", row.is_deduction && "text-red-500")}>
              {row.is_deduction ? `(${fmtCurrency(Math.abs(row.t12_amount))})` : fmtCurrency(row.t12_amount)}
            </span>
          </div>
          {/* Inline note */}
          {row.id && expandedNoteId === row.id && (
            <InlineNote
              rowId={row.id}
              initialValue={row.notes ?? ""}
              onSave={(notes) => onSaveNote(row.id!, notes, "income")}
              onClose={() => onToggleNote(null)}
            />
          )}
        </div>
      ))}
      <div className="flex justify-between pt-3 mt-2 border-t-2">
        <span className="text-sm font-bold">Effective Gross Income</span>
        <span className="text-sm font-bold num">{fmtCurrency(netRevenue)}</span>
      </div>
    </SectionCard>
  );
}

// ── Expenses Card with Guidance ──

function ExpensesCard({
  expenseRows,
  netRevenue,
  totalExpenses,
  benchmarks,
  benchmarkInfo,
  unitLabel,
  expandedNoteId,
  onToggleNote,
  onSaveNote,
  onEdit,
  onApplyGuidance,
  totalBenchmark,
}: {
  expenseRows: ExtendedExpenseRow[];
  netRevenue: number;
  totalExpenses: number;
  benchmarks: Record<ExpenseBenchmarkCategory, number> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  benchmarkInfo: any;
  unitLabel: string;
  expandedNoteId: string | null;
  onToggleNote: (id: string | null) => void;
  onSaveNote: (id: string, notes: string, type: "expense" | "income") => void;
  onEdit: () => void;
  onApplyGuidance?: () => void;
  totalBenchmark: number;
}) {
  const hasBenchmarks = !!benchmarks;

  return (
    <SectionCard
      title="Operating Expenses"
      icon={DollarSign}
      actions={
        <div className="flex items-center gap-1">
          {hasBenchmarks && onApplyGuidance && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px] text-muted-foreground" onClick={onApplyGuidance}>
                    <Zap className="h-2.5 w-2.5" /> Apply Guidance
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Auto-populate Year 1 expenses from Requity benchmarks</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px] text-muted-foreground" onClick={onEdit}>
            <Pencil className="h-2.5 w-2.5" /> Edit
          </Button>
        </div>
      }
    >
      {/* Column headers when benchmarks available */}
      {hasBenchmarks && (
        <div className="flex items-center text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 pb-2 border-b">
          <span className="flex-1">Category</span>
          <span className="w-[80px] text-right">T-12</span>
          <span className="w-[80px] text-right">Benchmark</span>
          <span className="w-[80px] text-right">Variance</span>
        </div>
      )}

      {expenseRows.map((row, i) => {
        const benchCat = matchBenchmarkCategory(row.category);
        const benchVal = benchCat && benchmarks ? benchmarks[benchCat] : null;
        const variance = benchVal != null ? calcVariance(row.t12_amount, benchVal) : null;

        return (
          <div key={row.id || i}>
            <div className={cn("flex items-center py-2.5 group", i < expenseRows.length - 1 && "border-b")}>
              <div className="flex-1 flex items-center gap-1.5 min-w-0">
                <span className="text-[13px] truncate">{row.category}</span>
                {/* Source badge */}
                {row.source === "guidance" && (
                  <span className="shrink-0 text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                    Guidance
                  </span>
                )}
                {/* Note toggle */}
                {row.id && (
                  <NoteToggle
                    rowId={row.id}
                    hasNote={!!row.notes}
                    isExpanded={expandedNoteId === row.id}
                    onToggle={() => onToggleNote(expandedNoteId === row.id ? null : row.id!)}
                  />
                )}
              </div>

              {hasBenchmarks ? (
                <>
                  {/* T-12 Amount */}
                  <span className="w-[80px] text-right text-[13px] font-medium num">
                    {fmtCurrency(row.t12_amount)}
                  </span>
                  {/* Benchmark Ref */}
                  <span className="w-[80px] text-right text-[11px] text-muted-foreground num">
                    {benchVal != null ? fmtCurrency(benchVal) : "\u2014"}
                  </span>
                  {/* Variance */}
                  <span className={cn(
                    "w-[80px] text-right text-[11px] font-medium num flex items-center justify-end gap-0.5",
                    variance?.status === "match" && "text-green-500",
                    variance?.status === "over" && "text-amber-500",
                    variance?.status === "under" && "text-blue-500",
                  )}>
                    {variance ? (
                      variance.status === "match" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <>
                          {variance.status === "over" ? (
                            <ArrowUp className="h-2.5 w-2.5" />
                          ) : (
                            <ArrowDown className="h-2.5 w-2.5" />
                          )}
                          {Math.abs(variance.pct).toFixed(0)}%
                        </>
                      )
                    ) : "\u2014"}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground num">
                    {netRevenue > 0 ? `${((row.t12_amount / netRevenue) * 100).toFixed(1)}%` : "\u2014"}
                  </span>
                  <span className="text-[13px] font-medium num min-w-[80px] text-right">{fmtCurrency(row.t12_amount)}</span>
                </div>
              )}
            </div>

            {/* Inline note */}
            {row.id && expandedNoteId === row.id && (
              <InlineNote
                rowId={row.id}
                initialValue={row.notes ?? ""}
                onSave={(notes) => onSaveNote(row.id!, notes, "expense")}
                onClose={() => onToggleNote(null)}
              />
            )}
          </div>
        );
      })}

      {/* Totals */}
      <div className={cn("flex items-center pt-3 mt-2 border-t-2", hasBenchmarks ? "" : "justify-between")}>
        {hasBenchmarks ? (
          <>
            <span className="flex-1 text-sm font-bold">Total OpEx</span>
            <span className="w-[80px] text-right text-sm font-bold num">{fmtCurrency(totalExpenses)}</span>
            <span className="w-[80px] text-right text-[11px] text-muted-foreground num">
              {totalBenchmark > 0 ? fmtCurrency(totalBenchmark) : "\u2014"}
            </span>
            <span className={cn(
              "w-[80px] text-right text-[11px] font-medium num",
              totalBenchmark > 0 && Math.abs(totalExpenses - totalBenchmark) < 1 ? "text-green-500" :
              totalExpenses > totalBenchmark ? "text-amber-500" : "text-blue-500"
            )}>
              {totalBenchmark > 0
                ? `${totalExpenses > totalBenchmark ? "+" : ""}${(((totalExpenses - totalBenchmark) / totalBenchmark) * 100).toFixed(0)}%`
                : "\u2014"}
            </span>
          </>
        ) : (
          <>
            <span className="text-sm font-bold">Total OpEx</span>
            <span className="text-sm font-bold num">{fmtCurrency(totalExpenses)}</span>
          </>
        )}
      </div>

      {/* Benchmark source label */}
      {hasBenchmarks && benchmarkInfo && (
        <div className="mt-3 pt-2 border-t text-[10px] text-muted-foreground">
          Benchmarks: Requity {benchmarkInfo.basisLabel === "SF" ? "per SF" : `per ${benchmarkInfo.basisLabel.toLowerCase()}`} guidance ({unitLabel})
        </div>
      )}
    </SectionCard>
  );
}

// ── Note Toggle Button ──

function NoteToggle({
  rowId,
  hasNote,
  isExpanded,
  onToggle,
}: {
  rowId: string;
  hasNote: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "shrink-0 rounded p-0.5 transition-all",
        hasNote
          ? "text-blue-500 opacity-100"
          : "text-muted-foreground opacity-0 group-hover:opacity-60 hover:!opacity-100",
        isExpanded && "opacity-100 bg-muted"
      )}
    >
      <MessageSquare className="h-3 w-3" />
    </button>
  );
}

// ── Inline Note ──

function InlineNote({
  rowId,
  initialValue,
  onSave,
  onClose,
}: {
  rowId: string;
  initialValue: string;
  onSave: (notes: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const isDirty = value !== initialValue;

  const handleSave = async () => {
    setSaving(true);
    await onSave(value);
    setSaving(false);
    onClose();
  };

  return (
    <div className="ml-1 mb-2 flex flex-col gap-1.5 bg-muted/30 rounded-lg p-2.5 border">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add underwriter notes..."
        className="min-h-[60px] text-xs bg-transparent border-none p-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
        autoFocus
      />
      <div className="flex items-center gap-1.5 justify-end">
        <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={onClose}>
          Cancel
        </Button>
        {isDirty && (
          <Button size="sm" className="h-6 text-[11px]" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Edit Income Dialog ──

function EditIncomeDialog({
  open,
  onOpenChange,
  incomeRows,
  uwId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeRows: ExtendedIncomeRow[];
  uwId: string | null;
}) {
  const [rows, setRows] = useState<{ line_item: string; t12_amount: number; year_1_amount: number; growth_rate: number; is_deduction: boolean; sort_order: number; notes?: string | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setRows(
        incomeRows.length > 0
          ? incomeRows.map((r, i) => ({ line_item: r.line_item, t12_amount: r.t12_amount, year_1_amount: r.year_1_amount, growth_rate: r.growth_rate, is_deduction: r.is_deduction, sort_order: i, notes: r.notes }))
          : [
              { line_item: "Gross Potential Rent", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_deduction: false, sort_order: 0 },
              { line_item: "Vacancy Loss", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_deduction: true, sort_order: 1 },
              { line_item: "Concessions", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_deduction: true, sort_order: 2 },
            ]
      );
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const result = await upsertIncomeRows(uwId, rows.map((r, i) => ({ ...r, sort_order: i })));
      if (result.error) {
        toast.error(`Failed to save income: ${result.error}`);
      } else {
        toast.success("Income data saved");
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit T12 Income</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Line Item</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">T12 Amount</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Yr 1 Amount</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Deduction?</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-1">
                    <Input className="h-8" value={row.line_item} onChange={(e) => setRows((prev) => prev.map((r, j) => j === i ? { ...r, line_item: e.target.value } : r))} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8 w-28" type="number" value={row.t12_amount || ""} onChange={(e) => setRows((prev) => prev.map((r, j) => j === i ? { ...r, t12_amount: Number(e.target.value) || 0 } : r))} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8 w-28" type="number" value={row.year_1_amount || ""} onChange={(e) => setRows((prev) => prev.map((r, j) => j === i ? { ...r, year_1_amount: Number(e.target.value) || 0 } : r))} />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input type="checkbox" checked={row.is_deduction} onChange={(e) => setRows((prev) => prev.map((r, j) => j === i ? { ...r, is_deduction: e.target.checked } : r))} />
                  </td>
                  <td className="px-2 py-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}>
                      <span className="text-muted-foreground text-xs">&times;</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="outline" size="sm" className="w-fit gap-1" onClick={() => setRows((prev) => [...prev, { line_item: "", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_deduction: false, sort_order: prev.length }])}>
          <Plus className="h-3 w-3" /> Add Line Item
        </Button>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Income
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Expense Dialog (with guidance) ──

function EditExpenseDialog({
  open,
  onOpenChange,
  expenseRows,
  uwId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseRows: ExtendedExpenseRow[];
  uwId: string | null;
}) {
  const [rows, setRows] = useState<{ category: string; t12_amount: number; year_1_amount: number; growth_rate: number; is_percentage: boolean; sort_order: number; source?: string; notes?: string | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setRows(
        expenseRows.length > 0
          ? expenseRows.map((r, i) => ({
              category: r.category,
              t12_amount: r.t12_amount,
              year_1_amount: r.year_1_amount,
              growth_rate: r.growth_rate,
              is_percentage: r.is_percentage,
              sort_order: i,
              source: r.source ?? "manual",
              notes: r.notes,
            }))
          : [
              { category: "Property Taxes", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: 0 },
              { category: "Insurance", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: 1 },
              { category: "Utilities", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: 2 },
              { category: "Repairs & Maintenance", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: 3 },
              { category: "Management Fee", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: 4 },
              { category: "G&A / Other", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: 5 },
            ]
      );
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const result = await upsertExpenseRows(uwId, rows.map((r, i) => ({
        ...r,
        sort_order: i,
        source: r.source === "guidance" && r.t12_amount !== r.year_1_amount ? "manual" : (r.source ?? "manual"),
      })));
      if (result.error) {
        toast.error(`Failed to save expenses: ${result.error}`);
      } else {
        toast.success("Expense data saved");
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expenses</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">T12 Amount</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Year 1 Amount</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Growth %</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-1">
                    <Input className="h-8" value={row.category} onChange={(e) => setRows((prev) => prev.map((r, j) => j === i ? { ...r, category: e.target.value } : r))} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8 w-28" type="number" value={row.t12_amount || ""} onChange={(e) => setRows((prev) => prev.map((r, j) => j === i ? { ...r, t12_amount: Number(e.target.value) || 0 } : r))} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8 w-28" type="number" value={row.year_1_amount || ""} onChange={(e) => setRows((prev) => prev.map((r, j) => j === i ? { ...r, year_1_amount: Number(e.target.value) || 0, source: "manual" } : r))} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8 w-20" type="number" step="0.1" value={row.growth_rate || ""} placeholder="0" onChange={(e) => setRows((prev) => prev.map((r, j) => j === i ? { ...r, growth_rate: Number(e.target.value) || 0 } : r))} />
                  </td>
                  <td className="px-2 py-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}>
                      <span className="text-muted-foreground text-xs">&times;</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="outline" size="sm" className="w-fit gap-1" onClick={() => setRows((prev) => [...prev, { category: "", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: prev.length }])}>
          <Plus className="h-3 w-3" /> Add Expense
        </Button>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Expenses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
