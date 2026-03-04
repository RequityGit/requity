"use client";

import { cn } from "@/lib/utils";
import { ChatAvatar } from "./ChatAvatar";
import type { MentionSuggestion } from "@/lib/chat-types";
import { Users, Hash, Landmark } from "lucide-react";

interface MentionAutocompleteProps {
  suggestions: MentionSuggestion[];
  selectedIndex: number;
  onSelect: (suggestion: MentionSuggestion) => void;
}

export function MentionAutocomplete({
  suggestions,
  selectedIndex,
  onSelect,
}: MentionAutocompleteProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-1 w-72 bg-[#1A2535] border border-[rgba(255,255,255,0.12)] rounded-lg shadow-xl overflow-hidden z-50">
      <div className="py-1">
        {suggestions.map((s, i) => (
          <button
            key={`${s.type}-${s.id}`}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[rgba(255,255,255,0.06)] transition-colors duration-200",
              i === selectedIndex && "bg-accent"
            )}
            onClick={() => onSelect(s)}
            onMouseDown={(e) => e.preventDefault()}
          >
            {s.type === "user" ? (
              <ChatAvatar
                src={s.avatar_url}
                name={s.label}
                size="header"
              />
            ) : s.type === "everyone" ? (
              <div className="h-7 w-7 flex items-center justify-center rounded-md bg-[rgba(212,149,43,0.15)]">
                <Users className="h-4 w-4 text-[#D4952B]" />
              </div>
            ) : s.type === "entity" ? (
              <div className="h-7 w-7 flex items-center justify-center rounded-md bg-muted">
                <Landmark className="h-4 w-4 text-foreground" />
              </div>
            ) : (
              <div className="h-7 w-7 flex items-center justify-center rounded-md bg-muted">
                <Hash className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground truncate">
                {s.label}
              </div>
              {s.sublabel && (
                <div className="text-xs text-muted-foreground truncate">
                  {s.sublabel}
                </div>
              )}
            </div>
            {s.type === "entity" && s.entity_type && (
              <span className="text-xs text-foreground bg-accent px-1.5 py-0.5 rounded">
                {s.entity_type}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
