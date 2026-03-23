"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type AvatarPalette = "green" | "amber" | "blue" | "violet" | "rose";

const PALETTE_CLASSES: Record<AvatarPalette, string> = {
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

interface ExpandablePersonCardProps {
  avatar: { initials: string; palette: AvatarPalette };
  name: string;
  subtitle?: string;
  badge?: string;
  rightContent?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function ExpandablePersonCard({
  avatar,
  name,
  subtitle,
  badge,
  rightContent,
  actions,
  children,
  defaultOpen = false,
}: ExpandablePersonCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      {/* Collapsed row */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50 rq-transition group/person"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Avatar */}
        <div
          className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
            PALETTE_CLASSES[avatar.palette]
          )}
        >
          {avatar.initials}
        </div>

        {/* Name & subtitle */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate">{name}</div>
          {subtitle && (
            <div className="text-[11px] text-muted-foreground truncate">{subtitle}</div>
          )}
        </div>

        {/* Badge */}
        {badge && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-border text-muted-foreground shrink-0">
            {badge}
          </span>
        )}

        {/* Right content (ownership bar, etc.) */}
        {rightContent}

        {/* Hover actions */}
        {actions && (
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover/person:opacity-100 rq-transition"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 rq-transition-transform",
            open && "rotate-180"
          )}
        />
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t px-4 py-4 bg-muted/20">
          {children}
        </div>
      )}
    </div>
  );
}

/** Small avatar for deal team rows (no expand) */
export function PersonAvatar({
  initials,
  palette,
  size = "md",
  dimmed = false,
}: {
  initials: string;
  palette: AvatarPalette;
  size?: "sm" | "md";
  dimmed?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold shrink-0",
        size === "sm" ? "h-[30px] w-[30px] text-[10px]" : "h-9 w-9 text-xs",
        PALETTE_CLASSES[palette],
        dimmed && "opacity-30"
      )}
    >
      {initials}
    </div>
  );
}
