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
import { Search, User, Loader2, UserPlus, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addBorrowerMemberAction, searchContactsForBorrower } from "@/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions";
import { CreateContactDialog } from "./CreateContactDialog";

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
}: AddBorrowerDialogProps) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ContactOption | null>(null);
  const [adding, setAdding] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setSelected(null);
    setProfilePreview(null);
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
          toast.error(error);
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
    setProfilePreview(null);
    // In a full implementation we could fetch borrower_profile for this contact
    // and set profilePreview. For now we show a generic message.
    setProfilePreview("No existing borrower profile. Default values will be used.");
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
        toast.error(result.error);
      } else {
        toast.success(`Added ${contactDisplayName(selected)}`);
        setOpen(false);
        onAdded();
      }
    } finally {
      setAdding(false);
    }
  }, [selected, borrowingEntityId, dealId, onAdded]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-3.5 w-3.5" />
        Add Borrower
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Borrower</DialogTitle>
            <DialogDescription>
              Search for a contact to add as a borrower, or create a new contact.
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
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No contacts found
                </div>
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
                      {contact.phone ? ` · ${contact.phone}` : ""}
                    </p>
                  </div>
                </button>
              ))}
              <button
                type="button"
                className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-primary hover:bg-accent border-t transition-colors disabled:opacity-50 disabled:pointer-events-none"
                onClick={() => setCreateOpen(true)}
                disabled={!borrowingEntityId || disabled}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                Create new contact
              </button>
            </div>
            {selected && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                {profilePreview}
              </div>
            )}
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
              Add Borrower
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CreateContactDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        dealId={dealId}
        borrowingEntityId={borrowingEntityId}
        onSuccess={() => {
          setCreateOpen(false);
          setOpen(false);
          onAdded();
        }}
        disabled={disabled}
      />
    </>
  );
}
