"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Save,
  History,
  CheckCircle2,
  ArrowLeftRight,
  Star,
  Eye,
} from "lucide-react";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatPercent,
  formatDate,
} from "@/lib/format";
import { computeOutputs } from "@/lib/underwriting/calculator";
import type {
  UnderwritingInputs,
  UnderwritingOutputs,
} from "@/lib/underwriting/types";
import { DEFAULT_INPUTS } from "@/lib/underwriting/types";
import {
  createUnderwritingVersion,
  setActiveVersion,
  updateUnderwritingVersionStatus,
} from "@/app/(authenticated)/admin/loans/[id]/underwriting-actions";
import { LOAN_DB_TYPES, LOAN_PURPOSES } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VersionRow {
  id: string;
  loan_id: string;
  version_number: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  label: string | null;
  notes: string | null;
  calculator_inputs: any;
  calculator_outputs: any;
  status: string;
  creator?: { full_name: string | null } | null;
}

interface LoanUnderwritingTabProps {
  loanId: string;
  versions: VersionRow[];
  currentUserId: string;
  loanDefaults: Partial<UnderwritingInputs>;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LoanUnderwritingTab({
  loanId,
  versions: initialVersions,
  currentUserId,
  loanDefaults,
}: LoanUnderwritingTabProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [versions, setVersions] = useState(initialVersions);
  const [saving, setSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [saveLabel, setSaveLabel] = useState("");
  const [saveNotes, setSaveNotes] = useState("");

  // Active version or defaults
  const activeVersion = versions.find((v) => v.is_active);
  const initialInputs: UnderwritingInputs = activeVersion
    ? (activeVersion.calculator_inputs as UnderwritingInputs)
    : { ...DEFAULT_INPUTS, ...loanDefaults };

  const [inputs, setInputs] = useState<UnderwritingInputs>(initialInputs);

  // Reset inputs when active version changes
  useEffect(() => {
    if (activeVersion) {
      setInputs(activeVersion.calculator_inputs as UnderwritingInputs);
    }
  }, [activeVersion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-compute outputs
  const outputs = useMemo(() => computeOutputs(inputs), [inputs]);

  const updateInput = useCallback(
    (field: keyof UnderwritingInputs, value: string) => {
      setInputs((prev) => ({
        ...prev,
        [field]:
          value === ""
            ? null
            : typeof prev[field] === "string"
              ? value
              : parseFloat(value) || null,
      }));
    },
    []
  );

  const updateInputStr = useCallback(
    (field: keyof UnderwritingInputs, value: string) => {
      setInputs((prev) => ({ ...prev, [field]: value || null }));
    },
    []
  );

  // Save new version
  async function handleSaveVersion() {
    setSaving(true);
    try {
      const isFirst = versions.length === 0;
      const result = await createUnderwritingVersion({
        loanId,
        label: saveLabel || null,
        notes: saveNotes || null,
        calculatorInputs: inputs,
        calculatorOutputs: outputs,
        setActive: isFirst,
      });

      if (result.error) throw new Error(result.error);

      toast({ title: "Underwriting version saved" });
      setSaveDialogOpen(false);
      setSaveLabel("");
      setSaveNotes("");
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error saving version",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  // Set active version
  async function handleSetActive(versionId: string) {
    const result = await setActiveVersion(versionId);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Active version updated" });
    router.refresh();
  }

  // Update status
  async function handleStatusChange(versionId: string, status: string) {
    const result = await updateUnderwritingVersionStatus(versionId, status);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: `Version marked as ${status}` });
    router.refresh();
  }

  // Load a version into the form
  function loadVersion(version: VersionRow) {
    setInputs(version.calculator_inputs as UnderwritingInputs);
    setHistoryOpen(false);
    toast({ title: `Loaded version ${version.version_number}` });
  }

  // Compare versions
  const versionA = compareA
    ? versions.find((v) => v.id === compareA)
    : null;
  const versionB = compareB
    ? versions.find((v) => v.id === compareB)
    : null;

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="LTV" value={outputs.ltv != null ? `${outputs.ltv}%` : "—"} />
        <MetricCard label="LTARV" value={outputs.ltarv != null ? `${outputs.ltarv}%` : "—"} />
        <MetricCard label="DSCR" value={outputs.debt_service_coverage != null ? `${outputs.debt_service_coverage}x` : "—"} />
        <MetricCard label="Monthly Payment" value={formatCurrency(outputs.monthly_payment)} />
        <MetricCard label="Net Yield" value={outputs.net_yield != null ? `${outputs.net_yield}%` : "—"} />
        <MetricCard label="Investor Return" value={outputs.investor_return != null ? `${outputs.investor_return}%` : "—"} />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setSaveDialogOpen(true)} className="gap-2">
          <Save className="h-4 w-4" />
          Save New Version
        </Button>
        <Button
          variant="outline"
          onClick={() => setHistoryOpen(true)}
          className="gap-2"
        >
          <History className="h-4 w-4" />
          Version History ({versions.length})
        </Button>
        {activeVersion && (
          <Badge variant="outline" className="self-center text-xs">
            Active: v{activeVersion.version_number}
            {activeVersion.label ? ` — ${activeVersion.label}` : ""}
          </Badge>
        )}
      </div>

      {/* Calculator Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column — Inputs */}
        <div className="space-y-4">
          {/* Loan Terms */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Loan Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Loan Amount ($)"
                  value={inputs.loan_amount}
                  onChange={(v) => updateInput("loan_amount", v)}
                  type="number"
                />
                <FormField
                  label="Purchase Price ($)"
                  value={inputs.purchase_price}
                  onChange={(v) => updateInput("purchase_price", v)}
                  type="number"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Appraised Value ($)"
                  value={inputs.appraised_value}
                  onChange={(v) => updateInput("appraised_value", v)}
                  type="number"
                />
                <FormField
                  label="Interest Rate (%)"
                  value={inputs.interest_rate}
                  onChange={(v) => updateInput("interest_rate", v)}
                  type="number"
                  step="0.125"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  label="Points (%)"
                  value={inputs.points}
                  onChange={(v) => updateInput("points", v)}
                  type="number"
                  step="0.25"
                />
                <FormField
                  label="Term (months)"
                  value={inputs.loan_term_months}
                  onChange={(v) => updateInput("loan_term_months", v)}
                  type="number"
                />
                <div className="space-y-1.5">
                  <Label className="text-xs">Loan Type</Label>
                  <Select
                    value={inputs.loan_type ?? ""}
                    onValueChange={(v) => updateInputStr("loan_type", v)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOAN_DB_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Loan Purpose</Label>
                <Select
                  value={inputs.loan_purpose ?? ""}
                  onValueChange={(v) => updateInputStr("loan_purpose", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_PURPOSES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="After Repair Value ($)"
                  value={inputs.after_repair_value}
                  onChange={(v) => updateInput("after_repair_value", v)}
                  type="number"
                />
                <FormField
                  label="Rehab Budget ($)"
                  value={inputs.rehab_budget}
                  onChange={(v) => updateInput("rehab_budget", v)}
                  type="number"
                />
              </div>
              <FormField
                label="Heated Sq Ft"
                value={inputs.heated_sqft}
                onChange={(v) => updateInput("heated_sqft", v)}
                type="number"
              />
            </CardContent>
          </Card>

          {/* Income / Expenses */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Income / Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FormField
                label="Monthly Rent ($)"
                value={inputs.monthly_rent}
                onChange={(v) => updateInput("monthly_rent", v)}
                type="number"
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Annual Property Tax ($)"
                  value={inputs.annual_property_tax}
                  onChange={(v) => updateInput("annual_property_tax", v)}
                  type="number"
                />
                <FormField
                  label="Annual Insurance ($)"
                  value={inputs.annual_insurance}
                  onChange={(v) => updateInput("annual_insurance", v)}
                  type="number"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  label="Monthly HOA ($)"
                  value={inputs.monthly_hoa}
                  onChange={(v) => updateInput("monthly_hoa", v)}
                  type="number"
                />
                <FormField
                  label="Monthly Utilities ($)"
                  value={inputs.monthly_utilities}
                  onChange={(v) => updateInput("monthly_utilities", v)}
                  type="number"
                />
                <FormField
                  label="Operating Expenses ($)"
                  value={inputs.operating_expenses}
                  onChange={(v) => updateInput("operating_expenses", v)}
                  type="number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Exit Strategy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Exit Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Exit Strategy</Label>
                <Select
                  value={inputs.exit_strategy ?? ""}
                  onValueChange={(v) => updateInputStr("exit_strategy", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="refinance">Refinance</SelectItem>
                    <SelectItem value="hold">Hold / Rental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Holding Period (months)"
                  value={inputs.holding_period_months}
                  onChange={(v) => updateInput("holding_period_months", v)}
                  type="number"
                />
                <FormField
                  label="Projected Sale Price ($)"
                  value={inputs.projected_sale_price}
                  onChange={(v) => updateInput("projected_sale_price", v)}
                  type="number"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Sales Disposition (%)"
                  value={inputs.sales_disposition_pct}
                  onChange={(v) => updateInput("sales_disposition_pct", v)}
                  type="number"
                  step="0.5"
                />
                <FormField
                  label="# Partners"
                  value={inputs.num_partners}
                  onChange={(v) => updateInput("num_partners", v)}
                  type="number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Additional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Credit Score"
                  value={inputs.credit_score}
                  onChange={(v) => updateInput("credit_score", v)}
                  type="number"
                />
                <FormField
                  label="Experience (deals in 24mo)"
                  value={inputs.experience_count}
                  onChange={(v) => updateInput("experience_count", v)}
                  type="number"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  label="Mobilization Draw ($)"
                  value={inputs.mobilization_draw}
                  onChange={(v) => updateInput("mobilization_draw", v)}
                  type="number"
                />
                <FormField
                  label="Lender Fees Flat ($)"
                  value={inputs.lender_fees_flat}
                  onChange={(v) => updateInput("lender_fees_flat", v)}
                  type="number"
                />
                <FormField
                  label="Title/Closing/Escrow ($)"
                  value={inputs.title_closing_escrow}
                  onChange={(v) => updateInput("title_closing_escrow", v)}
                  type="number"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Outputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Loan Sizing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OutputGrid>
                <OutputRow label="LTV" value={outputs.ltv != null ? `${outputs.ltv}%` : "—"} />
                <OutputRow label="LTARV" value={outputs.ltarv != null ? `${outputs.ltarv}%` : "—"} />
                <OutputRow label="LTC" value={outputs.ltc != null ? `${outputs.ltc}%` : "—"} />
                <OutputRow label="Total Project Cost" value={formatCurrency(outputs.total_project_cost)} />
                <OutputRow label="Max Loan (75% LTV)" value={formatCurrency(outputs.max_loan_ltv)} />
                <OutputRow label="Max Loan (70% LTARV)" value={formatCurrency(outputs.max_loan_ltarv)} />
              </OutputGrid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Debt Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OutputGrid>
                <OutputRow label="Monthly Payment" value={formatCurrencyDetailed(outputs.monthly_payment)} />
                <OutputRow label="Total Interest" value={formatCurrency(outputs.total_interest)} />
                <OutputRow label="DSCR" value={outputs.debt_service_coverage != null ? `${outputs.debt_service_coverage}x` : "—"} />
              </OutputGrid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Fees & Closing Costs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OutputGrid>
                <OutputRow label="Origination Fee" value={formatCurrency(outputs.origination_fee)} />
                <OutputRow label="Total Fees" value={formatCurrency(outputs.total_fees)} />
                <OutputRow label="Total Closing Costs" value={formatCurrency(outputs.total_closing_costs)} />
                <OutputRow
                  label="Total Cash to Close"
                  value={formatCurrency(outputs.total_cash_to_close)}
                  highlight
                />
              </OutputGrid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Holding Costs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OutputGrid>
                <OutputRow label="Monthly Holding Costs" value={formatCurrencyDetailed(outputs.monthly_holding_costs)} />
                <OutputRow label="Total Holding Costs" value={formatCurrency(outputs.total_holding_costs)} />
              </OutputGrid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                P&L / Exit Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OutputGrid>
                <OutputRow label="Gross Sale Proceeds" value={formatCurrency(outputs.gross_sale_proceeds)} />
                <OutputRow label="Sales Costs" value={formatCurrency(outputs.sales_costs)} />
                <OutputRow label="Net Sale Proceeds" value={formatCurrency(outputs.net_sale_proceeds)} />
                <OutputRow
                  label="Net Profit"
                  value={formatCurrency(outputs.net_profit)}
                  highlight
                />
              </OutputGrid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OutputGrid>
                <OutputRow label="Net Yield" value={outputs.net_yield != null ? `${outputs.net_yield}%` : "—"} />
                <OutputRow label="Investor Return" value={outputs.investor_return != null ? `${outputs.investor_return}%` : "—"} />
                <OutputRow label="Borrower ROI" value={outputs.borrower_roi != null ? `${outputs.borrower_roi}%` : "—"} />
                <OutputRow label="Annualized ROI" value={outputs.annualized_roi != null ? `${outputs.annualized_roi}%` : "—"} />
              </OutputGrid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Per Partner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OutputGrid>
                <OutputRow label="Cash per Partner" value={formatCurrency(outputs.cash_per_partner)} />
                <OutputRow label="Profit per Partner" value={formatCurrency(outputs.profit_per_partner)} />
              </OutputGrid>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Version Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save New Underwriting Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input
                placeholder='e.g. "Initial UW", "Revised Terms", "Final Approval"'
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Reason for changes..."
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveVersion} disabled={saving}>
              {saving ? "Saving..." : "Save Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Version History</SheetTitle>
            <SheetDescription>
              {versions.length} version{versions.length !== 1 ? "s" : ""}
            </SheetDescription>
          </SheetHeader>

          {versions.length > 1 && (
            <div className="mt-4">
              <Button
                variant={compareMode ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => {
                  setCompareMode(!compareMode);
                  setCompareA(null);
                  setCompareB(null);
                }}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                {compareMode ? "Exit Compare" : "Compare Versions"}
              </Button>
            </div>
          )}

          {compareMode && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Version A</Label>
                <Select
                  value={compareA ?? ""}
                  onValueChange={setCompareA}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        v{v.version_number}
                        {v.label ? ` — ${v.label}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Version B</Label>
                <Select
                  value={compareB ?? ""}
                  onValueChange={setCompareB}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        v{v.version_number}
                        {v.label ? ` — ${v.label}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Compare View */}
          {compareMode && versionA && versionB && (
            <div className="mt-4">
              <VersionCompare versionA={versionA} versionB={versionB} />
            </div>
          )}

          {/* Version list */}
          <div className="mt-4 space-y-3">
            {versions.map((version) => (
              <Card key={version.id}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">
                          v{version.version_number}
                        </span>
                        {version.label && (
                          <span className="text-sm text-muted-foreground">
                            — {version.label}
                          </span>
                        )}
                        {version.is_active && (
                          <Badge variant="success" className="text-[10px] px-1.5 py-0">
                            Active
                          </Badge>
                        )}
                        <StatusBadge status={version.status} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        by{" "}
                        {(version.creator as any)?.full_name ?? "Unknown"}{" "}
                        on {formatDate(version.created_at)}
                      </div>
                      {version.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {version.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Key metrics preview */}
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">LTV:</span>{" "}
                      {(version.calculator_outputs as any)?.ltv != null
                        ? `${(version.calculator_outputs as any).ltv}%`
                        : "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">DSCR:</span>{" "}
                      {(version.calculator_outputs as any)?.debt_service_coverage != null
                        ? `${(version.calculator_outputs as any).debt_service_coverage}x`
                        : "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Net Profit:</span>{" "}
                      {formatCurrency(
                        (version.calculator_outputs as any)?.net_profit
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => loadVersion(version)}
                    >
                      <Eye className="h-3 w-3" />
                      Load
                    </Button>
                    {!version.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleSetActive(version.id)}
                      >
                        <Star className="h-3 w-3" />
                        Set Active
                      </Button>
                    )}
                    {version.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 text-blue-700"
                        onClick={() =>
                          handleStatusChange(version.id, "submitted")
                        }
                      >
                        Submit
                      </Button>
                    )}
                    {version.status === "submitted" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 text-green-700"
                          onClick={() =>
                            handleStatusChange(version.id, "approved")
                          }
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 text-red-700"
                          onClick={() =>
                            handleStatusChange(version.id, "rejected")
                          }
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="py-3 px-4 text-center">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  value: string | number | null;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        step={step}
        className="h-9 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function OutputGrid({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function OutputRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium ${highlight ? "text-foreground font-bold" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Version Comparison
// ---------------------------------------------------------------------------

function VersionCompare({
  versionA,
  versionB,
}: {
  versionA: VersionRow;
  versionB: VersionRow;
}) {
  const inputsA = versionA.calculator_inputs as UnderwritingInputs;
  const inputsB = versionB.calculator_inputs as UnderwritingInputs;
  const outputsA = versionA.calculator_outputs as UnderwritingOutputs;
  const outputsB = versionB.calculator_outputs as UnderwritingOutputs;

  const inputFields: { key: keyof UnderwritingInputs; label: string }[] = [
    { key: "loan_amount", label: "Loan Amount" },
    { key: "purchase_price", label: "Purchase Price" },
    { key: "appraised_value", label: "Appraised Value" },
    { key: "interest_rate", label: "Interest Rate" },
    { key: "points", label: "Points" },
    { key: "loan_term_months", label: "Term (months)" },
    { key: "loan_type", label: "Loan Type" },
    { key: "after_repair_value", label: "ARV" },
    { key: "rehab_budget", label: "Rehab Budget" },
    { key: "monthly_rent", label: "Monthly Rent" },
    { key: "exit_strategy", label: "Exit Strategy" },
    { key: "holding_period_months", label: "Holding Period" },
    { key: "projected_sale_price", label: "Projected Sale" },
  ];

  const outputFields: { key: keyof UnderwritingOutputs; label: string }[] = [
    { key: "ltv", label: "LTV" },
    { key: "ltarv", label: "LTARV" },
    { key: "ltc", label: "LTC" },
    { key: "debt_service_coverage", label: "DSCR" },
    { key: "monthly_payment", label: "Monthly Payment" },
    { key: "total_interest", label: "Total Interest" },
    { key: "total_closing_costs", label: "Closing Costs" },
    { key: "net_profit", label: "Net Profit" },
    { key: "borrower_roi", label: "Borrower ROI" },
    { key: "net_yield", label: "Net Yield" },
    { key: "investor_return", label: "Investor Return" },
  ];

  // Filter to only show changed fields
  const changedInputs = inputFields.filter(
    (f) => String(inputsA?.[f.key] ?? "") !== String(inputsB?.[f.key] ?? "")
  );

  const changedOutputs = outputFields.filter(
    (f) => String(outputsA?.[f.key] ?? "") !== String(outputsB?.[f.key] ?? "")
  );

  if (changedInputs.length === 0 && changedOutputs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No differences between these versions.
      </p>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          v{versionA.version_number} vs v{versionB.version_number} —{" "}
          {changedInputs.length + changedOutputs.length} difference
          {changedInputs.length + changedOutputs.length !== 1 ? "s" : ""}
        </p>

        {changedInputs.length > 0 && (
          <>
            <p className="text-xs font-medium mt-2 mb-1">Input Changes</p>
            {changedInputs.map((f) => (
              <DiffRow
                key={f.key}
                label={f.label}
                valueA={String(inputsA?.[f.key] ?? "—")}
                valueB={String(inputsB?.[f.key] ?? "—")}
              />
            ))}
          </>
        )}

        {changedOutputs.length > 0 && (
          <>
            <p className="text-xs font-medium mt-3 mb-1">Output Changes</p>
            {changedOutputs.map((f) => (
              <DiffRow
                key={f.key}
                label={f.label}
                valueA={String(outputsA?.[f.key] ?? "—")}
                valueB={String(outputsB?.[f.key] ?? "—")}
              />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DiffRow({
  label,
  valueA,
  valueB,
}: {
  label: string;
  valueA: string;
  valueB: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs py-1 border-b last:border-b-0">
      <span className="w-28 text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-red-600 line-through flex-1 truncate">
        {valueA}
      </span>
      <span className="text-green-700 font-medium flex-1 truncate">
        {valueB}
      </span>
    </div>
  );
}
