"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createContactAndAddAsBorrowerAction } from "@/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions";

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  borrowingEntityId: string | null;
  onSuccess: () => void;
  disabled?: boolean;
}

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
};

export function CreateContactDialog({
  open,
  onOpenChange,
  dealId,
  borrowingEntityId,
  onSuccess,
  disabled,
}: CreateContactDialogProps) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setForm(initialForm);
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!borrowingEntityId) return;
      const first = form.first_name.trim();
      const last = form.last_name.trim();
      if (!first && !last) {
        toast.error("First name or last name is required.");
        return;
      }
      setSubmitting(true);
      try {
        const result = await createContactAndAddAsBorrowerAction(dealId, borrowingEntityId, {
          first_name: first || "",
          last_name: last || "",
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
        });
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Contact created and added as borrower");
          onOpenChange(false);
          onSuccess();
        }
      } finally {
        setSubmitting(false);
      }
    },
    [dealId, borrowingEntityId, form, onOpenChange, onSuccess]
  );

  const canSubmit =
    (form.first_name.trim() || form.last_name.trim()) && !submitting && !!borrowingEntityId && !disabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new contact</DialogTitle>
          <DialogDescription>
            Add a contact to the CRM and add them as a borrower for this deal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="create-first-name">First name</Label>
              <Input
                id="create-first-name"
                value={form.first_name}
                onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                placeholder="First name"
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-last-name">Last name</Label>
              <Input
                id="create-last-name"
                value={form.last_name}
                onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                placeholder="Last name"
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-phone">Phone</Label>
            <Input
              id="create-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Phone"
              autoComplete="tel"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Create & add as borrower
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
