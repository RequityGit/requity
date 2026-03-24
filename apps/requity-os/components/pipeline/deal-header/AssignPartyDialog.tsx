"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Loader2, User } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import {
  searchContactsForDeal,
  addDealContact,
  assignBrokerContact,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { showSuccess, showError } from "@/lib/toast";

interface SearchContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
}

function contactDisplayName(c: SearchContact): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || "Unknown";
}

interface AssignPartyDialogProps {
  dealId: string;
  open: boolean;
  onClose: () => void;
  partyType: "borrower" | "broker";
  /** Number of existing borrowers on this deal (for role assignment) */
  existingBorrowerCount?: number;
  /** Contact IDs to exclude from search results (already assigned) */
  excludeContactIds?: string[];
}

export function AssignPartyDialog({
  dealId,
  open,
  onClose,
  partyType,
  existingBorrowerCount = 0,
  excludeContactIds = [],
}: AssignPartyDialogProps) {
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactPreview, setContactPreview] = useState<SearchContact | null>(null);
  const [saving, setSaving] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchContact[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 250);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) return;
    setContactId(null);
    setContactPreview(null);
    setSearchQuery("");
    setSearchResults([]);
    setSaving(false);
  }, [open]);

  // Search contacts
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchContactsForDeal(debouncedQuery).then((res) => {
      if (cancelled) return;
      setSearching(false);
      if (res.contacts) {
        setSearchResults(
          (res.contacts as SearchContact[]).filter(
            (c) => !excludeContactIds.includes(c.id)
          )
        );
      }
    });
    return () => { cancelled = true; };
  }, [debouncedQuery, excludeContactIds]);

  const selectContact = useCallback((c: SearchContact) => {
    setContactId(c.id);
    setContactPreview(c);
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  const handleSave = async () => {
    if (!contactId) return;
    setSaving(true);
    try {
      if (partyType === "borrower") {
        const role = existingBorrowerCount === 0 ? "primary" : "co_borrower" as const;
        const res = await addDealContact(dealId, contactId, role);
        if ("error" in res && res.error) {
          showError(`Could not add borrower: ${res.error}`);
          setSaving(false);
          return;
        }
        showSuccess("Borrower added");
      } else {
        // broker
        const res = await assignBrokerContact(dealId, contactId);
        if ("error" in res && res.error) {
          showError(`Could not assign broker: ${res.error}`);
          setSaving(false);
          return;
        }
        showSuccess("Broker assigned");
      }
      onClose();
    } catch {
      showError("Could not assign contact");
    } finally {
      setSaving(false);
    }
  };

  const title = partyType === "borrower" ? "Assign Borrower" : "Assign Broker";
  const description = partyType === "borrower"
    ? "Search for a contact to add as a borrower on this deal."
    : "Search for a contact to assign as the broker on this deal.";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Contact</label>
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-2 w-full rounded-md border px-3 py-2 text-sm bg-transparent",
                  "hover:bg-muted/40 transition-colors text-left",
                  contactPreview ? "text-foreground" : "text-muted-foreground"
                )}
                onClick={() => setSearchOpen(true)}
              >
                {contactPreview ? (
                  <>
                    <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{contactDisplayName(contactPreview)}</span>
                    {contactPreview.email && (
                      <span className="text-xs text-muted-foreground ml-auto truncate">{contactPreview.email}</span>
                    )}
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5 shrink-0" />
                    Search contacts...
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <div className="p-2 border-b">
                <Input
                  ref={inputRef}
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {searching && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!searching && searchResults.length === 0 && debouncedQuery.length >= 2 && (
                  <EmptyState compact title="No contacts found" />
                )}
                {!searching && searchResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left border-0 bg-transparent cursor-pointer"
                    onClick={() => selectContact(c)}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-medium">
                      {(c.first_name?.[0] ?? "").toUpperCase()}{(c.last_name?.[0] ?? "").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{contactDisplayName(c)}</div>
                      {c.email && <div className="text-[10px] text-muted-foreground truncate">{c.email}</div>}
                    </div>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !contactId}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
