"use client";

import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  X,
} from "lucide-react";
import { DealPreviewStageRail } from "./DealPreviewStageRail";
import type { UnifiedStage } from "../pipeline-types";
import type { DealPreviewData, DealTeamMember } from "./useDealPreviewData";

// ─── Helpers ───

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/40", fg: "text-blue-700 dark:text-blue-300" },
  { bg: "bg-amber-100 dark:bg-amber-900/40", fg: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/40", fg: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-purple-100 dark:bg-purple-900/40", fg: "text-purple-700 dark:text-purple-300" },
  { bg: "bg-rose-100 dark:bg-rose-900/40", fg: "text-rose-700 dark:text-rose-300" },
];

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// ─── Component ───

interface DealPreviewHeaderProps {
  data: DealPreviewData;
  currentIndex: number;
  totalDeals: number;
  onCyclePrev: () => void;
  onCycleNext: () => void;
  onAdvanceStage: () => void;
  onRegressStage: () => void;
  onClose: () => void;
  onOpenFullPage: () => void;
  stageLoading?: boolean;
  /** Team member names resolved from profiles (profile_id -> name) */
  teamMemberNames?: Map<string, string>;
}

export function DealPreviewHeader({
  data,
  currentIndex,
  totalDeals,
  onCyclePrev,
  onCycleNext,
  onAdvanceStage,
  onRegressStage,
  onClose,
  onOpenFullPage,
  stageLoading,
  teamMemberNames,
}: DealPreviewHeaderProps) {
  const { deal, teamMembers, teamContacts } = data;
  const daysInStage = deal.days_in_stage ?? 0;
  const daysColor =
    daysInStage >= 10
      ? "text-red-600 dark:text-red-400"
      : daysInStage >= 5
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  // Build team display: internal members + external contacts with roles
  const teamDisplay = buildTeamDisplay(teamMembers, teamContacts, teamMemberNames);

  return (
    <div className="shrink-0 px-5 pt-3">
      {/* Top bar */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="num text-xs font-medium text-muted-foreground">
            {deal.deal_number ?? "---"}
          </span>
          {deal.uw_data?.loan_type ? (
            <span className="rounded bg-foreground px-2 py-0.5 text-[10px] font-bold tracking-wide text-background">
              {String(deal.uw_data.loan_type)}
            </span>
          ) : null}
          <span className="h-3.5 w-px bg-border" />
          <span className="text-xs text-muted-foreground">
            {deal.asset_class ? formatAssetClass(deal.asset_class) : "---"}
          </span>
          <span className={cn("flex items-center gap-1 text-[11px] font-medium", daysColor)}>
            <Clock className="h-3 w-3" />
            {daysInStage}d in stage
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="num text-[11px] text-muted-foreground">
            {currentIndex + 1} / {totalDeals}
          </span>
          <button
            onClick={onCyclePrev}
            disabled={currentIndex <= 0}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-background text-muted-foreground rq-transition hover:bg-accent disabled:opacity-30"
            title="Previous deal (←)"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onCycleNext}
            disabled={currentIndex >= totalDeals - 1}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-background text-muted-foreground rq-transition hover:bg-accent disabled:opacity-30"
            title="Next deal (→)"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <span className="h-3.5 w-px bg-border" />
          <button
            onClick={onOpenFullPage}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground rq-transition hover:bg-accent"
          >
            Open
            <kbd className="rounded border border-border/50 bg-muted/50 px-[5px] py-px text-[9px] font-medium leading-4 text-muted-foreground/70">
              Space
            </kbd>
          </button>
          <button
            onClick={onClose}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-background text-muted-foreground rq-transition hover:bg-accent"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Deal name row */}
      <div className="mb-2 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-foreground">{deal.name}</h2>
          <div className="mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {(deal.uw_data?.address as string) || (deal.property_data?.address as string) || "No address"}
            </span>
          </div>
        </div>

        {/* Team avatars */}
        {teamDisplay.length > 0 && (
          <div className="ml-4 flex shrink-0 items-center gap-2">
            <div className="flex -space-x-2">
              {teamDisplay.slice(0, 5).map((member, i) => {
                const color = avatarColor(i);
                return (
                  <span
                    key={member.id}
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-background",
                      color.bg,
                      color.fg
                    )}
                    title={`${member.name} (${member.role})`}
                    style={{ zIndex: teamDisplay.length - i }}
                  >
                    {member.initials}
                  </span>
                );
              })}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {teamDisplay.map((m) => m.name.split(" ")[0]).join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Stage rail */}
      <div className="mb-3">
        <DealPreviewStageRail
          currentStage={deal.stage as UnifiedStage}
          onAdvance={onAdvanceStage}
          onRegress={onRegressStage}
          disabled={stageLoading}
        />
      </div>
    </div>
  );
}

// ─── Helpers ───

interface TeamDisplayMember {
  id: string;
  name: string;
  initials: string;
  role: string;
}

function buildTeamDisplay(
  members: DealTeamMember[],
  contacts: DealPreviewData["teamContacts"],
  nameMap?: Map<string, string>
): TeamDisplayMember[] {
  const result: TeamDisplayMember[] = [];

  for (const m of members) {
    const name = nameMap?.get(m.profile_id) ?? "Team";
    result.push({
      id: m.id,
      name,
      initials: getInitials(name),
      role: formatRole(m.role),
    });
  }

  for (const c of contacts) {
    const name = c.contact
      ? `${c.contact.first_name ?? ""} ${c.contact.last_name ?? ""}`.trim()
      : c.manual_name || "Contact";
    result.push({
      id: c.id,
      name,
      initials: getInitials(name),
      role: formatRole(c.role),
    });
  }

  return result;
}

function formatRole(role: string): string {
  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAssetClass(ac: string): string {
  return ac
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
