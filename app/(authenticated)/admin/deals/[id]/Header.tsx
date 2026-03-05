"use client";

import { Layers, Clock, CalendarDays } from "lucide-react";
import {
  T,
  Badge,
  Av,
  IconAv,
  cap,
  fD,
  dBetween,
  type DealData,
  type PipelineStage,
} from "./components";

interface HeaderProps {
  deal: DealData;
  stages: PipelineStage[];
  isOpportunity: boolean;
}

export function Header({ deal, stages, isOpportunity }: HeaderProps) {
  const sc = stages.find((s) => s.stage_key === deal.stage);
  const stageColor = sc?.color || T.accent.purple;
  const stageLabel = sc?.label || cap(deal.stage);

  const daysInStage = deal.stage_updated_at
    ? dBetween(deal.stage_updated_at)
    : 0;

  const address =
    deal.property_address ||
    [deal.property_address_line1, deal.property_city, deal.property_state, deal.property_zip]
      .filter(Boolean)
      .join(", ");

  const dealName =
    deal.deal_name ||
    deal.property_address_line1 ||
    address?.split(",")[0] ||
    "Untitled Deal";

  const loanType = deal.type || deal.loan_type;

  return (
    <div className="flex items-start justify-between gap-5">
      <div className="flex gap-4 items-start">
        <IconAv icon={Layers} size={48} color={T.accent.blue} />
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1
              className="m-0 text-[22px] font-bold tracking-tight"
              style={{ color: T.text.primary, letterSpacing: "-0.02em" }}
            >
              {dealName}
            </h1>
            {loanType && (
              <Badge color={T.accent.blue}>{loanType.toUpperCase()}</Badge>
            )}
            <Badge color={stageColor} bg={stageColor + "22"}>
              {stageLabel}
            </Badge>
            {isOpportunity && (
              <Badge color={T.accent.purple}>Opportunity</Badge>
            )}
          </div>
          <div
            className="flex items-center gap-4 text-[13px]"
            style={{ color: T.text.muted }}
          >
            {address && <span>{address}</span>}
            <span className="flex items-center gap-1">
              <Clock size={12} strokeWidth={1.5} color={T.text.muted} />
              <span className="num">{daysInStage}</span> days in stage
            </span>
            {deal.expected_close_date && (
              <span className="flex items-center gap-1">
                <CalendarDays size={12} strokeWidth={1.5} color={T.text.muted} />
                Close: <span className="num">{fD(deal.expected_close_date)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Team Avatars */}
      <div className="flex items-center gap-2 shrink-0">
        {deal._originator && (
          <>
            <div className="flex flex-col items-end gap-0.5">
              <span
                className="text-[10px] uppercase tracking-wider"
                style={{ color: T.text.muted }}
              >
                Originator
              </span>
              <span className="text-xs" style={{ color: T.text.secondary }}>
                {deal._originator.full_name}
              </span>
            </div>
            <Av text={deal._originator.initials} color="#7c3aed" />
          </>
        )}
        {deal._processor && (
          <>
            <div
              className="mx-1"
              style={{ width: 1, height: 24, backgroundColor: T.bg.border }}
            />
            <Av text={deal._processor.initials} color="#2563eb" />
            <div className="flex flex-col gap-0.5">
              <span
                className="text-[10px] uppercase tracking-wider"
                style={{ color: T.text.muted }}
              >
                Processor
              </span>
              <span className="text-xs" style={{ color: T.text.secondary }}>
                {deal._processor.full_name}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
