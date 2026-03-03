"use client";

import { MapPin, Clock, CalendarDays, Building } from "lucide-react";
import {
  DotPill,
  OutlinePill,
  Av,
  IconAv,
  STAGES,
  PRIORITY_COLORS,
  APPROVAL_COLORS,
  cap,
  fD,
  dBetween,
  type DealData,
  type StageHistoryEntry,
} from "./components";

interface HeaderProps {
  deal: DealData;
  stageHistory: StageHistoryEntry[];
  isOpportunity: boolean;
}

export function Header({ deal, stageHistory, isOpportunity }: HeaderProps) {
  const sc = STAGES.find((s) => s.k === deal.stage);
  const stageColor = sc ? sc.c : "#8B8B8B";

  // Calculate days in current stage from stage history
  const currentStageEntry = stageHistory.find(
    (h) => h.to_stage === deal.stage && !stageHistory.some((later) => later.from_stage === deal.stage)
  );
  const stageEnteredAt = currentStageEntry?.changed_at;
  const days = stageEnteredAt ? dBetween(stageEnteredAt) : 0;
  const isWarn = sc && sc.w > 0 && days >= sc.w && days < sc.a;
  const isAlert = sc && sc.a > 0 && days >= sc.a;
  const velColor = isAlert ? "#E5453D" : isWarn ? "#E5930E" : "#6B6B6B";

  const address = deal.property_address
    || [deal.property_address_line1, deal.property_city, deal.property_state, deal.property_zip]
      .filter(Boolean)
      .join(", ");

  const dealName = deal.deal_name
    || `${address || "Untitled Deal"} \u2014 ${cap(deal.type || deal.loan_type)}`;

  const loanType = deal.type || deal.loan_type;
  const loanPurpose = deal.purpose || deal.loan_purpose;

  return (
    <div className="rounded-xl border border-[#E5E5E7] bg-white p-6">
      <div className="flex gap-5">
        <IconAv icon={Building} size={56} color={stageColor} />
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-[22px] font-bold text-[#1A1A1A] font-sans">
            {dealName}
          </h1>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <DotPill label={cap(deal.stage)} color={stageColor} />
            {deal.priority && (
              <DotPill
                label={cap(deal.priority)}
                color={PRIORITY_COLORS[deal.priority] || "#8B8B8B"}
              />
            )}
            {loanType && <OutlinePill label={cap(loanType)} />}
            {loanPurpose && <OutlinePill label={cap(loanPurpose)} />}
            {isOpportunity && <OutlinePill label="Opportunity" />}
            {deal.approval_status && deal.approval_status !== "not_submitted" && (
              <DotPill
                label={"Approval: " + cap(deal.approval_status)}
                color={APPROVAL_COLORS[deal.approval_status] || "#8B8B8B"}
              />
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[13px] text-[#6B6B6B] font-sans">
            <MapPin size={13} />
            {address || "\u2014"}
            {deal._borrower_name && (
              <>
                <span className="mx-1 text-[#E5E5E7]">&middot;</span>
                <span className="cursor-pointer text-[#3B82F6]">
                  {deal._borrower_name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex shrink-0 flex-col items-end gap-2.5">
          {deal._originator && (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-[11px] text-[#8B8B8B] font-sans">
                  Originator
                </div>
                <div className="text-[13px] font-medium font-sans">
                  {deal._originator.full_name}
                </div>
              </div>
              <Av text={deal._originator.initials} />
            </div>
          )}
          <div
            className="flex items-center gap-1 text-xs font-sans"
            style={{
              color: velColor,
              fontWeight: isWarn || isAlert ? 600 : 400,
            }}
          >
            <Clock size={12} />
            In {cap(deal.stage)} for {days} days
          </div>
          <div className="flex items-center gap-1 text-xs text-[#6B6B6B] font-sans">
            <CalendarDays size={12} />
            Close:{" "}
            <span className="font-semibold text-[#1A1A1A]">
              {fD(deal.expected_close_date)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
