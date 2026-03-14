"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { removeDealTeamContactAction } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { DealTeamRow } from "./DealTeamRow";
import { AddDealTeamDialog } from "./AddDealTeamDialog";
import type { DealTeamContact } from "@/app/types/deal-team";

interface DealTeamSectionProps {
  dealId: string;
  initialContacts: DealTeamContact[];
}

export function DealTeamSection({ dealId, initialContacts }: DealTeamSectionProps) {
  const [contacts, setContacts] = useState<DealTeamContact[]>(initialContacts);
  const [isAdding, setIsAdding] = useState(false);
  const [editingContact, setEditingContact] = useState<DealTeamContact | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const handleAdd = useCallback((newContact: DealTeamContact) => {
    setContacts((prev) => [...prev, newContact]);
    setIsAdding(false);
  }, []);

  const handleEdit = useCallback((contact: DealTeamContact) => {
    setEditingContact(contact);
  }, []);

  const handleEditDone = useCallback(() => {
    setEditingContact(null);
    // Refetch would be ideal; for now we rely on parent revalidation. Update local state from edit result in AddDealTeamDialog.
  }, []);

  const handleUpdateAfterEdit = useCallback((updated: DealTeamContact) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    setEditingContact(null);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setRemoving(true);
    try {
      const result = await removeDealTeamContactAction(deleteId, dealId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setContacts((prev) => prev.filter((c) => c.id !== deleteId));
        toast.success("Deal team contact removed");
      }
    } finally {
      setRemoving(false);
      setDeleteId(null);
    }
  }, [deleteId, dealId]);

  return (
    <>
      <Card className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-border/60">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Deal Team
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setIsAdding(true)}
          >
            <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Add
          </Button>
        </div>

        <div className="px-4 py-3">
          {contacts.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No deal team contacts added.
              </p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                Add broker, title company, insurance, or other contacts.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={() => setIsAdding(true)}
              >
                <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                Add contact
              </Button>
            </div>
          ) : (
            <div className="space-y-0">
              {contacts.map((c) => (
                <DealTeamRow
                  key={c.id}
                  contact={c}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      <AddDealTeamDialog
        dealId={dealId}
        open={isAdding || !!editingContact}
        onClose={() => {
          setIsAdding(false);
          setEditingContact(null);
        }}
        onAdd={editingContact ? handleUpdateAfterEdit : handleAdd}
        editContact={editingContact}
        onEditDone={handleEditDone}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove deal team contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the contact from the deal team. They will not be deleted from the CRM.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
