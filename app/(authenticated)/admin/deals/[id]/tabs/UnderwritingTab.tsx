"use client";

import { useState } from "react";
import { Calculator, Plus, Eye, Zap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  T,
  SectionCard,
  Badge,
  fD,
  type UWVersion,
} from "../components";
import { createUWVersion } from "../actions";

interface UnderwritingTabProps {
  dealId: string;
  dealType: string | null;
  uwVersions: UWVersion[];
  currentUserId: string;
  currentUserName: string;
}

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

  const handleNewScenario = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const result = await createUWVersion(dealId, currentUserId);
      if (result.error) {
        console.error("Create version error:", result.error);
      } else {
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  };

  // Extract outputs from selected version
  const outputs = selectedVersion?.calculator_outputs || {};
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

      {/* Active Scenario Detail */}
      {selectedVersion && (
        <SectionCard
          title={`v${selectedVersion.version_number} — ${dealType === "dscr" ? "DSCR Calculator" : dealType === "commercial" ? "Commercial UW" : "Underwriting"}`}
          icon={Zap}
        >
          <div className="p-2">
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
                  Calculated DSCR
                </div>
                <div
                  className="text-[28px] font-bold num"
                  style={{ color: dscr != null && dscr >= 1.0 ? T.accent.green : T.accent.red }}
                >
                  {dscr != null ? `${dscr.toFixed(2)}x` : "\u2014"}
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-right">
                  <div className="text-[10px] uppercase mb-0.5" style={{ color: T.text.muted }}>
                    Monthly P&I
                  </div>
                  <div className="text-[15px] font-semibold num" style={{ color: T.text.primary }}>
                    {fmtNum(monthlyPi)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase mb-0.5" style={{ color: T.text.muted }}>
                    NOI
                  </div>
                  <div className="text-[15px] font-semibold num" style={{ color: T.text.primary }}>
                    {fmtNum(noi)}
                  </div>
                </div>
                {rate != null && (
                  <div className="text-right">
                    <div className="text-[10px] uppercase mb-0.5" style={{ color: T.text.muted }}>
                      Rate
                    </div>
                    <div className="text-[15px] font-semibold num" style={{ color: T.text.primary }}>
                      {rate.toFixed(2)}%
                    </div>
                  </div>
                )}
                {ltv != null && (
                  <div className="text-right">
                    <div className="text-[10px] uppercase mb-0.5" style={{ color: T.text.muted }}>
                      LTV
                    </div>
                    <div className="text-[15px] font-semibold num" style={{ color: T.text.primary }}>
                      {ltv.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>
      )}
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
  const rate = outputs.rate as number | undefined;
  const dscr = outputs.dscr as number | undefined;
  const ltv = outputs.ltv as number | undefined;

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
        <div className="text-[13px] font-medium" style={{ color: T.text.primary }}>
          {version._author_name || "Unknown"}
        </div>
        <div className="text-[11px] num" style={{ color: T.text.muted }}>
          {fD(version.created_at)}
        </div>
      </div>
      <div className="flex gap-4 text-xs num" style={{ color: T.text.secondary }}>
        {rate != null && <span>{rate.toFixed(2)}%</span>}
        {dscr != null && <span>DSCR {dscr.toFixed(2)}</span>}
        {ltv != null && <span>LTV {ltv.toFixed(0)}%</span>}
      </div>
      {version.is_active && (
        <Badge color={T.accent.green} bg={T.accent.greenMuted}>Active</Badge>
      )}
      <Eye size={14} color={T.text.muted} strokeWidth={1.5} />
    </div>
  );
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
  if (n == null) return "\u2014";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
