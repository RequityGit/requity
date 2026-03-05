"use client";

import { useState } from "react";
import { Calculator, Plus, Eye, Zap, Loader2, Building2, Home, TrendingUp } from "lucide-react";
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
      const result = await createUWVersion(dealId, currentUserId, defaultModel);
      if (result.error) {
        console.error("Create version error:", result.error);
      } else {
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* UW Versions */}
      <SectionCard
        title="Underwriting Scenarios"
        icon={Calculator}
        right={
          <button
            onClick={handleNewScenario}
            disabled={creating}
            className="flex items-center gap-1.5 rounded-lg px-3 py-[5px] text-xs font-medium cursor-pointer transition-colors duration-150"
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
        }
      >
        <div className="flex flex-col gap-1">
          {uwVersions.length === 0 && (
            <div
              className="py-8 text-center text-[13px]"
              style={{ color: T.text.muted }}
            >
              No underwriting scenarios yet. Create one to get started.
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

      {/* Active Scenario Detail — renders based on model type */}
      {selectedVersion && (
        <VersionDetail
          version={selectedVersion}
          dealId={dealId}
          dealType={dealType}
        />
      )}
    </div>
  );
}

/* ── Version Detail Router ── */
function VersionDetail({
  version,
  dealId,
  dealType,
}: {
  version: UWVersion;
  dealId: string;
  dealType: string | null;
}) {
  const modelType = version.model_type || getUWModelForLoanType(dealType);
  const ModelIcon = MODEL_ICONS[modelType];
  const label = `v${version.version_number} — ${UW_MODEL_LABELS[modelType]}`;

  return (
    <SectionCard title={label} icon={ModelIcon}>
      <div className="p-2">
        {modelType === "commercial" && (
          <CommercialUWDetail version={version} dealId={dealId} />
        )}
        {modelType === "rtl" && (
          <RTLUWDetail version={version} />
        )}
        {modelType === "dscr" && (
          <DSCRUWDetail version={version} />
        )}
      </div>
    </SectionCard>
  );
}

/* ── Commercial UW Detail ── */
function CommercialUWDetail({
  version,
  dealId,
}: {
  version: UWVersion;
  dealId: string;
}) {
  const outputs = version.calculator_outputs || {};
  const noi = outputs.noi as number | undefined;
  const dscr = outputs.dscr as number | undefined;
  const capRate = outputs.cap_rate as number | undefined;
  const egi = outputs.egi as number | undefined;
  const totalOpex = outputs.total_opex as number | undefined;
  const debtService = outputs.debt_service as number | undefined;
  const netCashFlow = outputs.net_cash_flow as number | undefined;
  const expenseRatio = outputs.expense_ratio as number | undefined;

  return (
    <>
      {/* Income & Expenses Summary */}
      <div className="mb-5">
        <div
          className="text-[11px] font-semibold uppercase tracking-wider mb-2.5"
          style={{ color: T.text.muted }}
        >
          Operating Summary
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          <MiniMetric label="Eff. Gross Income" value={fmtNum(egi)} />
          <MiniMetric label="Total OpEx" value={fmtNum(totalOpex)} />
          <MiniMetric label="NOI" value={fmtNum(noi)} />
          <MiniMetric label="Expense Ratio" value={expenseRatio != null ? `${expenseRatio.toFixed(1)}%` : "—"} />
        </div>
      </div>

      {/* Debt Service */}
      <div className="mb-5">
        <div
          className="text-[11px] font-semibold uppercase tracking-wider mb-2.5"
          style={{ color: T.text.muted }}
        >
          Debt Service
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <MiniMetric label="Annual Debt Service" value={fmtNum(debtService)} />
          <MiniMetric label="Net Cash Flow" value={fmtNum(netCashFlow)} />
          <MiniMetric label="Cap Rate" value={capRate != null ? `${capRate.toFixed(2)}%` : "—"} />
        </div>
      </div>

      {/* Result */}
      <ResultBanner
        mainLabel="DSCR"
        mainValue={dscr != null ? `${dscr.toFixed(2)}x` : "—"}
        mainColor={dscr != null && dscr >= 1.0 ? T.accent.green : T.accent.red}
        extras={[
          { label: "NOI", value: fmtNum(noi) },
          { label: "Cap Rate", value: capRate != null ? `${capRate.toFixed(2)}%` : "—" },
        ]}
      />

      {/* Link to full commercial UW */}
      <div className="mt-4 text-center">
        <Link
          href={`/admin/loans/${dealId}/commercial-uw`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium no-underline hover:underline"
          style={{ color: T.accent.blue }}
        >
          <Building2 size={13} strokeWidth={1.5} />
          Open Full Commercial Underwriting
        </Link>
      </div>
    </>
  );
}

/* ── RTL / Fix & Flip UW Detail ── */
function RTLUWDetail({ version }: { version: UWVersion }) {
  const outputs = version.calculator_outputs || {};
  const ltv = outputs.ltv as number | undefined;
  const ltarv = outputs.ltarv as number | undefined;
  const ltc = outputs.ltc as number | undefined;
  const monthlyPayment = outputs.monthly_payment as number | undefined;
  const totalInterest = outputs.total_interest as number | undefined;
  const originationFee = outputs.origination_fee as number | undefined;
  const totalClosingCosts = outputs.total_closing_costs as number | undefined;
  const totalCashToClose = outputs.total_cash_to_close as number | undefined;
  const totalHoldingCosts = outputs.total_holding_costs as number | undefined;
  const netProfit = outputs.net_profit as number | undefined;
  const borrowerRoi = outputs.borrower_roi as number | undefined;
  const annualizedRoi = outputs.annualized_roi as number | undefined;
  const netYield = outputs.net_yield as number | undefined;
  const totalProjectCost = outputs.total_project_cost as number | undefined;

  const inputs = version.calculator_inputs || {};
  const purchasePrice = inputs.purchase_price as number | undefined;
  const rehabBudget = inputs.rehab_budget as number | undefined;
  const arv = inputs.after_repair_value as number | undefined;

  return (
    <>
      {/* Deal Structure */}
      <div className="mb-5">
        <div
          className="text-[11px] font-semibold uppercase tracking-wider mb-2.5"
          style={{ color: T.text.muted }}
        >
          Deal Structure
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          <MiniMetric label="Purchase Price" value={fmtNum(purchasePrice)} />
          <MiniMetric label="Rehab Budget" value={fmtNum(rehabBudget)} />
          <MiniMetric label="ARV" value={fmtNum(arv)} />
          <MiniMetric label="Total Project Cost" value={fmtNum(totalProjectCost)} />
        </div>
      </div>

      {/* Costs & Fees */}
      <div className="mb-5">
        <div
          className="text-[11px] font-semibold uppercase tracking-wider mb-2.5"
          style={{ color: T.text.muted }}
        >
          Costs & Fees
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          <MiniMetric label="Monthly Payment" value={fmtNum(monthlyPayment)} />
          <MiniMetric label="Total Interest" value={fmtNum(totalInterest)} />
          <MiniMetric label="Origination Fee" value={fmtNum(originationFee)} />
          <MiniMetric label="Total Closing" value={fmtNum(totalClosingCosts)} />
        </div>
      </div>

      {/* Holding & Cash */}
      <div className="mb-5">
        <div
          className="text-[11px] font-semibold uppercase tracking-wider mb-2.5"
          style={{ color: T.text.muted }}
        >
          Cash Requirements
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <MiniMetric label="Cash to Close" value={fmtNum(totalCashToClose)} />
          <MiniMetric label="Total Holding Costs" value={fmtNum(totalHoldingCosts)} />
          <MiniMetric label="Net Yield" value={netYield != null ? `${netYield.toFixed(2)}%` : "—"} />
        </div>
      </div>

      {/* Result */}
      <ResultBanner
        mainLabel="Net Profit"
        mainValue={fmtNum(netProfit)}
        mainColor={netProfit != null && netProfit >= 0 ? T.accent.green : T.accent.red}
        extras={[
          { label: "LTV", value: ltv != null ? `${ltv.toFixed(1)}%` : "—" },
          { label: "LTARV", value: ltarv != null ? `${ltarv.toFixed(1)}%` : "—" },
          { label: "LTC", value: ltc != null ? `${ltc.toFixed(1)}%` : "—" },
          { label: "ROI", value: borrowerRoi != null ? `${borrowerRoi.toFixed(1)}%` : "—" },
          { label: "Ann. ROI", value: annualizedRoi != null ? `${annualizedRoi.toFixed(1)}%` : "—" },
        ]}
      />
    </>
  );
}

/* ── DSCR UW Detail ── */
function DSCRUWDetail({ version }: { version: UWVersion }) {
  const outputs = version.calculator_outputs || {};
  const rate = outputs.rate as number | undefined;
  const dscr = outputs.dscr as number | undefined;
  const ltv = outputs.ltv as number | undefined;
  const monthlyPi = outputs.monthly_pi as number | undefined;
  const noi = outputs.noi as number | undefined;
  const monthlyRent = outputs.monthly_rent as number | undefined;
  const otherIncome = outputs.other_income as number | undefined;
  const grossIncome = outputs.gross_income as number | undefined;
  const taxes = outputs.taxes as number | undefined;
  const insurance = outputs.insurance as number | undefined;
  const hoa = outputs.hoa as number | undefined;
  const totalPitia = outputs.total_pitia as number | undefined;

  return (
    <>
      {/* Revenue */}
      <div className="mb-5">
        <div
          className="text-[11px] font-semibold uppercase tracking-wider mb-2.5"
          style={{ color: T.text.muted }}
        >
          Revenue
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <MiniMetric label="Monthly Rent" value={fmtNum(monthlyRent)} />
          <MiniMetric label="Other Income" value={fmtNum(otherIncome)} />
          <MiniMetric label="Gross Income" value={fmtNum(grossIncome)} />
        </div>
      </div>

      {/* Expenses */}
      <div className="mb-5">
        <div
          className="text-[11px] font-semibold uppercase tracking-wider mb-2.5"
          style={{ color: T.text.muted }}
        >
          Expenses
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          <MiniMetric label="Taxes" value={fmtNum(taxes)} />
          <MiniMetric label="Insurance" value={fmtNum(insurance)} />
          <MiniMetric label="HOA" value={fmtNum(hoa)} />
          <MiniMetric label="Total PITIA" value={fmtNum(totalPitia)} />
        </div>
      </div>

      {/* Result */}
      <ResultBanner
        mainLabel="Calculated DSCR"
        mainValue={dscr != null ? `${dscr.toFixed(2)}x` : "—"}
        mainColor={dscr != null && dscr >= 1.0 ? T.accent.green : T.accent.red}
        extras={[
          { label: "Monthly P&I", value: fmtNum(monthlyPi) },
          { label: "NOI", value: fmtNum(noi) },
          ...(rate != null ? [{ label: "Rate", value: `${rate.toFixed(2)}%` }] : []),
          ...(ltv != null ? [{ label: "LTV", value: `${ltv.toFixed(1)}%` }] : []),
        ]}
      />
    </>
  );
}

/* ── Result Banner ── */
function ResultBanner({
  mainLabel,
  mainValue,
  mainColor,
  extras,
}: {
  mainLabel: string;
  mainValue: string;
  mainColor: string;
  extras: { label: string; value: string }[];
}) {
  return (
    <div
      className="flex items-center justify-between rounded-[10px] px-5 py-4"
      style={{
        background: `linear-gradient(135deg, ${T.accent.green}12, ${T.accent.blue}08)`,
        border: `1px solid ${T.accent.green}33`,
      }}
    >
      <div>
        <div
          className="text-[11px] uppercase tracking-wider mb-0.5"
          style={{ color: T.text.muted }}
        >
          {mainLabel}
        </div>
        <div
          className="text-[28px] font-bold num"
          style={{ color: mainColor }}
        >
          {mainValue}
        </div>
      </div>
      <div className="flex gap-6">
        {extras.map((e) => (
          <div key={e.label} className="text-right">
            <div className="text-[10px] uppercase mb-0.5" style={{ color: T.text.muted }}>
              {e.label}
            </div>
            <div className="text-[15px] font-semibold num" style={{ color: T.text.primary }}>
              {e.value}
            </div>
          </div>
        ))}
      </div>
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
  const outputs = version.calculator_outputs || {};
  const modelType = version.model_type || "rtl";
  const ModelIcon = MODEL_ICONS[modelType];

  // Show relevant metrics based on model type
  const metrics = getVersionRowMetrics(modelType, outputs);

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
        </div>
        <div className="text-[11px] num" style={{ color: T.text.muted }}>
          {fD(version.created_at)}
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
    const capRate = outputs.cap_rate as number | undefined;
    if (noi != null) metrics.push(`NOI ${fmtNum(noi)}`);
    if (dscr != null) metrics.push(`DSCR ${dscr.toFixed(2)}`);
    if (capRate != null) metrics.push(`Cap ${capRate.toFixed(2)}%`);
  } else if (modelType === "dscr") {
    const rate = outputs.rate as number | undefined;
    const dscr = outputs.dscr as number | undefined;
    const ltv = outputs.ltv as number | undefined;
    if (rate != null) metrics.push(`${rate.toFixed(2)}%`);
    if (dscr != null) metrics.push(`DSCR ${dscr.toFixed(2)}`);
    if (ltv != null) metrics.push(`LTV ${(ltv as number).toFixed(0)}%`);
  } else {
    // RTL / Fix & Flip
    const ltv = outputs.ltv as number | undefined;
    const ltarv = outputs.ltarv as number | undefined;
    const roi = outputs.borrower_roi as number | undefined;
    if (ltv != null) metrics.push(`LTV ${ltv.toFixed(0)}%`);
    if (ltarv != null) metrics.push(`LTARV ${ltarv.toFixed(0)}%`);
    if (roi != null) metrics.push(`ROI ${roi.toFixed(1)}%`);
  }

  return metrics;
}

/* ── Mini Metric ── */
function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{
        backgroundColor: T.bg.elevated,
        border: `1px solid ${T.bg.borderSubtle}`,
      }}
    >
      <div
        className="text-[10px] uppercase tracking-wider mb-1"
        style={{ color: T.text.muted }}
      >
        {label}
      </div>
      <div className="text-base font-semibold num" style={{ color: T.text.primary }}>
        {value}
      </div>
    </div>
  );
}

function fmtNum(n: number | undefined | null): string {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
