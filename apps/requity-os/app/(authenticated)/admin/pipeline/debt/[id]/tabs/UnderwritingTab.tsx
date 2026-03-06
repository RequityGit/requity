"use client";

import { useState, useMemo } from "react";
import {
  Calculator,
  Plus,
  Eye,
  Loader2,
  Building2,
  Home,
  TrendingUp,
  ExternalLink,
  Check,
  AlertTriangle,
  Minus,
  ChevronDown,
  HardHat,
  Landmark,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  T,
  SectionCard,
  Badge,
  fD,
  getUWModelForLoanType,
  UW_MODEL_LABELS,
  type UWVersion,
  type UWModelType,
} from "../components";
import { createUWVersion } from "../actions";
import {
  analyzeDiagnostics,
  analyzeCommercialStatus,
  type DiagnosticResult,
  type DiagnosticStatus,
} from "@/lib/underwriting/diagnostics";
import { computeOutputs } from "@/lib/underwriting/calculator";
import { DEFAULT_INPUTS, type UnderwritingInputs } from "@/lib/underwriting/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface UnderwritingTabProps {
  dealId: string;
  dealType: string | null;
  uwVersions: UWVersion[];
  currentUserId: string;
  currentUserName: string;
  isOpportunity?: boolean;
}

const MODEL_ICONS: Record<UWModelType, typeof Building2> = {
  commercial: Building2,
  rtl: Home,
  dscr: TrendingUp,
  guc: HardHat,
  equity: Landmark,
};

export function UnderwritingTab({
  dealId,
  dealType,
  uwVersions,
  currentUserId,
  isOpportunity = false,
}: UnderwritingTabProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<UWVersion | null>(
    uwVersions.find((v) => v.is_active) || uwVersions[0] || null
  );

  const defaultModel = getUWModelForLoanType(dealType);

  const handleNewScenario = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const result = await createUWVersion(dealId, currentUserId, defaultModel, undefined, isOpportunity);
      if (result.error) {
        console.error("Create version error:", result.error);
      } else {
        router.push(`/admin/pipeline/debt/${dealId}/underwriting`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Open Editor CTA */}
      <div
        className="rounded-xl p-5 flex items-center justify-between"
        style={{
          backgroundColor: T.bg.surface,
          border: `1px solid ${T.bg.border}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${T.accent.blue}22, ${T.accent.purple}22)`,
              border: `1px solid ${T.bg.border}`,
            }}
          >
            <Calculator size={20} color={T.accent.blue} strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-[14px] font-semibold" style={{ color: T.text.primary }}>
              {UW_MODEL_LABELS[defaultModel]} Editor
            </div>
            <div className="text-[12px]" style={{ color: T.text.muted }}>
              {uwVersions.length > 0
                ? `${uwVersions.length} version${uwVersions.length !== 1 ? "s" : ""} · Last updated ${fD(uwVersions[0]?.created_at)}`
                : "No scenarios yet — create one to get started"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewScenario}
            disabled={creating}
            className="flex items-center gap-1.5 rounded-lg px-3 py-[7px] text-xs font-medium cursor-pointer transition-colors duration-150"
            style={{
              backgroundColor: T.bg.elevated,
              border: `1px solid ${T.bg.border}`,
              color: T.text.primary,
            }}
          >
            {creating ? (
              <Loader2 size={13} className="animate-spin" color={T.text.primary} />
            ) : (
              <Plus size={13} color={T.text.primary} strokeWidth={1.5} />
            )}
            New Scenario
          </button>
          <Link
            href={`/admin/pipeline/debt/${dealId}/underwriting`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-[7px] text-xs font-medium cursor-pointer transition-colors duration-150 no-underline"
            style={{
              backgroundColor: T.accent.blue,
              color: "#fff",
            }}
          >
            <ExternalLink size={13} strokeWidth={1.5} />
            Open Editor
          </Link>
        </div>
      </div>

      {/* Version History */}
      <SectionCard title="Version History" icon={Calculator}>
        <div className="flex flex-col gap-1">
          {uwVersions.length === 0 && (
            <div
              className="py-6 text-center text-[13px]"
              style={{ color: T.text.muted }}
            >
              No underwriting scenarios yet.
            </div>
          )}
          {uwVersions.map((v) => (
            <UWVersionRow
              key={v.id}
              version={v}
              isSelected={selectedVersion?.id === v.id}
              onClick={() => setSelectedVersion(v)}
            />
          ))}
        </div>
      </SectionCard>

      {/* Selected Version Summary (read-only) */}
      {selectedVersion && (
        <VersionSummary version={selectedVersion} dealType={dealType} dealId={dealId} />
      )}
    </div>
  );
}

/* ── Version Summary (read-only condensed view) ── */
function VersionSummary({
  version,
  dealType,
  dealId,
}: {
  version: UWVersion;
  dealType: string | null;
  dealId: string;
}) {
  const modelType = version.model_type || getUWModelForLoanType(dealType);
  const ModelIcon = MODEL_ICONS[modelType];
  const outputs = version.calculator_outputs || {};

  return (
    <SectionCard
      title={`v${version.version_number} — ${UW_MODEL_LABELS[modelType]}`}
      icon={ModelIcon}
      right={
        <Link
          href={`/admin/pipeline/debt/${dealId}/underwriting`}
          className="flex items-center gap-1 text-[11px] font-medium no-underline"
          style={{ color: T.accent.blue }}
        >
          <ExternalLink size={11} strokeWidth={1.5} />
          Edit
        </Link>
      }
    >
      <div className="p-1">
        {modelType === "commercial" && <CommercialSummary outputs={outputs} />}
        {modelType === "rtl" && <RTLSummary outputs={outputs} />}
        {modelType === "dscr" && <DSCRSummary outputs={outputs} />}
        {modelType === "guc" && <GUCSummary outputs={outputs} />}
        {modelType === "equity" && <EquitySummary outputs={outputs} />}
      </div>
    </SectionCard>
  );
}

/* ── Commercial Summary ── */
function CommercialSummary({ outputs }: { outputs: Record<string, unknown> }) {
  const noi = safeNum(outputs.noi);
  const dscr = safeNum(outputs.dscr);
  const capRate = safeNum(outputs.cap_rate);
  const egi = safeNum(outputs.egi);

  return (
    <div className="grid grid-cols-4 gap-2.5">
      <MiniMetric label="EGI" value={fmtNum(egi)} />
      <MiniMetric label="NOI" value={fmtNum(noi)} />
      <MiniMetric label="DSCR" value={dscr != null ? `${dscr.toFixed(2)}x` : "—"} highlight={dscr != null && dscr >= 1.0} />
      <MiniMetric label="Cap Rate" value={capRate != null ? `${capRate.toFixed(2)}%` : "—"} />
    </div>
  );
}

/* ── RTL Summary ── */
function RTLSummary({ outputs }: { outputs: Record<string, unknown> }) {
  const ltv = safeNum(outputs.ltv);
  const ltarv = safeNum(outputs.ltarv);
  const netProfit = safeNum(outputs.net_profit);
  const roi = safeNum(outputs.borrower_roi);

  return (
    <div className="grid grid-cols-4 gap-2.5">
      <MiniMetric label="LTV" value={ltv != null ? `${ltv.toFixed(1)}%` : "—"} />
      <MiniMetric label="LTARV" value={ltarv != null ? `${ltarv.toFixed(1)}%` : "—"} />
      <MiniMetric label="Net Profit" value={fmtNum(netProfit)} highlight={netProfit != null && netProfit >= 0} />
      <MiniMetric label="ROI" value={roi != null ? `${roi.toFixed(1)}%` : "—"} />
    </div>
  );
}

/* ── DSCR Summary ── */
function DSCRSummary({ outputs }: { outputs: Record<string, unknown> }) {
  const dscr = safeNum(outputs.dscr);
  const rate = safeNum(outputs.rate);
  const ltv = safeNum(outputs.ltv);
  const monthlyPi = safeNum(outputs.monthly_pi);

  return (
    <div className="grid grid-cols-4 gap-2.5">
      <MiniMetric label="DSCR" value={dscr != null ? `${dscr.toFixed(2)}x` : "—"} highlight={dscr != null && dscr >= 1.0} />
      <MiniMetric label="Rate" value={rate != null ? `${rate.toFixed(2)}%` : "—"} />
      <MiniMetric label="LTV" value={ltv != null ? `${ltv.toFixed(1)}%` : "—"} />
      <MiniMetric label="Monthly P&I" value={fmtNum(monthlyPi)} />
    </div>
  );
}

/* ── GUC Summary ── */
function GUCSummary({ outputs }: { outputs: Record<string, unknown> }) {
  const ltc = safeNum(outputs.construction_ltc);
  const irr = safeNum(outputs.projected_irr);
  const profitOnCost = safeNum(outputs.profit_on_cost);
  const yieldOnCost = safeNum(outputs.yield_on_cost);

  return (
    <div className="grid grid-cols-4 gap-2.5">
      <MiniMetric label="LTC" value={ltc != null ? `${ltc.toFixed(1)}%` : "—"} />
      <MiniMetric label="IRR" value={irr != null ? `${irr.toFixed(1)}%` : "—"} highlight={irr != null && irr >= 15} />
      <MiniMetric label="Profit/Cost" value={profitOnCost != null ? `${profitOnCost.toFixed(1)}%` : "—"} />
      <MiniMetric label="Yield/Cost" value={yieldOnCost != null ? `${yieldOnCost.toFixed(2)}%` : "—"} />
    </div>
  );
}

/* ── Equity Summary ── */
function EquitySummary({ outputs }: { outputs: Record<string, unknown> }) {
  const irr = safeNum(outputs.levered_irr);
  const multiple = safeNum(outputs.equity_multiple);
  const coc = safeNum(outputs.cash_on_cash);
  const capRate = safeNum(outputs.going_in_cap_rate);

  return (
    <div className="grid grid-cols-4 gap-2.5">
      <MiniMetric label="IRR" value={irr != null ? `${irr.toFixed(1)}%` : "—"} highlight={irr != null && irr >= 15} />
      <MiniMetric label="Multiple" value={multiple != null ? `${multiple.toFixed(2)}x` : "—"} />
      <MiniMetric label="Cash-on-Cash" value={coc != null ? `${coc.toFixed(1)}%` : "—"} />
      <MiniMetric label="Cap Rate" value={capRate != null ? `${capRate.toFixed(2)}%` : "—"} />
    </div>
  );
}

/* ── UW Version Row ── */
function UWVersionRow({
  version,
  isSelected,
  onClick,
}: {
  version: UWVersion;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [diagOpen, setDiagOpen] = useState(false);
  const modelType = version.model_type || "rtl";
  const ModelIcon = MODEL_ICONS[modelType];
  const metrics = getVersionRowMetrics(modelType, version.calculator_outputs);

  const diagnostic = useMemo(() => {
    if (modelType === "commercial") {
      return { overallStatus: analyzeCommercialStatus(version.calculator_outputs) } as {
        overallStatus: DiagnosticStatus;
        result: null;
      };
    }
    const raw = version.calculator_inputs || {};
    const parsed: UnderwritingInputs = { ...DEFAULT_INPUTS, ...raw } as UnderwritingInputs;
    const outputs = computeOutputs(parsed);
    const result = analyzeDiagnostics(parsed, outputs, modelType as "rtl" | "dscr");
    return { overallStatus: result.overallStatus, result };
  }, [version.calculator_inputs, version.calculator_outputs, modelType]);

  return (
    <Collapsible open={diagOpen} onOpenChange={setDiagOpen}>
      <div
        onClick={onClick}
        className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 cursor-pointer transition-all duration-150"
        style={{
          backgroundColor: version.is_active ? T.accent.blueMuted : isSelected ? T.bg.hover : "transparent",
          border: version.is_active ? `1px solid ${T.accent.blue}33` : "1px solid transparent",
          borderBottomLeftRadius: diagOpen ? 0 : undefined,
          borderBottomRightRadius: diagOpen ? 0 : undefined,
        }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold num"
          style={{
            backgroundColor: version.is_active ? T.accent.blue + "22" : T.bg.elevated,
            color: version.is_active ? T.accent.blue : T.text.muted,
          }}
        >
          v{version.version_number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: T.text.primary }}>
              {version._author_name || "Unknown"}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-px text-[10px] font-medium uppercase"
              style={{
                backgroundColor: T.bg.elevated,
                color: T.text.muted,
                border: `1px solid ${T.bg.borderSubtle}`,
              }}
            >
              <ModelIcon size={10} strokeWidth={1.5} />
              {UW_MODEL_LABELS[modelType]}
            </span>
            {version.status === "draft" && (
              <span
                className="rounded px-1.5 py-px text-[10px] font-medium"
                style={{ backgroundColor: T.accent.amberMuted, color: T.accent.amber }}
              >
                Draft
              </span>
            )}
            <DiagnosticDot status={diagnostic.overallStatus} onClick={(e) => { e.stopPropagation(); setDiagOpen(!diagOpen); }} />
          </div>
          <div className="text-[11px] num" style={{ color: T.text.muted }}>
            {fD(version.created_at)}
            {version.label && <span> · {version.label}</span>}
          </div>
        </div>
        <div className="flex gap-4 text-xs num" style={{ color: T.text.secondary }}>
          {metrics.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
        {version.is_active && (
          <Badge color={T.accent.green} bg={T.accent.greenMuted}>Active</Badge>
        )}
        <CollapsibleTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); setDiagOpen(!diagOpen); }}
            className="flex items-center justify-center rounded p-0.5 transition-colors hover:bg-white/5"
            title="Toggle diagnostics"
          >
            <ChevronDown
              size={14}
              color={T.text.muted}
              strokeWidth={1.5}
              className={`transition-transform duration-200 ${diagOpen ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <DiagnosticPanel diagnostic={diagnostic} modelType={modelType} />
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Diagnostic Status Dot ── */
function DiagnosticDot({ status, onClick }: { status: DiagnosticStatus; onClick: (e: React.MouseEvent) => void }) {
  const colors: Record<DiagnosticStatus, string> = {
    computed: "bg-green-500",
    incomplete: "bg-amber-500",
    empty: "bg-muted-foreground/40",
  };
  const titles: Record<DiagnosticStatus, string> = {
    computed: "All inputs populated",
    incomplete: "Some inputs missing",
    empty: "No inputs set",
  };

  return (
    <button
      onClick={onClick}
      className={`h-2 w-2 rounded-full shrink-0 ${colors[status]} cursor-pointer`}
      title={titles[status]}
    />
  );
}

/* ── Diagnostic Expansion Panel ── */
function DiagnosticPanel({
  diagnostic,
  modelType,
}: {
  diagnostic: { overallStatus: DiagnosticStatus; result?: DiagnosticResult | null };
  modelType: UWModelType;
}) {
  const result = diagnostic.result;

  if (!result) {
    // Commercial — simplified status
    return (
      <div
        className="rounded-b-lg px-4 py-3 text-[12px]"
        style={{ backgroundColor: T.bg.elevated, borderTop: `1px solid ${T.bg.borderSubtle}` }}
      >
        <span style={{ color: T.text.muted }}>
          {diagnostic.overallStatus === "computed"
            ? "Commercial model has computed outputs."
            : diagnostic.overallStatus === "incomplete"
              ? "Commercial model has partial outputs."
              : "Commercial model has no outputs yet."}
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-b-lg px-4 py-3 space-y-2.5"
      style={{ backgroundColor: T.bg.elevated, borderTop: `1px solid ${T.bg.borderSubtle}` }}
    >
      {/* Input summary */}
      <div className="flex items-center gap-2 text-[12px]" style={{ color: T.text.secondary }}>
        <span className="font-medium" style={{ color: T.text.primary }}>
          {result.inputSummary.populated} of {result.inputSummary.total}
        </span>
        <span>required inputs populated</span>
      </div>

      {/* Per-metric breakdown */}
      <div className="grid grid-cols-1 gap-1">
        {result.metrics.map((m) => {
          const missingDeps = m.requiredInputs.filter((r) => !r.present);
          return (
            <div key={m.key} className="flex items-start gap-2 text-[11px] py-0.5">
              {m.status === "computed" ? (
                <Check size={12} className="text-green-500 mt-px shrink-0" strokeWidth={2} />
              ) : m.status === "incomplete" ? (
                <AlertTriangle size={12} className="text-amber-500 mt-px shrink-0" strokeWidth={2} />
              ) : (
                <Minus size={12} className="text-muted-foreground/50 mt-px shrink-0" strokeWidth={2} />
              )}
              <span className="font-medium" style={{ color: T.text.primary }}>{m.label}</span>
              {m.status === "computed" && m.value != null && (
                <span className="num" style={{ color: T.text.secondary }}>
                  {typeof m.value === "number" ? m.value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : m.value}
                </span>
              )}
              {missingDeps.length > 0 && (
                <span style={{ color: T.text.muted }}>
                  needs: {missingDeps.map((d) => d.label).join(", ")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getVersionRowMetrics(modelType: UWModelType, outputs: Record<string, unknown>): string[] {
  const metrics: string[] = [];
  if (modelType === "commercial") {
    const noi = safeNum(outputs.noi);
    const dscr = safeNum(outputs.dscr);
    if (noi != null) metrics.push(`NOI ${fmtNum(noi)}`);
    if (dscr != null) metrics.push(`DSCR ${dscr.toFixed(2)}`);
  } else if (modelType === "dscr") {
    const rate = safeNum(outputs.rate);
    const dscr = safeNum(outputs.dscr);
    if (rate != null) metrics.push(`${rate.toFixed(2)}%`);
    if (dscr != null) metrics.push(`DSCR ${dscr.toFixed(2)}`);
  } else if (modelType === "guc") {
    const ltc = safeNum(outputs.construction_ltc);
    const irr = safeNum(outputs.projected_irr);
    if (ltc != null) metrics.push(`LTC ${ltc.toFixed(0)}%`);
    if (irr != null) metrics.push(`IRR ${irr.toFixed(1)}%`);
  } else if (modelType === "equity") {
    const irr = safeNum(outputs.levered_irr);
    const multiple = safeNum(outputs.equity_multiple);
    if (irr != null) metrics.push(`IRR ${irr.toFixed(1)}%`);
    if (multiple != null) metrics.push(`${multiple.toFixed(2)}x`);
  } else {
    const ltv = safeNum(outputs.ltv);
    const roi = safeNum(outputs.borrower_roi);
    if (ltv != null) metrics.push(`LTV ${ltv.toFixed(0)}%`);
    if (roi != null) metrics.push(`ROI ${roi.toFixed(1)}%`);
  }
  return metrics;
}

/* ── Mini Metric ── */
function MiniMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{
        backgroundColor: T.bg.elevated,
        border: `1px solid ${highlight ? T.accent.green + "33" : T.bg.borderSubtle}`,
      }}
    >
      <div
        className="text-[10px] uppercase tracking-wider mb-1"
        style={{ color: T.text.muted }}
      >
        {label}
      </div>
      <div
        className="text-base font-semibold num"
        style={{ color: highlight ? T.accent.green : T.text.primary }}
      >
        {value}
      </div>
    </div>
  );
}

function safeNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function fmtNum(n: unknown): string {
  const v = safeNum(n);
  if (v == null) return "—";
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
