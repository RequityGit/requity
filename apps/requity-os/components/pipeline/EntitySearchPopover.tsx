"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, Loader2, CheckCircle2 } from "lucide-react";
import { searchEntityAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  type IntakeEntityKey,
  type EntityMatchResult,
  ENTITY_META,
} from "@/lib/intake/types";

interface EntitySearchPopoverProps {
  entityKey: IntakeEntityKey;
  onSelect: (entityKey: IntakeEntityKey, match: EntityMatchResult) => void;
}

interface SearchResult {
  match_id: string;
  snapshot: Record<string, unknown>;
}

export function EntitySearchPopover({ entityKey, onSelect }: EntitySearchPopoverProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, startSearch] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const meta = ENTITY_META[entityKey];
  const displayLabel = entityKey === "opportunity" ? "deal" : meta.label.toLowerCase();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const res = await searchEntityAction(entityKey, value);
        setResults(res.results || []);
        setHasSearched(true);
      });
    }, 300);
  };

  const handleSelect = (result: SearchResult) => {
    onSelect(entityKey, {
      match_id: result.match_id,
      confidence: 1,
      matched_on: ["manual_search"],
      snapshot: result.snapshot,
    });
  };

  const getDisplayFields = (snapshot: Record<string, unknown>): string[] => {
    const fields: string[] = [];
    const name = snapshot.name || snapshot.address_line1;
    if (name) fields.push(String(name));
    if (snapshot.email) fields.push(String(snapshot.email));
    if (snapshot.phone) fields.push(String(snapshot.phone));
    if (snapshot.deal_number) fields.push(`#${snapshot.deal_number}`);
    if (snapshot.city && snapshot.state) fields.push(`${snapshot.city}, ${snapshot.state}`);
    else if (snapshot.state) fields.push(String(snapshot.state));
    return fields;
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={`Search for an existing ${displayLabel}...`}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="h-8 pl-8 text-[11px]"
        />
        {searching && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((r) => {
            const fields = getDisplayFields(r.snapshot);
            return (
              <button
                key={r.match_id}
                type="button"
                onClick={() => handleSelect(r)}
                className={cn(
                  "w-full text-left rounded-md border px-3 py-2 transition-colors",
                  "hover:bg-accent hover:border-primary/30"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-foreground truncate">
                      {fields[0] || "Unnamed"}
                    </div>
                    {fields.length > 1 && (
                      <div className="text-[10px] text-muted-foreground truncate">
                        {fields.slice(1).join(" \u00B7 ")}
                      </div>
                    )}
                  </div>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/30" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {hasSearched && results.length === 0 && !searching && (
        <p className="text-[10px] text-muted-foreground text-center py-2">
          No matching {displayLabel}s found for &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  );
}
