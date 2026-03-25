"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, ChevronDown, X } from "lucide-react";
import type { CommitmentStatus } from "@/lib/fundraising/types";
import { COMMITMENT_STATUS_OPTIONS } from "@/lib/fundraising/types";

interface SelectionActionBarProps {
  count: number;
  onEmailSelected: () => void;
  onChangeStatus: (status: CommitmentStatus) => void;
  onClearSelection: () => void;
}

export function SelectionActionBar({
  count,
  onEmailSelected,
  onChangeStatus,
  onClearSelection,
}: SelectionActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rq-animate-fade-in">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-lg">
        <span className="text-sm font-medium whitespace-nowrap">
          {count} selected
        </span>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          size="sm"
          variant="default"
          className="gap-1.5"
          onClick={onEmailSelected}
        >
          <Mail className="h-3.5 w-3.5" />
          Email Selected
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              Change Status
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {COMMITMENT_STATUS_OPTIONS.map((o) => (
              <DropdownMenuItem
                key={o.value}
                onClick={() => onChangeStatus(o.value)}
              >
                Mark as {o.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={onClearSelection}
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
