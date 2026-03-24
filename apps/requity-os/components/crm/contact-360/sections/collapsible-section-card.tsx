"use client";

import { useState, forwardRef, type ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleSectionCardProps {
  icon: LucideIcon;
  title: string;
  summary?: ReactNode;
  count?: number;
  defaultOpen?: boolean;
  headerActions?: ReactNode;
  children: ReactNode;
  id?: string;
}

export const CollapsibleSectionCard = forwardRef<
  HTMLDivElement,
  CollapsibleSectionCardProps
>(function CollapsibleSectionCard(
  { icon: Icon, title, summary, count, defaultOpen = false, headerActions, children, id },
  ref
) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div ref={ref} id={id} className="rounded-xl border bg-card">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-3 px-5 py-4 text-left cursor-pointer hover:bg-muted/30 transition-colors">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-foreground">{title}</span>
            {count != null && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                {count}
              </span>
            )}
            {!open && summary && (
              <span className="ml-1 flex-1 truncate text-xs text-muted-foreground">
                {summary}
              </span>
            )}
            <div className="flex-1" />
            {headerActions && (
              <span
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {headerActions}
              </span>
            )}
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-90"
              )}
              strokeWidth={1.5}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-5 py-4">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});
