import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * StagePill — Requity Design System v2
 *
 * Border-radius: 6px | Padding: 2px 8px | Font: 11px Inter 600
 * Color mapping uses exact design system semantic tokens with dark mode support.
 */

type PillStyle = { className: string; label: string };

const STAGE_STYLES: Record<string, PillStyle> = {
  // Lead → accentSoft + textSecondary
  lead: {
    className:
      "bg-[rgba(26,26,26,0.06)] text-[#6B6B6B] dark:bg-[rgba(240,240,240,0.06)] dark:text-[#888888]",
    label: "Lead",
  },
  // Application → blueSoft + blue
  application: {
    className:
      "bg-[rgba(37,99,235,0.06)] text-[#2563EB] dark:bg-[rgba(59,130,246,0.1)] dark:text-[#3B82F6]",
    label: "Application",
  },
  // Processing → blueSoft + blue (Due Diligence equivalent)
  processing: {
    className:
      "bg-[rgba(37,99,235,0.06)] text-[#2563EB] dark:bg-[rgba(59,130,246,0.1)] dark:text-[#3B82F6]",
    label: "Processing",
  },
  // Underwriting → warningSoft + warning
  underwriting: {
    className:
      "bg-[rgba(204,122,0,0.08)] text-[#CC7A00] dark:bg-[rgba(240,160,48,0.1)] dark:text-[#F0A030]",
    label: "Underwriting",
  },
  // Approved → goldSoft + gold
  approved: {
    className:
      "bg-[rgba(184,134,11,0.08)] text-[#B8860B] dark:bg-[rgba(212,168,75,0.1)] dark:text-[#D4A84B]",
    label: "Approved",
  },
  // Clear to Close → goldSoft + gold (Closing equivalent)
  clear_to_close: {
    className:
      "bg-[rgba(184,134,11,0.08)] text-[#B8860B] dark:bg-[rgba(212,168,75,0.1)] dark:text-[#D4A84B]",
    label: "Clear to Close",
  },
  // Funded → successSoft + success
  funded: {
    className:
      "bg-[rgba(26,135,84,0.08)] text-[#1A8754] dark:bg-[rgba(52,199,123,0.1)] dark:text-[#34C77B]",
    label: "Funded",
  },
  // Servicing → blueSoft + blue
  servicing: {
    className:
      "bg-[rgba(37,99,235,0.06)] text-[#2563EB] dark:bg-[rgba(59,130,246,0.1)] dark:text-[#3B82F6]",
    label: "Servicing",
  },
  // Payoff → accentSoft + textTertiary (Closed equivalent)
  payoff: {
    className:
      "bg-[rgba(26,26,26,0.06)] text-[#999999] dark:bg-[rgba(240,240,240,0.06)] dark:text-[#606060]",
    label: "Payoff",
  },
  // Default → dangerSoft + danger
  default: {
    className:
      "bg-[rgba(212,38,32,0.08)] text-[#D42620] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#EF4444]",
    label: "Default",
  },
  // REO → dangerSoft + danger
  reo: {
    className:
      "bg-[rgba(212,38,32,0.08)] text-[#D42620] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#EF4444]",
    label: "REO",
  },
  // Paid Off → accentSoft + textTertiary
  paid_off: {
    className:
      "bg-[rgba(26,26,26,0.06)] text-[#999999] dark:bg-[rgba(240,240,240,0.06)] dark:text-[#606060]",
    label: "Paid Off",
  },
  // Draft → accentSoft + textSecondary
  draft: {
    className:
      "bg-[rgba(26,26,26,0.06)] text-[#6B6B6B] dark:bg-[rgba(240,240,240,0.06)] dark:text-[#888888]",
    label: "Draft",
  },
  // Submitted → blueSoft + blue
  submitted: {
    className:
      "bg-[rgba(37,99,235,0.06)] text-[#2563EB] dark:bg-[rgba(59,130,246,0.1)] dark:text-[#3B82F6]",
    label: "Submitted",
  },
  // In Review → warningSoft + warning
  in_review: {
    className:
      "bg-[rgba(204,122,0,0.08)] text-[#CC7A00] dark:bg-[rgba(240,160,48,0.1)] dark:text-[#F0A030]",
    label: "In Review",
  },
  // Denied → dangerSoft + danger
  denied: {
    className:
      "bg-[rgba(212,38,32,0.08)] text-[#D42620] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#EF4444]",
    label: "Denied",
  },
  // Withdrawn → accentSoft + textTertiary
  withdrawn: {
    className:
      "bg-[rgba(26,26,26,0.06)] text-[#999999] dark:bg-[rgba(240,240,240,0.06)] dark:text-[#606060]",
    label: "Withdrawn",
  },
  // Note Sold → accentSoft + textTertiary
  note_sold: {
    className:
      "bg-[rgba(26,26,26,0.06)] text-[#999999] dark:bg-[rgba(240,240,240,0.06)] dark:text-[#606060]",
    label: "Note Sold",
  },
};

const FALLBACK_STYLE =
  "bg-[rgba(26,26,26,0.06)] text-[#6B6B6B] dark:bg-[rgba(240,240,240,0.06)] dark:text-[#888888]";

interface StagePillProps {
  stage: string | null | undefined;
  className?: string;
}

export function StagePill({ stage, className }: StagePillProps) {
  if (!stage) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "rounded-[6px] px-2 py-[2px] text-[11px] font-semibold whitespace-nowrap border-transparent",
          FALLBACK_STYLE,
          className
        )}
      >
        --
      </Badge>
    );
  }

  const config = STAGE_STYLES[stage];
  const label = config?.label ?? stage.replace(/_/g, " ");

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-[6px] px-2 py-[2px] text-[11px] font-semibold capitalize whitespace-nowrap border-transparent",
        config?.className ?? FALLBACK_STYLE,
        className
      )}
    >
      {label}
    </Badge>
  );
}
