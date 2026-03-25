"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link2, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { RelationshipPicker } from "@/components/shared/RelationshipPicker";
import { addBorrowerMemberAction } from "@/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions";
import type { ContactSearchResult } from "@/lib/actions/relationship-actions";

interface AddBorrowerDialogProps {
  dealId: string;
  borrowingEntityId: string | null;
  existingContactIds: string[];
  onAdded: () => void;
  disabled?: boolean;
  /** "link" shows a small link icon button; default shows full button */
  variant?: "default" | "link";
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
  const [adding, setAdding] = useState(false);

  const handleSelect = useCallback(
    async (entity: ContactSearchResult) => {
      if (!borrowingEntityId) return;
      setAdding(true);
      try {
        const result = await addBorrowerMemberAction(
          borrowingEntityId,
          dealId,
          entity.id
        );
        if (result.error) {
          showError(result.error);
        } else {
          const name = [entity.first_name, entity.last_name].filter(Boolean).join(" ") || "Contact";
          showSuccess(`Linked ${name}`);
          setOpen(false);
          onAdded();
        }
      } finally {
        setAdding(false);
      }
    },
    [borrowingEntityId, dealId, onAdded]
  );

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
          <div className="py-2">
            {adding && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!adding && (
              <RelationshipPicker
                entityType="contact"
                excludeIds={existingContactIds}
                placeholder="Search by name or email..."
                onSelect={(entity) => handleSelect(entity as ContactSearchResult)}
                onCreate={(entity) => handleSelect(entity as ContactSearchResult)}
                disabled={adding}
                popoverWidth="100%"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
