"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  icon: LucideIcon;
  title: string;
  count?: number;
  defaultOpen?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}

export function CollapsibleSection({
  icon: Icon,
  title,
  count,
  defaultOpen = true,
  actions,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rq-card-wrapper">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-3 px-5 py-3.5 text-left cursor-pointer hover:bg-muted/30 rq-transition rounded-t-xl">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <span className="rq-section-title">{title}</span>
            {count != null && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                {count}
              </span>
            )}
            <div className="flex-1" />
            {actions && (
              <span
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {actions}
              </span>
            )}
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground rq-transition-transform",
                open && "rotate-90"
              )}
              strokeWidth={1.5}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t p-5">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
