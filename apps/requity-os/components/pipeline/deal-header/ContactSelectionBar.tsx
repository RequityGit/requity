"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SelectableAvatar } from "./SelectableAvatar";
import type { SelectableContact } from "./types";

interface ContactSelectionBarProps {
  contacts: SelectableContact[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClearSelection: () => void;
  hasSelection: boolean;
}

export function ContactSelectionBar({
  contacts,
  selectedIds,
  onToggle,
  onClearSelection,
  hasSelection,
}: ContactSelectionBarProps) {
  const external = contacts.filter((c) => c.category === "external");
  const internal = contacts.filter((c) => c.category === "internal");

  if (contacts.length === 0) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        {/* External contacts */}
        {external.length > 0 && (
          <div className="flex items-center -space-x-1">
            {external.map((contact) => (
              <SelectableAvatar
                key={contact.id}
                contact={contact}
                selected={selectedIds.has(contact.id)}
                onToggle={() => onToggle(contact.id)}
              />
            ))}
          </div>
        )}

        {/* Separator between external and internal */}
        {external.length > 0 && internal.length > 0 && (
          <div className="h-5 w-px bg-border mx-1" />
        )}

        {/* Internal team */}
        {internal.length > 0 && (
          <div className="flex items-center -space-x-1">
            {internal.map((contact) => (
              <SelectableAvatar
                key={contact.id}
                contact={contact}
                selected={selectedIds.has(contact.id)}
                onToggle={() => onToggle(contact.id)}
              />
            ))}
          </div>
        )}

        {/* Clear selection button */}
        {hasSelection && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-1 text-muted-foreground hover:text-foreground"
            onClick={onClearSelection}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}
