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
import { Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { RelationshipPicker } from "@/components/shared/RelationshipPicker";
import type { ContactSearchResult } from "@/lib/actions/relationship-actions";
import {
  addDealContact,
  assignBrokerContact,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";

interface AssignPartyDialogProps {
  dealId: string;
  open: boolean;
  onClose: () => void;
  partyType: "borrower" | "broker";
  existingBorrowerCount?: number;
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
  const [saving, setSaving] = useState(false);

  // Reset when dialog opens
  useEffect(() => {
    if (open) setSaving(false);
  }, [open]);

  const handleSelect = useCallback(
    async (entity: ContactSearchResult) => {
      setSaving(true);
      try {
        if (partyType === "borrower") {
          const role = existingBorrowerCount === 0 ? "primary" : ("co_borrower" as const);
          const res = await addDealContact(dealId, entity.id, role);
          if ("error" in res && res.error) {
            showError(`Could not add borrower: ${res.error}`);
            setSaving(false);
            return;
          }
          showSuccess("Borrower added");
        } else {
          const res = await assignBrokerContact(dealId, entity.id);
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
    },
    [dealId, partyType, existingBorrowerCount, onClose]
  );

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
          {saving ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RelationshipPicker
              entityType="contact"
              excludeIds={excludeContactIds}
              placeholder="Search contacts..."
              onSelect={(entity) => handleSelect(entity as ContactSearchResult)}
              onCreate={(entity) => handleSelect(entity as ContactSearchResult)}
              popoverWidth="var(--radix-popover-trigger-width)"
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
