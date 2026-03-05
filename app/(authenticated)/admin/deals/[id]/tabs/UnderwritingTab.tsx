"use client";

import { useState } from "react";
import {
  Calculator,
  Plus,
  Eye,
  Loader2,
  Building2,
  Home,
  TrendingUp,
  ExternalLink,
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
        router.push(`/admin/deals/${dealId}/underwriting`);
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
            href={`/admin/deals/${dealId}/underwriting`}
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
          href={`/admin/deals/${dealId}/underwriting`}
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
      </div>
    </SectionCard>
  );
}

/* ── Commercial Summary ── */
function CommercialSummary({ outputs }: { outputs: Record<string, unknown> }) {
  const noi = outputs.noi as number | undefined;
  const dscr = outputs.dscr as number | undefined;
  const capRate = outputs.cap_rate as number | undefined;
  const egi = outputs.egi as number | undefined;

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
  const ltv = outputs.ltv as number | undefined;
  const ltarv = outputs.ltarv as number | undefined;
  const netProfit = outputs.net_profit as number | undefined;
  const roi = outputs.borrower_roi as number | undefined;

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
  const dscr = outputs.dscr as number | undefined;
  const rate = outputs.rate as number | undefined;
  const ltv = outputs.ltv as number | undefined;
  const monthlyPi = outputs.monthly_pi as number | undefined;

  return (
    <div className="grid grid-cols-4 gap-2.5">
      <MiniMetric label="DSCR" value={dscr != null ? `${dscr.toFixed(2)}x` : "—"} highlight={dscr != null && dscr >= 1.0} />
      <MiniMetric label="Rate" value={rate != null ? `${rate.toFixed(2)}%` : "—"} />
      <MiniMetric label="LTV" value={ltv != null ? `${ltv.toFixed(1)}%` : "—"} />
      <MiniMetric label="Monthly P&I" value={fmtNum(monthlyPi)} />
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
  const modelType = version.model_type || "rtl";
  const ModelIcon = MODEL_ICONS[modelType];
  const metrics = getVersionRowMetrics(modelType, version.calculator_outputs);

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 cursor-pointer transition-all duration-150"
      style={{
        backgroundColor: version.is_active ? T.accent.blueMuted : isSelected ? T.bg.hover : "transparent",
        border: version.is_active ? `1px solid ${T.accent.blue}33` : "1px solid transparent",
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
      <Eye size={14} color={T.text.muted} strokeWidth={1.5} />
    </div>
  );
}

function getVersionRowMetrics(modelType: UWModelType, outputs: Record<string, unknown>): string[] {
  const metrics: string[] = [];
  if (modelType === "commercial") {
    const noi = outputs.noi as number | undefined;
    const dscr = outputs.dscr as number | undefined;
    if (noi != null) metrics.push(`NOI ${fmtNum(noi)}`);
    if (dscr != null) metrics.push(`DSCR ${dscr.toFixed(2)}`);
  } else if (modelType === "dscr") {
    const rate = outputs.rate as number | undefined;
    const dscr = outputs.dscr as number | undefined;
    if (rate != null) metrics.push(`${rate.toFixed(2)}%`);
    if (dscr != null) metrics.push(`DSCR ${dscr.toFixed(2)}`);
  } else {
    const ltv = outputs.ltv as number | undefined;
    const roi = outputs.borrower_roi as number | undefined;
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

function fmtNum(n: number | undefined | null): string {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
