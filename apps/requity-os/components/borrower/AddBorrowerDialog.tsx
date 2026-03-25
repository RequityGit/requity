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
import { UserPlus, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { RelationshipPicker } from "@/components/shared/RelationshipPicker";
import { addBorrowerMemberAction } from "@/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions";
import type { ContactSearchResult } from "@/lib/actions/relationship-actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AddBorrowerDialogProps {
  dealId: string;
  borrowingEntityId: string | null;
  existingContactIds: string[];
  onAdded: () => void;
  disabled?: boolean;
}

export function AddBorrowerDialog({
  dealId,
  borrowingEntityId,
  existingContactIds,
  onAdded,
  disabled,
}: AddBorrowerDialogProps) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleSelect = useCallback(
    async (entity: ContactSearchResult) => {
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
          showSuccess(`${name} added as borrower`);
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
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
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {disabled ? "Maximum of 5 borrowers per deal" : "Search or create a contact to add as borrower"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Borrower</DialogTitle>
            <DialogDescription>
              Search for an existing contact or create a new one to add as a borrower.
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
