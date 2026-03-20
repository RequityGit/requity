import { cn } from "@/lib/utils";
import { CRM_RELATIONSHIP_TYPES, CRM_LIFECYCLE_STAGES } from "@/lib/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// ── Color Maps ───────────────────────────────────────────────────────────

export const REL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  borrower:        { bg: "bg-blue-50 dark:bg-blue-950/30",    text: "text-blue-600 dark:text-blue-400",     border: "border-blue-200 dark:border-blue-800" },
  investor:        { bg: "bg-green-50 dark:bg-green-950/30",  text: "text-green-600 dark:text-green-400",   border: "border-green-200 dark:border-green-800" },
  broker:          { bg: "bg-amber-50 dark:bg-amber-950/30",  text: "text-amber-600 dark:text-amber-400",   border: "border-amber-200 dark:border-amber-800" },
  lender:          { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  vendor:          { bg: "bg-muted dark:bg-muted",              text: "text-muted-foreground dark:text-muted-foreground", border: "border-border dark:border-border" },
  referral_partner: { bg: "bg-teal-50 dark:bg-teal-950/30",  text: "text-teal-600 dark:text-teal-400",     border: "border-teal-200 dark:border-teal-800" },
  other:           { bg: "bg-muted dark:bg-muted",              text: "text-muted-foreground dark:text-muted-foreground", border: "border-border dark:border-border" },
};

export const STAGE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  uncontacted: { bg: "bg-muted dark:bg-muted",           text: "text-muted-foreground dark:text-muted-foreground", dot: "bg-gray-500" },
  lead:        { bg: "bg-muted dark:bg-muted",           text: "text-muted-foreground dark:text-muted-foreground", dot: "bg-slate-500" },
  prospect:    { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  active:      { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  past:        { bg: "bg-red-100 dark:bg-red-900/40",   text: "text-red-600 dark:text-red-400",     dot: "bg-red-500" },
};

// ── Primitives ───────────────────────────────────────────────────────────

const crmAvatarSizes = {
  sm: "h-6 w-6 text-[9px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-11 w-11 text-sm",
};

export function CrmAvatar({ text, size = "sm" }: { text: string; size?: "sm" | "md" | "lg" }) {
  return (
    <Avatar className={cn(crmAvatarSizes[size], "border border-foreground/10")}>
      <AvatarFallback className={cn(crmAvatarSizes[size], "bg-foreground/5 text-foreground font-semibold")}>
        {text}
      </AvatarFallback>
    </Avatar>
  );
}

export function RelPill({ type }: { type: string }) {
  const label = CRM_RELATIONSHIP_TYPES.find((r) => r.value === type)?.label ?? type;
  const colors = REL_COLORS[type] ?? REL_COLORS.other;
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full text-[11px] font-medium",
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      {label}
    </Badge>
  );
}

export function StageDot({ stage }: { stage: string | null }) {
  const stageLabel = CRM_LIFECYCLE_STAGES.find((s) => s.value === stage)?.label ?? stage ?? "—";
  const colors = STAGE_COLORS[stage ?? ""] ?? STAGE_COLORS.uncontacted;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full border-transparent text-[11px] font-medium",
        colors.bg,
        colors.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {stageLabel}
    </Badge>
  );
}

export function CompanyStatusDot({ isActive }: { isActive: boolean | null }) {
  const active = isActive !== false;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full border-transparent text-[11px] font-medium",
        active ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : "bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-green-500" : "bg-gray-400")} />
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

// ── Utilities ───────────────────────────────────────────────────────────

export function getInitials(firstName: string, lastName: string): string {
  return ((firstName?.[0] ?? "") + (lastName?.[0] ?? "")).toUpperCase() || "?";
}

export function getNameInitials(fullName: string | null): string {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/);
  return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}
