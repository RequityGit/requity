"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Search, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  name: string | null;
  company_name: string | null;
}

interface ContactEmailComboboxProps {
  value: string;
  onChange: (email: string) => void;
  onContactSelect: (contact: {
    id: string;
    email: string;
    name: string;
  }) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  className?: string;
}

export function ContactEmailCombobox({
  value,
  onChange,
  onContactSelect,
  placeholder = "recipient@example.com",
  id,
  required,
  className,
}: ContactEmailComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<ContactResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const justSelectedRef = useRef(false);

  const debouncedQuery = useDebounce(value, 200);

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

    async function searchContacts() {
      setLoading(true);
      try {
        const supabase = createClient();
        const q = debouncedQuery.trim();
        const { data } = await supabase
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

        if (!cancelled && data) {
          setResults(data);
          setIsOpen(data.length > 0 && isFocused);
          setHighlightIndex(-1);
        }
      } catch {
        // Silently fail - user can still type freeform
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    searchContacts();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isFocused]);

  const handleSelect = useCallback(
    (contact: ContactResult) => {
      const displayName = contact.name
        ? contact.name
        : [contact.first_name, contact.last_name].filter(Boolean).join(" ");

      justSelectedRef.current = true;
      onContactSelect({
        id: contact.id,
        email: contact.email!,
        name: displayName,
      });
      setIsOpen(false);
      setResults([]);
      // Re-focus the input after selection
      inputRef.current?.focus();
    },
    [onContactSelect]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  function getDisplayName(contact: ContactResult): string {
    if (contact.name) return contact.name;
    return [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unknown";
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div className={cn("relative flex-1", className)}>
          <Input
            ref={inputRef}
            id={id}
            type="email"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (results.length > 0 && value.trim().length >= 2) {
                setIsOpen(true);
              }
            }}
            onBlur={() => {
              setIsFocused(false);
              // Delay closing to allow click on dropdown items
              setTimeout(() => setIsOpen(false), 200);
            }}
            onKeyDown={handleKeyDown}
            required={required}
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {results.length} contact{results.length !== 1 ? "s" : ""} found
          </span>
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          {results.map((contact, index) => (
            <button
              key={contact.id}
              type="button"
              className={cn(
                "relative flex w-full cursor-default select-none items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                highlightIndex === index && "bg-accent text-accent-foreground"
              )}
              onMouseDown={(e) => {
                // Prevent input blur before click registers
                e.preventDefault();
              }}
              onClick={() => handleSelect(contact)}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="truncate font-medium">
                  {getDisplayName(contact)}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {contact.email}
                  {contact.company_name && ` - ${contact.company_name}`}
                </span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
