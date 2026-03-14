"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Mail, Info, Check, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  type IntakeItem,
  type IntakeEntityKey,
  ENTITY_META,
} from "@/lib/intake/types";

interface IntakeCardProps {
  item: IntakeItem;
  onClick: () => void;
}

function formatMoney(n: number | undefined): string {
  if (!n) return "--";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const ENTITY_PILL_STYLES: Record<IntakeEntityKey, { matched: string; unmatched: string }> = {
  contact: {
    matched: "bg-blue-500/10 text-blue-600 border-blue-500/25",
    unmatched: "bg-muted/50 text-muted-foreground/40 border-muted",
  },
  borrower_contact: {
    matched: "bg-cyan-500/10 text-cyan-600 border-cyan-500/25",
    unmatched: "bg-muted/50 text-muted-foreground/40 border-muted",
  },
  company: {
    matched: "bg-violet-500/10 text-violet-600 border-violet-500/25",
    unmatched: "bg-muted/50 text-muted-foreground/40 border-muted",
  },
  property: {
    matched: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
    unmatched: "bg-muted/50 text-muted-foreground/40 border-muted",
  },
  opportunity: {
    matched: "bg-amber-500/10 text-amber-600 border-amber-500/25",
    unmatched: "bg-muted/50 text-muted-foreground/40 border-muted",
  },
};

export function IntakeCard({ item, onClick }: IntakeCardProps) {
  const p = item.parsed_data;
  const entityKeys: IntakeEntityKey[] = ["contact", "company", "property", "opportunity"];
  const matchCount = entityKeys.filter((k) => item.auto_matches[k]).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border bg-card p-3 space-y-2",
        "border-l-[3px] border-l-amber-500",
        "hover:border-foreground/20 hover:shadow-sm transition-all cursor-pointer"
      )}
    >
      {/* Row 1: INTAKE badge + loan type */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge className="text-[9px] font-bold px-1.5 py-0 bg-gradient-to-r from-amber-500 to-amber-600 text-black border-0">
            <Mail className="h-2.5 w-2.5 mr-0.5" />
            INTAKE
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(item.received_at), { addSuffix: true })}
          </span>
        </div>
        {p.loanType && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
            {p.loanType}
          </Badge>
        )}
      </div>

      {/* Row 2: Name + address */}
      <div className="text-sm font-medium leading-tight line-clamp-2">
        {p.contactName || p.companyName || "Unknown"}
        {p.propertyAddress ? ` - ${p.propertyAddress.split(",")[0]}` : ""}
      </div>

      {/* Row 3: Property type */}
      {p.propertyType && (
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">{p.propertyType}</span>
        </div>
      )}

      {/* Row 4: Amount */}
      {p.loanAmount ? (
        <p className="text-sm font-semibold num">{formatMoney(p.loanAmount)}</p>
      ) : null}

      {/* Row 5: Entity match pills */}
      <div className="flex flex-wrap gap-1">
        {entityKeys.map((k) => {
          const meta = ENTITY_META[k];
          const hasMatch = !!item.auto_matches[k];
          const styles = ENTITY_PILL_STYLES[k];
          return (
            <span
              key={k}
              className={cn(
                "text-[8px] font-semibold px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5",
                hasMatch ? styles.matched : styles.unmatched
              )}
            >
              {hasMatch ? <Check className="h-2 w-2" /> : <Plus className="h-2 w-2" />}
              {k === "opportunity" ? "Deal" : meta.label}
            </span>
          );
        })}
      </div>

      {/* Row 6: Match hint */}
      <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-500 font-medium">
        <Info className="h-2.5 w-2.5" />
        {matchCount > 0
          ? `${matchCount} match${matchCount > 1 ? "es" : ""} - tap to review fields`
          : "No matches - tap to review"}
      </div>
    </button>
  );
}
