"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Loader2 } from "lucide-react";
import { addDealTeamContactAction, updateDealTeamContactAction } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { DEAL_TEAM_ROLES } from "@/app/types/deal-team";
import type { DealTeamContact } from "@/app/types/deal-team";
import { showError } from "@/lib/toast";
import { RelationshipPicker } from "@/components/shared/RelationshipPicker";
import type { ContactSearchResult, CompanySearchResult } from "@/lib/actions/relationship-actions";

function contactDisplayName(c: { first_name: string | null; last_name: string | null }): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || "Unknown";
}

interface AddDealTeamDialogProps {
  dealId: string;
  open: boolean;
  onClose: () => void;
  onAdd: (contact: DealTeamContact) => void;
  editContact: DealTeamContact | null;
  onEditDone?: () => void;
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
  const [contactPreview, setContactPreview] = useState<{ id: string; label: string; subtitle?: string } | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Company state
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyPreview, setCompanyPreview] = useState<{ id: string; label: string } | null>(null);

  // Reset all state on open/edit
  useEffect(() => {
    if (!open) return;
    if (isEdit && editContact) {
      setRole(editContact.role);
      setContactId(editContact.contact_id);
      if (editContact.contact) {
        const name = contactDisplayName(editContact.contact);
        setContactPreview({
          id: editContact.contact.id,
          label: name,
          subtitle: editContact.contact.email || undefined,
        });
      } else {
        setContactPreview(null);
        setManualName(editContact.manual_name);
        setManualCompany(editContact.manual_company);
        setManualPhone(editContact.manual_phone);
        setManualEmail(editContact.manual_email);
      }
      if (editContact.company) {
        setCompanyId(editContact.company.id);
        setCompanyPreview({ id: editContact.company.id, label: editContact.company.name });
      } else {
        setCompanyId(null);
        setCompanyPreview(null);
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
      setCompanyPreview(null);
    }
    setError(null);
  }, [open, isEdit, editContact, initialRole]);

  const showManual = !contactId && !contactPreview;
  const canSave = role && (contactId || contactPreview || manualName.trim());

  const handleSelectContact = useCallback((entity: ContactSearchResult) => {
    setContactId(entity.id);
    const name = contactDisplayName(entity);
    setContactPreview({
      id: entity.id,
      label: name,
      subtitle: [entity.email, entity.company_name].filter(Boolean).join(" \u00b7 ") || undefined,
    });
    setManualName("");
    setManualCompany("");
    setManualPhone("");
    setManualEmail("");
  }, []);

  const handleClearContact = useCallback(() => {
    setContactId(null);
    setContactPreview(null);
  }, []);

  const handleSelectCompany = useCallback((entity: CompanySearchResult) => {
    setCompanyId(entity.id);
    setCompanyPreview({ id: entity.id, label: entity.name });
    setManualCompany("");
  }, []);

  const handleClearCompany = useCallback(() => {
    setCompanyId(null);
    setCompanyPreview(null);
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

          {/* Contact picker */}
          <div>
            <Label>Link to existing contact (optional)</Label>
            <RelationshipPicker
              entityType="contact"
              placeholder="Search by name or email..."
              value={contactPreview}
              clearable
              onClear={handleClearContact}
              onSelect={(entity) => handleSelectContact(entity as ContactSearchResult)}
              onCreate={(entity) => handleSelectContact(entity as ContactSearchResult)}
              popoverWidth="var(--radix-popover-trigger-width)"
            />
          </div>

          {contactPreview && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Using: {contactPreview.label}
              {contactPreview.subtitle && ` \u00b7 ${contactPreview.subtitle}`}
            </div>
          )}

          {showManual && (
            <>
              <div>
                <Label>Name (required if not linked)</Label>
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

          {/* Company picker */}
          <div>
            <Label>Company</Label>
            <RelationshipPicker
              entityType="company"
              placeholder="Search companies..."
              value={companyPreview}
              clearable
              onClear={handleClearCompany}
              onSelect={(entity) => handleSelectCompany(entity as CompanySearchResult)}
              onCreate={(entity) => handleSelectCompany(entity as CompanySearchResult)}
              popoverWidth="var(--radix-popover-trigger-width)"
            />
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
