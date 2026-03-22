"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Search, User, Loader2, Link2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { addBorrowerMemberAction, searchContactsForBorrower } from "@/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions";

interface ContactOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

interface AddBorrowerDialogProps {
  dealId: string;
  borrowingEntityId: string | null;
  existingContactIds: string[];
  onAdded: () => void;
  disabled?: boolean;
  /** "link" shows a small link icon button; default shows full button */
  variant?: "default" | "link";
}

function contactDisplayName(c: ContactOption): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
}

export function AddBorrowerDialog({
  dealId,
  borrowingEntityId,
  existingContactIds,
  onAdded,
  disabled,
  variant = "default",
}: AddBorrowerDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ContactOption | null>(null);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setSelected(null);
  }, [open]);

  useEffect(() => {
    if (!open || !borrowingEntityId) return;
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchContactsForBorrower(debouncedQuery, existingContactIds).then(
      ({ contacts, error }) => {
        if (cancelled) return;
        if (error) {
          showError(error);
          setResults([]);
        } else {
          setResults(contacts as ContactOption[]);
        }
        setSearching(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open, borrowingEntityId, existingContactIds]);

  const handleSelect = useCallback((contact: ContactOption) => {
    setSelected(contact);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!selected || !borrowingEntityId) return;
    setAdding(true);
    try {
      const result = await addBorrowerMemberAction(
        borrowingEntityId,
        dealId,
        selected.id
      );
      if (result.error) {
        showError(result.error);
      } else {
        showSuccess(`Linked ${contactDisplayName(selected)}`);
        setOpen(false);
        onAdded();
      }
    } finally {
      setAdding(false);
    }
  }, [selected, borrowingEntityId, dealId, onAdded]);

  return (
    <>
      {variant === "link" ? (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs text-muted-foreground"
          disabled={disabled}
          onClick={() => setOpen(true)}
          title="Link existing CRM contact as borrower"
        >
          <Link2 className="h-3.5 w-3.5" />
          Link Contact
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          <Link2 className="h-3.5 w-3.5" />
          Link Contact
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link CRM Contact</DialogTitle>
            <DialogDescription>
              Search for an existing contact to link as a borrower on this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search by name or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 p-0 h-8 focus-visible:ring-0"
                autoComplete="off"
              />
              {searching && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="max-h-[220px] overflow-y-auto space-y-1 border rounded-lg p-1">
              {debouncedQuery.length < 2 && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </div>
              )}
              {debouncedQuery.length >= 2 && results.length === 0 && !searching && (
                <EmptyState icon={Search} title="No contacts found" compact />
              )}
              {results.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    selected?.id === contact.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleSelect(contact)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{contactDisplayName(contact)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.email}
                      {contact.phone ? ` \u00B7 ${contact.phone}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selected || adding}
            >
              {adding && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Link as Borrower
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
