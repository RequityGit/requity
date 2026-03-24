"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Loader2, User, X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactResult {
  id: string;
  name: string;
  email: string;
  source: "internal" | "contact";
  company?: string | null;
}

interface MultiEmailComboboxProps {
  /** Comma-separated email string */
  value: string;
  /** Called with updated comma-separated string */
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

/**
 * Multi-email input with contact search autocomplete.
 * Selected emails render as removable badges. Typing triggers
 * a search across internal team (profiles) and CRM contacts,
 * with internal results prioritised.
 */
export function MultiEmailCombobox({
  value,
  onChange,
  placeholder = "Type a name or email...",
  id,
  className,
}: MultiEmailComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<ContactResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const justSelectedRef = useRef(false);

  // Parse the comma-separated value into an array of trimmed emails
  const emails = useMemo(() => {
    if (!value.trim()) return [];
    return value
      .split(/[,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
  }, [value]);

  // Sync inputValue from external value changes only when the raw trailing
  // portion (after last completed email) changes
  // We keep inputValue as the "in-progress" text the user is typing

  const debouncedQuery = useDebounce(inputValue, 200);

  // Search contacts when debounced query changes
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    let cancelled = false;

    async function search() {
      setLoading(true);
      try {
        const supabase = createClient();
        const q = debouncedQuery.trim();

        // Query internal team (profiles with admin role)
        const { data: internalData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
          .not("email", "is", null)
          .limit(5);

        // Query CRM contacts
        const { data: contactData } = await supabase
          .from("crm_contacts")
          .select("id, first_name, last_name, email, name, company_name")
          .or(
            `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,name.ilike.%${q}%`
          )
          .not("email", "is", null)
          .order("last_contacted_at", {
            ascending: false,
            nullsFirst: false,
          })
          .limit(10);

        if (cancelled) return;

        const seen = new Set<string>();
        const merged: ContactResult[] = [];

        // Internal first
        for (const p of internalData ?? []) {
          if (!p.email || seen.has(p.email.toLowerCase())) continue;
          seen.add(p.email.toLowerCase());
          merged.push({
            id: p.id,
            name: p.full_name ?? "Unknown",
            email: p.email,
            source: "internal",
          });
        }

        // Then CRM contacts
        for (const c of contactData ?? []) {
          if (!c.email || seen.has(c.email.toLowerCase())) continue;
          seen.add(c.email.toLowerCase());
          const name = c.name
            ? c.name
            : [c.first_name, c.last_name].filter(Boolean).join(" ") ||
              "Unknown";
          merged.push({
            id: c.id,
            name,
            email: c.email,
            source: "contact",
            company: c.company_name,
          });
        }

        // Filter out already-selected emails
        const selectedLower = new Set(emails.map((e) => e.toLowerCase()));
        const filtered = merged.filter(
          (r) => !selectedLower.has(r.email.toLowerCase())
        );

        setResults(filtered);
        setIsOpen(filtered.length > 0 && isFocused);
        setHighlightIndex(-1);
      } catch {
        // Silently fail — user can still type freeform
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    search();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isFocused, emails]);

  const addEmail = useCallback(
    (email: string) => {
      const trimmed = email.trim();
      if (!trimmed) return;
      const updated = [...emails, trimmed];
      onChange(updated.join(", "));
    },
    [emails, onChange]
  );

  const removeEmail = useCallback(
    (index: number) => {
      const updated = emails.filter((_, i) => i !== index);
      onChange(updated.join(", "));
    },
    [emails, onChange]
  );

  const handleSelect = useCallback(
    (contact: ContactResult) => {
      justSelectedRef.current = true;
      addEmail(contact.email);
      setInputValue("");
      setIsOpen(false);
      setResults([]);
      inputRef.current?.focus();
    },
    [addEmail]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    // Navigate dropdown
    if (isOpen && results.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        return;
      } else if (e.key === "Enter" && highlightIndex >= 0) {
        e.preventDefault();
        handleSelect(results[highlightIndex]);
        return;
      } else if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
    }

    // Comma or Enter commits the current freeform input as an email
    if (
      (e.key === "," || e.key === ";" || e.key === "Enter") &&
      inputValue.trim()
    ) {
      e.preventDefault();
      addEmail(inputValue);
      setInputValue("");
      setIsOpen(false);
      return;
    }

    // Backspace on empty input removes the last email chip
    if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      removeEmail(emails.length - 1);
    }
  }

  function handleInputChange(val: string) {
    // If user pastes or types a comma, split and add completed emails
    if (val.includes(",") || val.includes(";")) {
      const parts = val.split(/[,;]+/);
      // All parts except the last are "completed" emails
      for (let i = 0; i < parts.length - 1; i++) {
        const trimmed = parts[i].trim();
        if (trimmed) addEmail(trimmed);
      }
      // The last part is the new in-progress text
      setInputValue(parts[parts.length - 1]);
    } else {
      setInputValue(val);
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            "flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-1",
            className
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {emails.map((email, i) => (
            <Badge
              key={`${email}-${i}`}
              variant="secondary"
              className="gap-1 pl-2 pr-1 py-0.5 text-xs font-normal"
            >
              {email}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEmail(i);
                }}
                className="ml-0.5 rounded-sm hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Input
            ref={inputRef}
            id={id}
            type="text"
            placeholder={emails.length === 0 ? placeholder : ""}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (results.length > 0 && inputValue.trim().length >= 2) {
                setIsOpen(true);
              }
            }}
            onBlur={() => {
              setIsFocused(false);
              // Commit any in-progress text on blur
              if (inputValue.trim()) {
                addEmail(inputValue);
                setInputValue("");
              }
              setTimeout(() => setIsOpen(false), 200);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            className="h-auto min-w-[120px] flex-1 border-0 bg-transparent p-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
          />
          {loading && (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[200px] overflow-y-auto p-1">
          {results.map((contact, index) => (
            <button
              key={contact.id}
              type="button"
              className={cn(
                "relative flex w-full cursor-default select-none items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                highlightIndex === index && "bg-accent text-accent-foreground"
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(contact)}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                {contact.source === "internal" ? (
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{contact.name}</span>
                  {contact.source === "internal" && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 leading-tight">
                      Team
                    </Badge>
                  )}
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {contact.email}
                  {contact.company && ` - ${contact.company}`}
                </span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
