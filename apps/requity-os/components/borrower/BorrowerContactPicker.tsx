"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Search, Loader2, User, UserPlus, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { showSuccess, showError } from "@/lib/toast";
import {
  searchContactsForBorrower,
  linkContactToMemberAction,
  createContactAndLinkToMemberAction,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions";
import type { DealBorrowerMember } from "@/app/types/borrower";

interface ContactOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

interface BorrowerContactPickerProps {
  member: DealBorrowerMember;
  dealId: string;
  borrowingEntityId: string | null;
  existingContactIds: string[];
  /** Called after linking/creating a contact (structural change, triggers re-fetch) */
  onLinked: () => void;
  /** Called for optimistic name updates on unlinked members */
  onSaveName: (name: string) => void;
}

function contactDisplayName(c: ContactOption): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
}

function memberDisplayName(m: DealBorrowerMember): string {
  const direct = [m.first_name, m.last_name].filter(Boolean).join(" ");
  if (direct) return direct;
  const c = m.contact;
  if (c) return [c.first_name, c.last_name].filter(Boolean).join(" ") || "";
  return "";
}

export function BorrowerContactPicker({
  member,
  dealId,
  borrowingEntityId,
  existingContactIds,
  onLinked,
  onSaveName,
}: BorrowerContactPickerProps) {
  const hasContact = !!member.contact_id;
  const displayName = memberDisplayName(member);

  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [linking, setLinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const justSelectedRef = useRef(false);

  const debouncedQuery = useDebounce(query, 300);

  // Search contacts when debounced query changes
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (!editing) return;
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    searchContactsForBorrower(debouncedQuery, existingContactIds).then(
      ({ contacts, error }) => {
        if (cancelled) return;
        if (error) {
          setResults([]);
        } else {
          setResults(contacts as ContactOption[]);
          setIsOpen(true);
        }
        setSearching(false);
        setHighlightIndex(-1);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, editing, existingContactIds]);

  const startEdit = useCallback(() => {
    if (linking) return;
    setQuery(hasContact ? "" : displayName);
    setEditing(true);
    setResults([]);
    setIsOpen(false);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [displayName, hasContact, linking]);

  /** Link existing contact to this borrower member */
  const handleSelectContact = useCallback(
    async (contact: ContactOption) => {
      if (linking) return;
      justSelectedRef.current = true;
      setLinking(true);
      setEditing(false);
      setIsOpen(false);

      const result = await linkContactToMemberAction(
        member.id,
        dealId,
        contact.id
      );

      setLinking(false);
      if (result.error) {
        showError(result.error);
      } else {
        showSuccess(`Linked ${contactDisplayName(contact)}`);
        onLinked();
      }
    },
    [member.id, dealId, linking, onLinked]
  );

  /** Create new contact from the typed name and link to this member */
  const handleCreateNew = useCallback(async () => {
    if (linking) return;
    const trimmed = query.trim();
    if (!trimmed) return;

    setLinking(true);
    setEditing(false);
    setIsOpen(false);

    const parts = trimmed.split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

    const result = await createContactAndLinkToMemberAction(member.id, dealId, {
      first_name: firstName,
      last_name: lastName,
    });

    setLinking(false);
    if (result.error) {
      showError(result.error);
    } else {
      showSuccess("Contact created and linked");
      onLinked();
    }
  }, [member.id, dealId, query, linking, onLinked]);

  /** Commit as plain text (for unlinked members only) */
  const commitAsText = useCallback(() => {
    setEditing(false);
    setIsOpen(false);
    const trimmed = query.trim();
    if (trimmed !== displayName) {
      onSaveName(trimmed);
    }
  }, [query, displayName, onSaveName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditing(false);
        setIsOpen(false);
        return;
      }

      // If dropdown is open with results, handle arrow nav
      if (isOpen && results.length > 0) {
        // +1 for "Create new" option
        const totalItems = results.length + 1;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < results.length) {
            handleSelectContact(results[highlightIndex]);
          } else if (highlightIndex === results.length) {
            handleCreateNew();
          }
          return;
        }
      }

      // If no dropdown, Enter commits as text or creates new
      if (e.key === "Enter") {
        e.preventDefault();
        if (query.trim().length >= 2 && borrowingEntityId) {
          // If there's a typed name and entity exists, offer to create
          handleCreateNew();
        } else {
          commitAsText();
        }
      }
    },
    [isOpen, results, highlightIndex, handleSelectContact, handleCreateNew, commitAsText, query, borrowingEntityId]
  );

  const handleBlur = useCallback(() => {
    // Delay to allow click on dropdown items
    setTimeout(() => {
      if (editing) {
        commitAsText();
      }
    }, 200);
  }, [editing, commitAsText]);

  // Linked state: show name with contact indicator
  if (hasContact && !editing) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          type="button"
          onClick={startEdit}
          className={cn(
            "relative flex-1 text-left text-sm min-h-[32px] flex items-center rounded-md px-2 py-1 -mx-0.5 transition-colors",
            "border border-transparent",
            "group-hover/field:border-border group-hover/field:bg-muted/40 cursor-pointer"
          )}
        >
          <Link2 className="h-3 w-3 mr-1.5 text-primary shrink-0" />
          <span className="truncate font-medium">{displayName}</span>
        </button>
      </div>
    );
  }

  // Unlinked state (rest): show name with placeholder
  if (!editing) {
    return (
      <div className="group/field min-w-0">
        <button
          type="button"
          onClick={startEdit}
          className={cn(
            "relative w-full text-left text-sm min-h-[32px] flex items-center rounded-md px-2 py-1 -mx-0.5 transition-colors",
            "border border-transparent",
            "group-hover/field:border-border group-hover/field:bg-muted/40 cursor-pointer"
          )}
        >
          {displayName ? (
            <span className="truncate">{displayName}</span>
          ) : (
            <span className="text-muted-foreground/40 truncate">Name</span>
          )}
        </button>
      </div>
    );
  }

  // Editing state: search input with dropdown
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div className="relative min-w-0">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="Search contacts or type name..."
            className="h-8 text-sm bg-transparent pr-8"
            autoComplete="off"
            disabled={linking}
          />
          {searching && (
            <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
          )}
          {linking && (
            <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-primary pointer-events-none" />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-0 w-[320px]"
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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectContact(contact)}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="truncate font-medium">
                  {contactDisplayName(contact)}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {contact.email}
                  {contact.phone ? ` · ${contact.phone}` : ""}
                </span>
              </div>
            </button>
          ))}
          {/* Create new contact option */}
          {query.trim().length >= 2 && (
            <>
              {results.length > 0 && <div className="border-t my-1" />}
              <button
                type="button"
                className={cn(
                  "relative flex w-full cursor-default select-none items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  highlightIndex === results.length && "bg-accent text-accent-foreground"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCreateNew}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <UserPlus className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="truncate font-medium">
                    Create &quot;{query.trim()}&quot;
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    New CRM contact
                  </span>
                </div>
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
