"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/format";
import type { DealTeamContact } from "@/app/types/deal-team";
import { getDealTeamContactDisplay } from "@/app/types/deal-team";

interface DealTeamRowProps {
  contact: DealTeamContact;
  onEdit: (contact: DealTeamContact) => void;
  onDelete: (id: string) => void;
}

export function DealTeamRow({ contact, onEdit, onDelete }: DealTeamRowProps) {
  const [hovering, setHovering] = useState(false);
  const display = getDealTeamContactDisplay(contact);

  return (
    <div
      className="flex items-center gap-4 py-2 px-1 -mx-1 rounded-md hover:bg-muted/50 transition-colors group"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <span className="text-xs text-muted-foreground w-[100px] shrink-0 truncate">
        {contact.role}
      </span>
      <span className="text-sm font-medium truncate min-w-[120px]">
        {display.name || "---"}
      </span>
      {display.company && (
        <span className="text-xs text-muted-foreground truncate hidden lg:block">
          {display.company}
        </span>
      )}
      <span className="text-xs text-muted-foreground num truncate">
        {display.phone ? (
          <a
            href={`tel:${display.phone.replace(/\D/g, "").slice(-10)}`}
            className="hover:text-foreground transition-colors"
          >
            {formatPhoneNumber(display.phone)}
          </a>
        ) : (
          "---"
        )}
      </span>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground truncate max-w-[160px]">
              {display.email ? (
                <a
                  href={`mailto:${display.email}`}
                  className="hover:text-foreground transition-colors truncate inline-block max-w-full"
                >
                  {display.email}
                </a>
              ) : (
                "---"
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {display.email || "No email"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div
        className={cn(
          "ml-auto flex items-center gap-1 transition-opacity",
          hovering ? "opacity-100" : "opacity-0"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onEdit(contact)}
        >
          <Pencil className="h-3 w-3" strokeWidth={1.5} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(contact.id)}
        >
          <Trash2 className="h-3 w-3" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}
