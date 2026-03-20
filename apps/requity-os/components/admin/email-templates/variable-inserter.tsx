"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Code } from "lucide-react";
import {
  MERGE_FIELD_REGISTRY,
  searchFields,
} from "@/lib/merge-field-registry";

interface VariableInserterProps {
  onInsert: (variable: string) => void;
}

export function VariableInserter({ onInsert }: VariableInserterProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = search ? searchFields(search) : MERGE_FIELD_REGISTRY;

  // Group by category for organized display
  const grouped = new Map<string, typeof filtered>();
  for (const f of filtered) {
    const list = grouped.get(f.category) ?? [];
    list.push(f);
    grouped.set(f.category, list);
  }

  return (
    <div className="rounded-md border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Code className="h-4 w-4" />
        Merge Variables
        <span className="text-xs ml-auto">
          {expanded ? "Click to collapse" : "Click to expand"}
        </span>
      </button>

      {expanded && (
        <div className="border-t px-3 py-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            {Array.from(grouped.entries()).map(([category, fields]) => (
              <div key={category}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {category}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {fields.map((v) => (
                    <Button
                      key={v.key}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => onInsert(v.key)}
                      title={`Insert {{${v.key}}} — ${v.label}`}
                    >
                      <Badge
                        variant="secondary"
                        className="h-4 px-1 text-[10px] font-mono"
                      >
                        {`{{${v.key}}}`}
                      </Badge>
                      <span className="text-muted-foreground">{v.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">
                No matching variables found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
