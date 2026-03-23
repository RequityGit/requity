"use client";

import { cn } from "@/lib/utils";
import { getUserColor, colorVariants } from "@/lib/user-colors";
import type { SelectableContact } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SelectableAvatarProps {
  contact: SelectableContact;
  selected: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}

const ROLE_BADGE: Record<string, string> = {
  Borrower: "B",
  "Co-Borrower": "CB",
  Broker: "BK",
  Originator: "O",
  Processor: "P",
  Underwriter: "U",
  "Title Company": "T",
  "Insurance Agent": "IA",
};

export function SelectableAvatar({
  contact,
  selected,
  onToggle,
  size = "md",
}: SelectableAvatarProps) {
  const color = getUserColor({ id: contact.colorSeed, accent_color: null });
  const variants = colorVariants(color);

  const sizeClasses = size === "sm" ? "h-7 w-7 text-[10px]" : "h-[30px] w-[30px] text-[10px]";

  const badge = ROLE_BADGE[contact.role];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-lg font-semibold rq-transition cursor-pointer border-0",
            sizeClasses,
            selected && "ring-2 ring-primary ring-offset-1 ring-offset-background"
          )}
          style={{
            backgroundColor: contact.category === "internal" ? undefined : variants.bg,
            border: selected ? undefined : contact.category === "internal" ? undefined : `1.5px solid ${variants.border}`,
            color: contact.category === "internal" ? undefined : variants.base,
          }}
          data-category={contact.category}
        >
          {/* Internal team uses primary bg, external uses color-coded */}
          {contact.category === "internal" ? (
            <span className="flex h-full w-full items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-medium">
              {contact.initials}
            </span>
          ) : (
            contact.initials
          )}
          {badge && (
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-[4px] text-[7px] font-bold leading-none px-[3px] py-[1px] ring-1 ring-background",
                contact.category === "internal"
                  ? "bg-primary text-primary-foreground"
                  : contact.role === "Borrower"
                    ? "bg-blue-500 text-white"
                    : contact.role === "Broker"
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-600 text-white dark:bg-emerald-500"
              )}
            >
              {badge}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <p className="font-medium">{contact.name}</p>
        <p className="text-muted-foreground">{contact.role}</p>
        {contact.email && <p className="text-muted-foreground">{contact.email}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
