"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Building2, Home } from "lucide-react";
import {
  type UnifiedCardType,
  CAPITAL_SIDE_COLORS,
} from "./pipeline-types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "building-2": Building2,
  home: Home,
};

interface CardTypeSelectorProps {
  cardTypes: UnifiedCardType[];
  selected: string | null;
  onSelect: (id: string) => void;
  onDoubleClick?: (id: string) => void;
}

export function CardTypeSelector({
  cardTypes,
  selected,
  onSelect,
  onDoubleClick,
}: CardTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cardTypes.map((ct) => {
        const IconComponent = ICON_MAP[ct.card_icon] ?? Building2;
        const isSelected = selected === ct.id;

        return (
          <button
            key={ct.id}
            type="button"
            onClick={() => onSelect(ct.id)}
            onDoubleClick={() => {
              onSelect(ct.id);
              onDoubleClick?.(ct.id);
            }}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all",
              "hover:border-foreground/20 hover:shadow-sm",
              isSelected && "border-foreground ring-1 ring-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <IconComponent className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{ct.label}</span>
            </div>
            {ct.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {ct.description}
              </p>
            )}
            <Badge
              variant="outline"
              className={cn("text-[10px]", CAPITAL_SIDE_COLORS[ct.capital_side])}
            >
              {ct.capital_side}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}

