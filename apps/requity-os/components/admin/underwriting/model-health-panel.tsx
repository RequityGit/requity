"use client";

import { useMemo, useState } from "react";
import {
  Check,
  AlertTriangle,
  Minus,
  Activity,
  ClipboardCopy,
  FlaskConical,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";
import { computeOutputs } from "@/lib/underwriting/calculator";
import {
  analyzeDiagnostics,
  formatDiagnosticReport,
  type DiagnosticResult,
  type DiagnosticStatus,
} from "@/lib/underwriting/diagnostics";
import type { UnderwritingInputs, UnderwritingOutputs } from "@/lib/underwriting/types";

interface ModelHealthPanelProps {
  inputs: UnderwritingInputs;
  modelType: "rtl" | "dscr";
  isSandbox?: boolean;
  dealId?: string;
}

const STATUS_COLORS: Record<DiagnosticStatus, string> = {
  computed: "bg-green-500",
  incomplete: "bg-amber-500",
  empty: "bg-muted-foreground/40",
};

const STATUS_LABELS: Record<DiagnosticStatus, string> = {
  computed: "All Inputs Populated",
  incomplete: "Some Inputs Missing",
  empty: "No Inputs Set",
};

export function ModelHealthPanel({ inputs, modelType, isSandbox, dealId }: ModelHealthPanelProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { outputs, diagnostic } = useMemo(() => {
    const o = computeOutputs(inputs);
    const d = analyzeDiagnostics(inputs, o, modelType);
    return { outputs: o, diagnostic: d };
  }, [inputs, modelType]);

  const handleCopyReport = async () => {
    const report = formatDiagnosticReport(diagnostic, modelType);
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium rounded-lg transition-colors",
            "bg-card border border-border hover:bg-muted/50"
          )}
        >
          <Activity size={14} strokeWidth={1.5} className="text-muted-foreground" />
          <span className="text-foreground">Model Health</span>
          <span className={cn("h-2 w-2 rounded-full", STATUS_COLORS[diagnostic.overallStatus])} />
          <span className="text-[11px] text-muted-foreground font-normal">
            {STATUS_LABELS[diagnostic.overallStatus]}
          </span>
          <ChevronDown
            size={14}
            className={cn(
              "ml-auto text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
            strokeWidth={1.5}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 rounded-lg border border-border bg-card p-4 space-y-4">
          {/* Input Status Section */}
          <div>
            <h4 className="text-[12px] font-semibold text-foreground uppercase tracking-wider mb-2">
              Input Status
              <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">
                {diagnostic.inputSummary.populated} of {diagnostic.inputSummary.total} populated
              </span>
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
              {diagnostic.inputs
                .filter((inp) => {
                  // Show only model-relevant inputs
                  const relevantKeys = modelType === "rtl"
                    ? ["loan_amount", "purchase_price", "appraised_value", "interest_rate", "points", "loan_term_months", "after_repair_value", "rehab_budget", "holding_period_months", "projected_sale_price", "sales_disposition_pct", "mobilization_draw", "lender_fees_flat", "title_closing_escrow", "num_partners"]
                    : ["loan_amount", "purchase_price", "appraised_value", "interest_rate", "points", "loan_term_months", "after_repair_value", "monthly_rent", "annual_property_tax", "annual_insurance", "monthly_hoa", "monthly_utilities", "operating_expenses", "lender_fees_flat", "title_closing_escrow"];
                  return relevantKeys.includes(inp.key);
                })
                .map((inp) => (
                  <div key={inp.key} className="flex items-center gap-2 py-0.5 text-[11px]">
                    {inp.present ? (
                      <Check size={11} className="text-green-500 shrink-0" strokeWidth={2} />
                    ) : (
                      <AlertTriangle size={11} className="text-amber-500 shrink-0" strokeWidth={2} />
                    )}
                    <span className="text-muted-foreground truncate">{inp.label}</span>
                    <span className="ml-auto num text-foreground font-medium">
                      {inp.present && inp.value != null ? formatInputValue(inp.key, inp.value) : "—"}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Computation Status Section */}
          <div>
            <h4 className="text-[12px] font-semibold text-foreground uppercase tracking-wider mb-2">
              Computation Status
            </h4>
            <div className="grid grid-cols-1 gap-0.5">
              {diagnostic.metrics.map((m) => {
                const missingDeps = m.requiredInputs.filter((r) => !r.present);
                return (
                  <div key={m.key} className="flex items-start gap-2 py-0.5 text-[11px]">
                    {m.status === "computed" ? (
                      <Check size={12} className="text-green-500 mt-px shrink-0" strokeWidth={2} />
                    ) : m.status === "incomplete" ? (
                      <AlertTriangle size={12} className="text-amber-500 mt-px shrink-0" strokeWidth={2} />
                    ) : (
                      <Minus size={12} className="text-muted-foreground/50 mt-px shrink-0" strokeWidth={2} />
                    )}
                    <span className="font-medium text-foreground min-w-[120px]">{m.label}</span>
                    {m.status === "computed" && m.value != null ? (
                      <span className="num text-muted-foreground">
                        {formatOutputValue(m.key, m.value)}
                      </span>
                    ) : missingDeps.length > 0 ? (
                      <span className="text-muted-foreground">
                        needs: {missingDeps.map((d) => d.label).join(", ")}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={handleCopyReport}
            >
              <ClipboardCopy size={12} className="mr-1" strokeWidth={1.5} />
              {copied ? "Copied" : "Copy Report"}
            </Button>
            {!isSandbox && dealId && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                asChild
              >
                <Link href={`/models/${modelType}/sandbox`}>
                  <FlaskConical size={12} className="mr-1" strokeWidth={1.5} />
                  Open in Sandbox
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Format input values for display
function formatInputValue(key: string, value: number): string {
  if (key.includes("rate") || key.includes("pct") || key === "points") {
    return `${value}%`;
  }
  if (key.includes("months")) {
    return `${value} mo`;
  }
  if (key === "num_partners" || key === "experience_count" || key === "credit_score") {
    return String(value);
  }
  return formatCurrency(value);
}

// Format output values for display
function formatOutputValue(key: string, value: number): string {
  const pctKeys = ["ltv", "ltarv", "ltc", "net_yield", "investor_return", "borrower_roi", "annualized_roi"];
  if (pctKeys.includes(key)) return `${value.toFixed(2)}%`;
  if (key === "debt_service_coverage") return `${value.toFixed(2)}x`;
  return formatCurrency(value);
}
