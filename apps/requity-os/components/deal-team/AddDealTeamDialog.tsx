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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { searchContactsForDeal } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { addDealTeamContactAction, updateDealTeamContactAction } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { DEAL_TEAM_ROLES } from "@/app/types/deal-team";
import type { DealTeamContact } from "@/app/types/deal-team";

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

interface AddDealTeamDialogProps {
  dealId: string;
  open: boolean;
  onClose: () => void;
  onAdd: (contact: DealTeamContact) => void;
  editContact: DealTeamContact | null;
  onEditDone?: () => void;
}

export function AddDealTeamDialog({
  dealId,
  open,
  onClose,
  onAdd,
  editContact,
  onEditDone,
}: AddDealTeamDialogProps) {
  const isEdit = !!editContact;
  const [role, setRole] = useState("");
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactPreview, setContactPreview] = useState<SearchContact | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchContact[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 250);

  useEffect(() => {
    if (!open) return;
    if (isEdit && editContact) {
      setRole(editContact.role);
      setContactId(editContact.contact_id);
      if (editContact.contact) {
        setContactPreview({
          id: editContact.contact.id,
          first_name: editContact.contact.first_name,
          last_name: editContact.contact.last_name,
          email: editContact.contact.email,
          phone: editContact.contact.phone,
          company_name: editContact.contact.company_name,
        });
      } else {
        setContactPreview(null);
        setManualName(editContact.manual_name);
        setManualCompany(editContact.manual_company);
        setManualPhone(editContact.manual_phone);
        setManualEmail(editContact.manual_email);
      }
      setNotes(editContact.notes);
    } else {
      setRole("");
      setContactId(null);
      setContactPreview(null);
      setManualName("");
      setManualCompany("");
      setManualPhone("");
      setManualEmail("");
      setNotes("");
    }
    setError(null);
  }, [open, isEdit, editContact]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchContactsForDeal(debouncedQuery).then((res) => {
      if (!cancelled && res.contacts) {
        setSearchResults(res.contacts as SearchContact[]);
      }
      if (!cancelled) setSearching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const showManual = !contactId && !contactPreview;
  const canSave =
    role &&
    (contactId ||
      contactPreview ||
      manualName.trim());

  const handleSelectContact = useCallback((c: SearchContact) => {
    setContactId(c.id);
    setContactPreview(c);
    setManualName("");
    setManualCompany("");
    setManualPhone("");
    setManualEmail("");
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleClearContact = useCallback(() => {
    setContactId(null);
    setContactPreview(null);
  }, []);

  const handleSubmit = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && editContact) {
        const result = await updateDealTeamContactAction(editContact.id, dealId, {
          role,
          contact_id: contactId,
          manual_name: showManual ? manualName : "",
          manual_company: showManual ? manualCompany : "",
          manual_phone: showManual ? manualPhone : "",
          manual_email: showManual ? manualEmail : "",
          notes: notes || undefined,
        });
        if (result.error) {
          setError(result.error);
        } else {
          if (result.data) onAdd(result.data);
          onEditDone?.();
          onClose();
        }
      } else {
        const result = await addDealTeamContactAction(dealId, {
          role,
          contact_id: contactId || undefined,
          manual_name: showManual ? manualName : undefined,
          manual_company: showManual ? manualCompany : undefined,
          manual_phone: showManual ? manualPhone : undefined,
          manual_email: showManual ? manualEmail : undefined,
          notes: notes || undefined,
        });
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          onAdd(result.data);
          onClose();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit deal team contact" : "Add deal team contact"}</DialogTitle>
          <DialogDescription>
            Link an existing contact or enter details manually. Role is required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                {DEAL_TEAM_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Link to existing contact (optional)</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-9"
                >
                  {contactPreview ? (
                    <span className="truncate">
                      {contactDisplayName(contactPreview)}
                      {contactPreview.company_name && ` · ${contactPreview.company_name}`}
                    </span>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      Search by name or email...
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="flex items-center gap-2 border-b px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 border-0 p-0 shadow-none focus-visible:ring-0"
                    autoComplete="off"
                  />
                  {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
                <div className="max-h-[220px] overflow-y-auto p-1">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                      onClick={() => handleSelectContact(c)}
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{contactDisplayName(c)}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {c.email}
                          {c.company_name ? ` · ${c.company_name}` : ""}
                        </div>
                      </div>
                    </button>
                  ))}
                  {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No contacts found
                    </div>
                  )}
                </div>
                {contactPreview && (
                  <div className="border-t px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs w-full"
                      onClick={handleClearContact}
                    >
                      Clear selection
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {contactPreview && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Using: {contactDisplayName(contactPreview)}
              {contactPreview.email && ` · ${contactPreview.email}`}
              {contactPreview.phone && ` · ${contactPreview.phone}`}
            </div>
          )}

          {showManual && (
            <>
              <div>
                <Label>Name {!contactPreview && !contactId ? "(required if not linked)" : ""}</Label>
                <Input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </>
          )}

          <div>
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave || saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {isEdit ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
