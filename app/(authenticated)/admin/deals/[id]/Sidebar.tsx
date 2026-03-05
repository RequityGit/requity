"use client";

import { useState } from "react";
import {
  Zap,
  ArrowUpRight,
  FileText,
  Phone,
  Mail,
  Shield,
  Calendar,
  Users,
  CalendarDays,
  Plus,
  Loader2,
} from "lucide-react";
import {
  T,
  SectionCard,
  Av,
  fD,
  type DealData,
  type PipelineStage,
} from "./components";
import { advanceStage } from "./actions";
import { EditableDateRow } from "./EditableField";
import { useRouter } from "next/navigation";

interface SidebarProps {
  deal: DealData;
  stages: PipelineStage[];
  currentUserId: string;
  currentUserName: string;
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
}

export function Sidebar({ deal, stages, currentUserId, currentUserName, onSave }: SidebarProps) {
  const router = useRouter();
  const [advancing, setAdvancing] = useState(false);

  const team = [
    { r: "Originator", m: deal._originator, color: "#7c3aed" },
    { r: "Processor", m: deal._processor, color: "#2563eb" },
    { r: "Underwriter", m: deal._underwriter, color: "#f59e0b" },
    { r: "Closer", m: deal._closer, color: "#22c55e" },
  ];

  const dates: { l: string; field: string; d: string | null | undefined }[] = [
    { l: "Created", field: "", d: deal.created_at },
    { l: "Last Updated", field: "", d: deal.updated_at },
    { l: "Est. Close", field: "expected_close_date", d: deal.expected_close_date },
    { l: "Application", field: "application_date", d: deal.application_date },
    { l: "Approval", field: "approval_date", d: deal.approval_date },
    { l: "Funding", field: "funding_date", d: deal.funding_date },
    { l: "Maturity", field: "maturity_date", d: deal.maturity_date },
  ];

  // Find next stage
  const nonTerminal = stages.filter((s) => !s.is_terminal);
  const currentIdx = nonTerminal.findIndex((s) => s.stage_key === deal.stage);
  const nextStage = currentIdx >= 0 && currentIdx < nonTerminal.length - 1
    ? nonTerminal[currentIdx + 1]
    : null;

  const handleAdvanceStage = async () => {
    if (!nextStage || advancing) return;
    setAdvancing(true);
    try {
      const result = await advanceStage(deal.id, deal.stage, nextStage.stage_key, currentUserId, currentUserName);
      if (result.error) {
        console.error("Advance stage error:", result.error);
      } else {
        router.refresh();
      }
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="flex w-[300px] shrink-0 flex-col gap-4 sticky top-5">
      {/* Quick Actions */}
      <SectionCard title="Quick Actions" icon={Zap}>
        <div className="flex flex-col gap-0.5">
          {nextStage && (
            <QuickAction
              icon={ArrowUpRight}
              label={`Advance to ${nextStage.label}`}
              accent={T.accent.blue}
              onClick={handleAdvanceStage}
              loading={advancing}
            />
          )}
          <QuickAction icon={FileText} label="Term Sheet" />
          <QuickAction icon={Phone} label="Log Call" />
          <QuickAction icon={Mail} label="Send Email" />
          <QuickAction icon={Shield} label="Request Approval" accent={T.accent.amber} />
          <QuickAction icon={Calendar} label="Schedule Closing" />
        </div>
      </SectionCard>

      {/* Team */}
      <SectionCard title="Team" icon={Users}>
        <div className="flex flex-col gap-2.5">
          {team.map((t) => (
            <div key={t.r} className="flex items-center gap-2.5">
              {t.m ? (
                <Av text={t.m.initials} size={28} color={t.color} />
              ) : (
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{
                    border: `1.5px dashed ${T.bg.border}`,
                  }}
                >
                  <Plus size={12} color={T.text.muted} strokeWidth={1.5} />
                </div>
              )}
              <div>
                <div
                  className="text-xs font-medium"
                  style={{
                    color: t.m ? T.text.primary : T.text.muted,
                    fontStyle: t.m ? "normal" : "italic",
                  }}
                >
                  {t.m ? t.m.full_name : "Unassigned"}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: T.text.muted }}
                >
                  {t.r}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Key Dates */}
      <SectionCard title="Key Dates" icon={CalendarDays}>
        <div className="flex flex-col">
          {dates.map((d) =>
            d.field ? (
              <EditableDateRow
                key={d.l}
                label={d.l}
                field={d.field}
                value={d.d}
                displayValue={fD(d.d)}
                onSave={onSave}
              />
            ) : (
              <div
                key={d.l}
                className="flex justify-between py-1.5"
                style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}
              >
                <span className="text-xs" style={{ color: T.text.muted }}>
                  {d.l}
                </span>
                <span className="text-xs num" style={{ color: d.d ? T.text.primary : T.text.muted }}>
                  {fD(d.d)}
                </span>
              </div>
            )
          )}
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Quick Action Button ── */
function QuickAction({
  icon: Ic,
  label,
  accent,
  onClick,
  loading,
}: {
  icon: typeof ArrowUpRight;
  label: string;
  accent?: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center gap-2.5 rounded-lg border-none px-2.5 py-2 text-left text-[13px] font-medium cursor-pointer transition-colors duration-150"
      style={{
        backgroundColor: "transparent",
        color: accent || T.text.secondary,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = T.bg.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" color={accent || T.text.muted} />
      ) : (
        <Ic size={15} color={accent || T.text.muted} strokeWidth={1.5} />
      )}
      {label}
    </button>
  );
}
