"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/chat-utils";
import type { MentionSuggestion } from "@/lib/chat-types";
import { AtSign, Users, Hash, Landmark } from "lucide-react";

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
    <div className="absolute bottom-full left-0 mb-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
      <div className="py-1">
        {suggestions.map((s, i) => (
          <button
            key={`${s.type}-${s.id}`}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors",
              i === selectedIndex && "bg-blue-50"
            )}
            onClick={() => onSelect(s)}
            onMouseDown={(e) => e.preventDefault()}
          >
            {s.type === "user" ? (
              <Avatar className="h-7 w-7">
                {s.avatar_url && <AvatarImage src={s.avatar_url} />}
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                  {getInitials(s.label)}
                </AvatarFallback>
              </Avatar>
            ) : s.type === "everyone" ? (
              <div className="h-7 w-7 flex items-center justify-center rounded-full bg-amber-100">
                <Users className="h-4 w-4 text-amber-700" />
              </div>
            ) : s.type === "entity" ? (
              <div className="h-7 w-7 flex items-center justify-center rounded-full bg-purple-100">
                <Landmark className="h-4 w-4 text-purple-700" />
              </div>
            ) : (
              <div className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100">
                <Hash className="h-4 w-4 text-slate-500" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-900 truncate">
                {s.label}
              </div>
              {s.sublabel && (
                <div className="text-xs text-slate-500 truncate">
                  {s.sublabel}
                </div>
              )}
            </div>
            {s.type === "entity" && s.entity_type && (
              <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                {s.entity_type}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
