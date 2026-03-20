"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  ENTITY_CONFIG,
  getPrimaryText,
  getSecondaryText,
  getStatusBadge,
  type SearchEntityType,
} from "@/lib/search-utils";
import { formatRelativeTime } from "@/lib/notifications";

interface SearchResultProps {
  id: string;
  entityType: SearchEntityType;
  metadata: Record<string, unknown>;
  updatedAt: string;
  isSelected: boolean;
  onClick: () => void;
}

export function SearchResult({
  entityType,
  metadata,
  updatedAt,
  isSelected,
  onClick,
}: SearchResultProps) {
  const config = ENTITY_CONFIG[entityType];
  if (!config) return null;

  const Icon = config.icon;
  const primaryText = getPrimaryText(entityType, metadata);
  const secondaryText = getSecondaryText(entityType, metadata);
  const statusBadge = getStatusBadge(entityType, metadata);

  // Loan-specific: show formatted amount
  const amountDisplay =
    entityType === "loan" && metadata.loan_amount
      ? formatCurrency(metadata.loan_amount as number)
      : entityType === "fund" && metadata.current_aum
        ? formatCurrency(metadata.current_aum as number)
        : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted",
        isSelected && "bg-muted border-l-2 border-l-blue-500"
      )}
    >
      {/* Entity type icon */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          config.bgColor
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {primaryText}
          </span>
          {amountDisplay && (
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {amountDisplay}
            </span>
          )}
        </div>
        {secondaryText && (
          <p className="truncate text-xs text-muted-foreground">{secondaryText}</p>
        )}
      </div>

      {/* Right side: status badge, entity label, time */}
      <div className="flex shrink-0 items-center gap-2">
        {statusBadge && (
          <Badge variant={statusBadge.variant} className="text-[10px] px-1.5 py-0">
            {statusBadge.text}
          </Badge>
        )}
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded",
            config.bgColor,
            config.color
          )}
        >
          {config.label}
        </span>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {formatRelativeTime(updatedAt)}
        </span>
      </div>
    </button>
  );
}
