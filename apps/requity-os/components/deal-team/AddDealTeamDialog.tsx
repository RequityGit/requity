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
import { Search, Loader2, User, Building2, X, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { createClient } from "@/lib/supabase/client";
import { searchContactsForDeal } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { addDealTeamContactAction, updateDealTeamContactAction } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { addCompanyAction } from "@/app/(authenticated)/(admin)/companies/actions";
import { DEAL_TEAM_ROLES } from "@/app/types/deal-team";
import type { DealTeamContact } from "@/app/types/deal-team";
import { CRM_COMPANY_TYPES } from "@/lib/constants";
import { showError } from "@/lib/toast";

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
  /** Pre-select and optionally lock the role (e.g. when assigning from popover slot) */
  initialRole?: string;
  roleLocked?: boolean;
}

export function AddDealTeamDialog({
  dealId,
  open,
  onClose,
  onAdd,
  editContact,
  onEditDone,
  initialRole,
  roleLocked = false,
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

  // Contact search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchContact[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 250);

  // Company picker state
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyType, setNewCompanyType] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Fetch companies for search
  const fetchCompanies = useCallback(async (q: string) => {
    const supabase = createClient();
    let query = supabase
      .from("companies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .limit(10);
    if (q.trim()) {
      query = query.ilike("name", `%${q}%`);
    }
    const { data } = await query;
    setCompanies(data ?? []);
  }, []);

  useEffect(() => {
    if (open) {
      fetchCompanies("");
    }
  }, [open, fetchCompanies]);

  useEffect(() => {
    if (companySearch.trim()) {
      const timer = setTimeout(() => fetchCompanies(companySearch), 300);
      return () => clearTimeout(timer);
    } else {
      fetchCompanies("");
    }
  }, [companySearch, fetchCompanies]);

  // Reset all state on open/edit
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
      // Restore company selection
      if (editContact.company) {
        setCompanyId(editContact.company.id);
        setCompanyName(editContact.company.name);
      } else {
        setCompanyId(null);
        setCompanyName("");
      }
      setNotes(editContact.notes);
    } else {
      setRole(initialRole ?? "");
      setContactId(null);
      setContactPreview(null);
      setManualName("");
      setManualCompany("");
      setManualPhone("");
      setManualEmail("");
      setNotes("");
      setCompanyId(null);
      setCompanyName("");
    }
    setError(null);
    setCompanySearch("");
    setShowCompanyDropdown(false);
    setShowNewCompanyForm(false);
    setNewCompanyName("");
    setNewCompanyType("");
  }, [open, isEdit, editContact, initialRole]);

  // Contact search effect
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

  const handleClearCompany = useCallback(() => {
    setCompanyId(null);
    setCompanyName("");
  }, []);

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim() || !newCompanyType) return;
    setCreatingCompany(true);
    try {
      const result = await addCompanyAction({
        name: newCompanyName.trim(),
        company_type: newCompanyType,
      });
      if ("error" in result && result.error) {
        showError("Could not create company", result.error);
      } else if (result.id) {
        setCompanyId(result.id);
        setCompanyName(newCompanyName.trim());
        setShowNewCompanyForm(false);
        setNewCompanyName("");
        setNewCompanyType("");
        setManualCompany("");
        // Refresh the companies list
        fetchCompanies("");
      }
    } catch (err: unknown) {
      showError("Could not create company", err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && editContact) {
        const result = await updateDealTeamContactAction(editContact.id, dealId, {
          role,
          contact_id: contactId,
          company_id: companyId,
          manual_name: showManual ? manualName : "",
          manual_company: showManual && !companyId ? manualCompany : "",
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
          company_id: companyId || undefined,
          manual_name: showManual ? manualName : undefined,
          manual_company: showManual && !companyId ? manualCompany : undefined,
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
            <Select value={role} onValueChange={setRole} disabled={roleLocked}>
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
                    <EmptyState icon={Search} title="No contacts found" compact />
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

          {/* Company picker - shown for both linked contacts and manual entry */}
          <div>
            <Label>Company</Label>
            {companyId ? (
              <div className="flex h-9 items-center rounded-md border bg-muted/50 pl-2.5 pr-1">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="ml-2 flex-1 truncate text-sm font-medium">
                  {companies.find((c) => c.id === companyId)?.name || companyName}
                </span>
                <button
                  type="button"
                  onClick={handleClearCompany}
                  className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground rq-transition hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : showNewCompanyForm ? (
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Create New Company</p>
                  <button
                    type="button"
                    onClick={() => setShowNewCompanyForm(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground rq-transition hover:bg-muted hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">
                    Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={newCompanyType} onValueChange={setNewCompanyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CRM_COMPANY_TYPES.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value}>
                          {ct.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={!newCompanyName.trim() || !newCompanyType || creatingCompany}
                  onClick={handleCreateCompany}
                >
                  {creatingCompany && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Create Company
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  value={companySearch}
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    setShowCompanyDropdown(true);
                  }}
                  onFocus={() => setShowCompanyDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowCompanyDropdown(false), 200);
                  }}
                  placeholder="Search companies..."
                />
                {showCompanyDropdown && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                    {companies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent rq-transition"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setCompanyId(c.id);
                          setCompanyName(c.name);
                          setCompanySearch("");
                          setShowCompanyDropdown(false);
                          setManualCompany("");
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{c.name}</span>
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-accent flex items-center gap-2 border-t rq-transition"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setShowNewCompanyForm(true);
                        setNewCompanyName(companySearch);
                        setShowCompanyDropdown(false);
                        setCompanySearch("");
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create New Company
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
