"use client";

import {
  Zap,
  ArrowRight,
  FileText,
  Phone,
  Mail,
  Shield,
  Calendar,
  Users,
  Timer,
  CalendarDays,
  ExternalLink,
  Hash,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import {
  SectionCard,
  DotPill,
  Av,
  Btn,
  cap,
  fD,
  dBetween,
  STAGES,
  APPROVAL_COLORS,
  type DealData,
  type StageHistoryEntry,
} from "./components";
import { EditableDateRow } from "./EditableField";

interface SidebarProps {
  deal: DealData;
  stageHistory: StageHistoryEntry[];
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
}

export function Sidebar({ deal, stageHistory, onSave }: SidebarProps) {
  const team = [
    { r: "Originator", m: deal._originator },
    { r: "Processor", m: deal._processor },
    { r: "Underwriter", m: deal._underwriter },
    { r: "Closer", m: deal._closer },
  ];

  const dates: { l: string; field: string; d: string | null | undefined }[] = [
    { l: "Application", field: "application_date", d: deal.application_date },
    { l: "Expected Close", field: "expected_close_date", d: deal.expected_close_date },
    { l: "Approval", field: "approval_date", d: deal.approval_date },
    { l: "Clear to Close", field: "ctc_date", d: deal.ctc_date },
    { l: "Closing", field: "closing_date", d: deal.closing_date },
    { l: "Funding", field: "funding_date", d: deal.funding_date },
    { l: "First Payment", field: "first_payment_date", d: deal.first_payment_date },
    { l: "Maturity", field: "maturity_date", d: deal.maturity_date },
  ];

  // Build velocity data from stage history
  const velocityData = buildVelocityData(stageHistory, deal.stage);

  return (
    <div className="flex w-[272px] shrink-0 flex-col gap-3">
      {/* Quick Actions */}
      <SectionCard title="Quick Actions" icon={Zap}>
        <div className="flex flex-col gap-0.5">
          {[
            { l: "Advance Stage", i: ArrowRight },
            { l: "Term Sheet", i: FileText },
            { l: "Log Call", i: Phone },
            { l: "Send Email", i: Mail },
            { l: "Request Approval", i: Shield },
            { l: "Schedule Closing", i: Calendar },
          ].map((a) => (
            <button
              key={a.l}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none bg-transparent px-3 py-2 text-left text-[13px] text-[#1A1A1A] hover:bg-[#F7F7F8] font-sans"
            >
              <a.i size={14} className="text-[#6B6B6B]" />
              {a.l}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Team */}
      <SectionCard title="Team" icon={Users}>
        <div className="flex flex-col gap-2.5">
          {team.map((t) => (
            <div key={t.r} className="flex items-center gap-2.5">
              {t.m ? (
                <Av text={t.m.initials} size={28} />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-[7px] border-[1.5px] border-dashed border-[#E5E5E7]">
                  <Plus size={12} className="text-[#8B8B8B]" />
                </div>
              )}
              <div>
                <div className="text-[11px] text-[#8B8B8B] font-sans">
                  {t.r}
                </div>
                <div
                  className="text-[13px] font-medium font-sans"
                  style={{
                    color: t.m ? "#1A1A1A" : "#8B8B8B",
                    fontStyle: t.m ? "normal" : "italic",
                  }}
                >
                  {t.m ? t.m.full_name : "Unassigned"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Stage Velocity */}
      <SectionCard title="Stage Velocity" icon={Timer}>
        <div className="flex flex-col gap-2">
          {velocityData.map((v) => {
            const cfg = STAGES.find((s) => s.k === v.stage);
            const isWarn =
              cfg && cfg.w > 0 && v.days >= cfg.w && v.days < cfg.a;
            const isAlert = cfg && cfg.a > 0 && v.days >= cfg.a;
            const barColor = isAlert
              ? "#E5453D"
              : isWarn
                ? "#E5930E"
                : cfg
                  ? cfg.c
                  : "#8B8B8B";
            const maxDays = Math.max(
              ...velocityData.map((x) => x.days),
              1
            );

            return (
              <div key={v.stage}>
                <div className="mb-0.5 flex justify-between">
                  <span
                    className="text-xs font-sans"
                    style={{
                      fontWeight: v.isCurrent ? 600 : 400,
                      color: v.isCurrent ? "#1A1A1A" : "#6B6B6B",
                    }}
                  >
                    {cap(v.stage)}
                  </span>
                  <span
                    className="text-[11px] num"
                    style={{
                      color: barColor,
                      fontWeight: v.isCurrent ? 600 : 400,
                    }}
                  >
                    {v.days}d
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-sm bg-[#F0F0F2]">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${(v.days / maxDays) * 100}%`,
                      background: barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
          {velocityData.length === 0 && (
            <div className="text-xs text-[#8B8B8B] font-sans">
              No stage history available.
            </div>
          )}
        </div>
      </SectionCard>

      {/* Approval */}
      <SectionCard title="Approval" icon={Shield}>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs text-[#8B8B8B] font-sans">Status</span>
          <DotPill
            label={cap(deal.approval_status || "not_submitted")}
            color={
              APPROVAL_COLORS[deal.approval_status || "not_submitted"] ||
              "#8B8B8B"
            }
          />
        </div>
        <Btn label="Submit for Approval" icon={Shield} primary small />
      </SectionCard>

      {/* Key Dates */}
      <SectionCard title="Key Dates" icon={CalendarDays}>
        <div className="flex flex-col">
          {dates.map((d) => (
            <EditableDateRow
              key={d.l}
              label={d.l}
              field={d.field}
              value={d.d}
              displayValue={fD(d.d)}
              onSave={onSave}
            />
          ))}
        </div>
      </SectionCard>

      {/* Related Records */}
      <SectionCard title="Related" icon={ExternalLink}>
        <div className="flex flex-col gap-1">
          {[
            { l: "Borrower", v: deal._borrower_name, href: deal.borrower_id ? `/admin/borrowers/${deal.borrower_id}` : null },
            { l: "Entity", v: deal._entity_name, href: deal.borrower_entity_id ? `/admin/entities/${deal.borrower_entity_id}` : null },
            { l: "Opportunity", v: deal.opportunity_id, href: deal.opportunity_id ? `/admin/deals/${deal.opportunity_id}` : null },
          ].map((r) => (
            <div
              key={r.l}
              className="flex justify-between border-b border-[#F0F0F2] py-1.5"
            >
              <span className="text-xs text-[#8B8B8B] font-sans">
                {r.l}
              </span>
              {r.v ? (
                <span className="cursor-pointer text-xs font-medium text-[#3B82F6] font-sans">
                  {r.v}{" "}
                  <ArrowUpRight
                    size={10}
                    className="inline-block"
                    style={{ verticalAlign: -1 }}
                  />
                </span>
              ) : (
                <span className="text-xs text-[#8B8B8B] font-sans">
                  {"\u2014"}
                </span>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* System */}
      <SectionCard title="System" icon={Hash}>
        <div className="flex flex-col gap-1">
          {[
            { l: "Loan ID", v: deal.id },
            { l: "Opp ID", v: deal.opportunity_id },
            { l: "SF ID", v: deal.sf_id },
            { l: "Created", v: fD(deal.created_at) },
            { l: "Updated", v: fD(deal.updated_at) },
          ].map((x) => (
            <div key={x.l} className="flex justify-between">
              <span className="text-[11px] text-[#8B8B8B] font-sans">
                {x.l}
              </span>
              <span className="text-[11px] text-[#6B6B6B] num">
                {x.v || "\u2014"}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Build velocity data from stage history ── */
interface VelocityEntry {
  stage: string;
  days: number;
  isCurrent: boolean;
}

function buildVelocityData(
  stageHistory: StageHistoryEntry[],
  currentStage: string
): VelocityEntry[] {
  if (stageHistory.length === 0) return [];

  const sorted = [...stageHistory].sort(
    (a, b) =>
      new Date(a.changed_at || "").getTime() -
      new Date(b.changed_at || "").getTime()
  );

  const stageMap: Record<string, { enteredAt: string; exitedAt?: string }> = {};

  for (const entry of sorted) {
    if (entry.to_stage && entry.changed_at) {
      stageMap[entry.to_stage] = {
        enteredAt: entry.changed_at,
        ...(stageMap[entry.to_stage]?.exitedAt
          ? { exitedAt: stageMap[entry.to_stage].exitedAt }
          : {}),
      };
    }
    if (entry.from_stage && stageMap[entry.from_stage] && entry.changed_at) {
      stageMap[entry.from_stage].exitedAt = entry.changed_at;
    }
  }

  const result: VelocityEntry[] = [];
  // Order stages based on STAGES config
  const stageOrder = STAGES.map((s) => s.k);

  for (const sk of stageOrder) {
    if (!stageMap[sk]) continue;
    const info = stageMap[sk];
    const isCurrent = sk === currentStage;
    const days = info.exitedAt
      ? Math.floor(
          (new Date(info.exitedAt).getTime() -
            new Date(info.enteredAt).getTime()) /
            86400000
        )
      : dBetween(info.enteredAt);

    result.push({ stage: sk, days, isCurrent });
  }

  return result;
}
